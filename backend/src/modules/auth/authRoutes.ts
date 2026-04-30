import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
  signup, login, sendOtp, loginWithOtp,
  refreshSession, revokeRefreshToken, AuthError,
} from "./authService";

const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: "Too many login attempts, please try again later" },
});

const authSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Cookie config for access token (short-lived, 15 min).
 */
const accessCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/"
};

/**
 * Cookie config for refresh token (long-lived, 7 days).
 * path: "/auth" restricts it to auth routes only — never sent to /api.
 */
const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/"
};

/**
 * Helper: set both cookies and respond.
 */
function setTokensAndRespond(
  res: any,
  result: { accessToken: string; refreshToken: string; userId: number },
  statusCode = 200
) {
  res.cookie("token", result.accessToken, accessCookieOptions);
  res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
  return res.status(statusCode).json({ success: true, userId: result.userId });
}

// ─── Signup ──────────────────────────────────────────────────────────

authRouter.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const result = await signup(email, password);
    return setTokensAndRespond(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// ─── Login ───────────────────────────────────────────────────────────

authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const result = await login(email, password);
    
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
});

// ─── OTP ─────────────────────────────────────────────────────────────

authRouter.post("/otp/send", authLimiter, async (req, res, next) => {
  try {
    const email = z.string().email("Invalid email").parse(req.body.email);
    await sendOtp(email);
    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/otp/verify", authLimiter, async (req, res, next) => {
  try {
    const email = z.string().email().parse(req.body.email);
    const code = z.string().length(6, "Code must be 6 digits").parse(req.body.code);
    const result = await loginWithOtp(email, code);
    return setTokensAndRespond(res, result);
  } catch (err) {
    next(err);
  }
});

// ─── Refresh ─────────────────────────────────────────────────────────

/**
 * POST /auth/refresh — rotates the refresh token and issues a new access token.
 * The frontend calls this automatically when the access token expires (401).
 */
authRouter.post("/refresh", async (req, res, next) => {
  try {
    const oldToken = req.cookies?.refreshToken;
    if (!oldToken) {
      return res.status(401).json({ error: true, message: "No refresh token" });
    }

    const result = await refreshSession(oldToken);
    return setTokensAndRespond(res, result);
  } catch (err) {
    // Clear stale cookies on failure
    res.clearCookie("token", accessCookieOptions);
    res.clearCookie("refreshToken", refreshCookieOptions);
    next(err);
  }
});

// ─── Logout ──────────────────────────────────────────────────────────

authRouter.post("/logout", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  res.clearCookie("token", accessCookieOptions);
  res.clearCookie("refreshToken", refreshCookieOptions);
  return res.json({ success: true });
});

export { authRouter };
