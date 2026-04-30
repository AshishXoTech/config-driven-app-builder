import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { loadAppConfig } from "./core/configLoader";
import { prisma } from "./db/prisma";
import { CrudService } from "./services/crudService";
import { buildRoutes } from "./routes";
import { errorHandler } from "./utils/errorHandler";

// ✅ IMPORT AUTH ROUTES EXPLICITLY
import { authRouter } from "./modules/auth/authRoutes";

async function main() {
  dotenv.config();

  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.error("FATAL ERROR: JWT_SECRET missing.");
    process.exit(1);
  }

  const config = loadAppConfig();
  const app = express();

  // ─────────────────────────────────────────────
  // ✅ REQUIRED FOR RENDER (COOKIES)
  // ─────────────────────────────────────────────
  app.set("trust proxy", 1);

  // ─────────────────────────────────────────────
  // ✅ FIXED CORS (VERY IMPORTANT)
  // ─────────────────────────────────────────────
  app.use(
    cors({
      origin: [
        "https://config-driven-app-builder.vercel.app",
        "https://*.vercel.app",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "X-Requested-With"],
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  // ─────────────────────────────────────────────
  // ✅ CSRF FIX (DON’T BLOCK AUTH)
  // ─────────────────────────────────────────────
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);

    // ❗ Allow ALL auth routes
    if (req.path.startsWith("/auth")) {
      return next();
    }

    if (isMutation) {
      const requestedWith = req.headers["x-requested-with"];
      if (requestedWith !== "XMLHttpRequest") {
        return res.status(403).json({
          error: true,
          message: "CSRF blocked request",
        });
      }
    }

    next();
  });

  // ─────────────────────────────────────────────
  // ✅ HEALTH CHECK
  // ─────────────────────────────────────────────
  app.get("/health", (_req, res) => res.status(200).send("OK"));

  // ─────────────────────────────────────────────
  // 🚨 MOST IMPORTANT FIX
  // ─────────────────────────────────────────────
  // 👉 AUTH ROUTES MUST BE EXPLICIT
  app.use("/auth", authRouter);

  // ─────────────────────────────────────────────
  // OTHER ROUTES
  // ─────────────────────────────────────────────
  const crud = new CrudService(prisma);
  app.use(buildRoutes(config, crud));

  // ─────────────────────────────────────────────
  // ERROR HANDLER
  // ─────────────────────────────────────────────
  app.use(errorHandler);

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

void main();