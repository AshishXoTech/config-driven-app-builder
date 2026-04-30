import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
  signup,
  login,
  sendOtp,
  loginWithOtp,
  refreshSession,
  revokeRefreshToken,
} from "./authService";

const authRouter = Router();

// ─────────────────────────────────────────────
// RATE LIMIT
// ─────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: "Too many login attempts" },
});

// ─────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ─────────────────────────────────────────────
// HELPER: SEND TOKENS (NO COOKIES)
// ─────────────────────────────────────────────
function sendTokens(res: any, result: any) {
  return res.status(200).json({
    success: true,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    userId: result.userId,
  });
}

// ─────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────
authRouter.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const result = await signup(email, password);

    return sendTokens(res, result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const result = await login(email, password);

    return sendTokens(res, result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// OTP
// ─────────────────────────────────────────────
authRouter.post("/otp/send", authLimiter, async (req, res, next) => {
  try {
    const email = z.string().email().parse(req.body.email);
    await sendOtp(email);

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/otp/verify", authLimiter, async (req, res, next) => {
  try {
    const email = z.string().email().parse(req.body.email);
    const code = z.string().length(6).parse(req.body.code);

    const result = await loginWithOtp(email, code);

    return sendTokens(res, result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// REFRESH (TOKEN-BASED)
// ─────────────────────────────────────────────
authRouter.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: true,
        message: "No refresh token provided",
      });
    }

    const result = await refreshSession(refreshToken);

    return sendTokens(res, result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
authRouter.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    return res.json({ success: true });
  } catch {
    return res.json({ success: true });
  }
});

export { authRouter };