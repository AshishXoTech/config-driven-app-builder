import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ValidationError } from "../core/validator";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Structured validation errors (from parseOrThrow)
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: true,
      message: err.message,
      field: err.field,
    });
  }

  // Raw Zod errors (fallback — should rarely hit now)
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return res.status(400).json({
      error: true,
      message: first.message,
      field: first.path.length > 0 ? String(first.path[0]) : "unknown",
    });
  }

  if (err instanceof Error) {
    // Auth errors
    if (err.name === "AuthError") {
      return res.status(401).json({ error: true, message: err.message });
    }

    // Bad request errors (e.g. invalid Prisma model)
    if (err.name === "BadRequest") {
      return res.status(400).json({ error: true, message: err.message });
    }

    const isDev = process.env.NODE_ENV === "development";
    const msg = isDev ? err.message : "Internal server error";
    return res.status(500).json({ error: true, message: msg });
  }

  return res.status(500).json({ error: true, message: "Unknown error" });
}
