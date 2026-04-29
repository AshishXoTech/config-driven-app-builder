import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../db/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production-42x9z";
const SALT_ROUNDS = 10;

/**
 * Auth Token Strategy:
 * - Access token: short-lived JWT (15 min), stateless, carried via httpOnly cookie
 * - Refresh token: opaque random string (7 day), stored in DB for revocation
 *
 * Trade-off: Storing refresh tokens in DB (vs Redis) adds a DB query per refresh,
 * but eliminates the need for a Redis dependency. Acceptable for this scale.
 */
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

function signAccessToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

/**
 * Store a new refresh token in the DB, linked to the user.
 * Old tokens are NOT deleted here — the user may have multiple devices.
 */
async function createRefreshToken(userId: number): Promise<string> {
  const token = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

/**
 * Issue both access + refresh tokens for a user.
 */
async function issueTokenPair(userId: number) {
  const accessToken = signAccessToken(userId);
  const refreshToken = await createRefreshToken(userId);
  return { accessToken, refreshToken, userId };
}

// ─── OTP ────────────────────────────────────────────────────────────

// Trade-off: In-memory Map for OTPs is simple and zero-dependency,
// but in a multi-instance production environment, this MUST be Redis.
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function sendOtp(email: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(email, { code, expiresAt });

  console.log(`\n=========================================\n`);
  console.log(`📧 MOCK EMAIL TO ${email}`);
  console.log(`🔑 Your login code is: ${code}`);
  console.log(`\n=========================================\n`);
}

export async function loginWithOtp(email: string, code: string) {
  const record = otpStore.get(email);
  if (!record || record.code !== code || Date.now() > record.expiresAt) {
    throw new AuthError("Invalid or expired OTP");
  }

  otpStore.delete(email);

  let user = await prisma.userAuth.findUnique({ where: { email } });

  if (!user) {
    const randomPass = await bcrypt.hash(Math.random().toString(36), SALT_ROUNDS);
    user = await prisma.userAuth.create({
      data: { email, password: randomPass },
    });
  }

  return issueTokenPair(user.id);
}

// ─── Signup / Login ─────────────────────────────────────────────────

export async function signup(email: string, password: string) {
  const existing = await prisma.userAuth.findUnique({ where: { email } });
  if (existing) throw new AuthError("Email already registered");

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.userAuth.create({
    data: { email, password: hashedPassword },
  });

  return issueTokenPair(user.id);
}

export async function login(email: string, password: string) {
  const user = await prisma.userAuth.findUnique({ where: { email } });
  if (!user) throw new AuthError("Invalid credentials");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AuthError("Invalid credentials");

  return issueTokenPair(user.id);
}

// ─── Refresh ────────────────────────────────────────────────────────

/**
 * Rotate refresh token: validate old one, delete it, issue new pair.
 * This is the core of the session lifecycle — token rotation prevents replay attacks.
 */
export async function refreshSession(oldRefreshToken: string) {
  console.log("Refreshing token:", oldRefreshToken);

  try {
    const stored = await prisma.refreshToken.findFirst({
      where: { token: oldRefreshToken },
    });

    if (!stored) {
      throw new AuthError("Invalid or expired refresh token");
    }

    try {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
    } catch {
      throw new AuthError("Token already used or invalid");
    }

    if (stored.expiresAt < new Date()) {
      throw new AuthError("Invalid or expired refresh token");
    }

    return issueTokenPair(stored.userId);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Refresh error:", error);
    throw new AuthError("Authentication failed");
  }
}

/**
 * Logout: delete the specific refresh token to revoke this session.
 */
export async function revokeRefreshToken(token: string) {
  try {
    await prisma.refreshToken.delete({ where: { token } });
  } catch {
    // Token may already be deleted — ignore
  }
}
