import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { loadAppConfig } from "./core/configLoader";
import { prisma } from "./db/prisma";
import { CrudService } from "./services/crudService";
import { buildRoutes } from "./routes";
import { errorHandler } from "./utils/errorHandler";
import { authRouter } from "./modules/auth/authRoutes";

async function main() {
  dotenv.config();

  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.error("FATAL ERROR: JWT_SECRET missing.");
    process.exit(1);
  }

  const config = loadAppConfig();
  const app = express();

  app.use(cors({
    origin: "https://config-driven-app-builder.vercel.app",
    credentials: true,
  }));

  // ✅ REQUIRED FOR RENDER COOKIES
  app.set("trust proxy", 1);

  // ─────────────────────────────────────────────
  // ✅ CORRECT CORS (DYNAMIC — THIS IS THE REAL FIX)
  // ─────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (
          origin.includes("vercel.app") ||
          origin.includes("localhost")
        ) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-Requested-With"],
    })
  );

  // ✅ VERY IMPORTANT (preflight)
  app.options("*", cors());

  app.use(express.json());
  app.use(cookieParser());

  // ─────────────────────────────────────────────
  // ✅ CSRF FIX
  // ─────────────────────────────────────────────
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);

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
  app.get("/health", (_req, res) => res.status(200).send("OK"));

  // ✅ AUTH ROUTES (correct)
  app.use("/auth", authRouter);

  // ✅ OTHER ROUTES
  const crud = new CrudService(prisma);
  app.use(buildRoutes(config, crud));

  app.use(errorHandler);

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

void main();