import type { AppConfig } from "../core/configLoader";
import { getSystemState } from "../core/safeMode";
import { dynamicRoutes } from "./dynamicRoutes";
import { CrudService } from "../services/crudService";
import { authMiddleware } from "../middleware/authMiddleware";
import { notificationService } from "../services/notificationService";
import { getJob } from "../services/jobQueue";
import { Router, Request, Response, NextFunction } from "express";

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
   * Debug endpoint
   */
  router.get("/config", (_req, res) => {
    try {
      return res.json({
        models: config.models,
        port: config.port,
        systemState: getSystemState(),
      });
    } catch {
      return res.status(500).json({
        error: "Failed to load config",
      });
    }
  });

  /**
   * Dynamic routes (JWT protected)
   */
  try {
    const dynamicRouter = dynamicRoutes(config, crud);

    router.use("/api", authMiddleware, dynamicRouter);

    console.log("✅ Dynamic routes mounted at /api (JWT-protected)");
  } catch (error) {
    console.error("❌ Failed to mount dynamic routes:", error);
  }

  /**
   * Current user
   */
  router.get("/api/me", authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  /**
   * Job status
   */
  router.get("/api/jobs/:id", authMiddleware, (req, res) => {
    const job = getJob(req.params.id);
    if (!job) {
      return res.status(404).json({
        error: true,
        message: "Job not found",
      });
    }
    return res.json(job);
  });

  /**
   * Notifications
   */
  router.get("/notifications", authMiddleware, async (req, res, next) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          error: true,
          message: "Unauthorized",
        });
      }

      const notifications = await notificationService.getByUserId(userId);
      return res.json(notifications);
    } catch (e) {
      next(e);
    }
  });

  /**
   * 404 fallback
   */
  router.use((_req, res) => {
    return res.status(404).json({
      error: "Route not found",
    });
  });

  return router;
}