import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Augment Express Request to carry the authenticated userId.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production-42x9z";

/**
 * JWT authentication middleware.
 *
 * - Extracts `Authorization: Bearer <token>` header
 * - Verifies token and attaches `req.userId`
 * - Rejects with 401 if missing / invalid
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  let token = req.cookies?.token;

  if (!token) {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: true, message: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = payload.userId;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: true, message: "Invalid token" });
  }
}
