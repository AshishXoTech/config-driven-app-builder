import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
  signup, login, sendOtp, loginWithOtp,
  refreshSession, revokeRefreshToken
} from "./authService";

const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: "Too many login attempts" },
});

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});


// ✅ ONE consistent cookie config
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/"
};


// ✅ helper (use everywhere)
function setTokens(res: any, result: any) {
  console.log("SETTING COOKIE 🔥");

  res.cookie("access_token", result.accessToken, cookieOptions);
  res.cookie("refresh_token", result.refreshToken, cookieOptions);

  return res.json({
    success: true,
    userId: result.userId,
  });
}


// ─── Signup ─────────────────────────

authRouter.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    const result = await signup(email, password);
    return setTokens(res, result);
  } catch (err) {
    next(err);
  }
});


// ─── Login (FIXED) ─────────────────

authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    console.log("LOGIN ROUTE HIT ✅");

    const { email, password } = authSchema.parse(req.body);
    const result = await login(email, password);

    return setTokens(res, result);

  } catch (err) {
    next(err);
  }
});


// ─── OTP ───────────────────────────

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

    return setTokens(res, result);

  } catch (err) {
    next(err);
  }
});


// ─── Refresh ───────────────────────

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const oldToken = req.cookies?.refresh_token;

    if (!oldToken) {
      return res.status(401).json({ error: true });
    }

    const result = await refreshSession(oldToken);
    return setTokens(res, result);

  } catch (err) {
    res.clearCookie("access_token", cookieOptions);
    res.clearCookie("refresh_token", cookieOptions);
    next(err);
  }
});


// ─── Logout ────────────────────────

authRouter.post("/logout", async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);

  return res.json({ success: true });
});


export { authRouter };