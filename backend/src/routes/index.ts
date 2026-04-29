import { Router } from "express";
import type { AppConfig } from "../core/configLoader";
import { dynamicRoutes } from "./dynamicRoutes";
import { CrudService } from "../services/crudService";
import { authRouter } from "../modules/auth/authRoutes";
import { authMiddleware } from "../middleware/authMiddleware";
import { notificationService } from "../services/notificationService";
import { getJob } from "../services/jobQueue";

/**
 * Main router builder
 */
export function buildRoutes(
  config: AppConfig,
  crud: CrudService
): Router {
  const router = Router();

  /**
   * Health check
   */
  router.get("/health", (_req, res) => {
    return res.status(200).send("OK");
  });

  /**
   * Debug endpoint (safe)
   */
  router.get("/config", (_req, res) => {
    try {
      return res.json({
        models: config.models,
        port: config.port,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to load config",
      });
    }
  });

  /**
   * Auth routes (unprotected)
   */
  router.use("/auth", authRouter);

  /**
   * Dynamic routes (protected by JWT)
   */
  try {
    const dynamicRouter = dynamicRoutes(config, crud);

    // Apply auth middleware, then mount dynamic CRUD routes under /api
    router.use("/api", authMiddleware, dynamicRouter);

    console.log("✅ Dynamic routes mounted at /api (JWT-protected)");
  } catch (error) {
    console.error("❌ Failed to mount dynamic routes:", error);
  }

  /**
   * GET /api/me (Force validation check)
   */
  router.get("/api/me", authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  /**
   * GET /api/jobs/:id — poll CSV import job status.
   * Returns current progress so the frontend can show live updates.
   */
  router.get("/api/jobs/:id", authMiddleware, (req, res) => {
    const job = getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: true, message: "Job not found" });
    }
    return res.json(job);
  });

  /**
   * GET /notifications — user-scoped notifications (protected by JWT)
   */
  router.get("/notifications", authMiddleware, async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: true, message: "Unauthorized" });
      }
      const notifications = await notificationService.getByUserId(userId);
      return res.json(notifications);
    } catch (e) {
      next(e);
    }
  });

  /**
   * Fallback route (important for robustness)
   */
  router.use((_req, res) => {
    return res.status(404).json({
      error: "Route not found",
    });
  });

  return router;
}
