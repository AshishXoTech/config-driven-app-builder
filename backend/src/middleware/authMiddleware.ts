import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: any;
    }
  }
}

const JWT_SECRET =
  process.env.JWT_SECRET ?? "dev-secret-change-in-production-42x9z";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // ✅ FIX: read correct cookie name
  let token = req.cookies?.access_token;

  // fallback to Authorization header
  if (!token) {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    }
  }

  if (!token) {
    res.status(401).json({
      error: true,
      message: "No token found",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };

    req.userId = payload.userId;
    req.user = payload;

    next();
  } catch (err) {
    res.status(401).json({
      error: true,
      message: "Invalid or expired token",
    });
  }
}