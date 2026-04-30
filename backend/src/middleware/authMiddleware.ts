import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request
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
  // ✅ ONLY read from Authorization header
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      error: true,
      message: "Unauthorized (no token)",
    });
    return;
  }

  const token = header.split(" ")[1];

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