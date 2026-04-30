import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { loadAppConfig } from "./core/configLoader";
import { prisma } from "./db/prisma";
import { CrudService } from "./services/crudService";
import { buildRoutes } from "./routes";
import { errorHandler } from "./utils/errorHandler";

async function main() {
  dotenv.config();

  // Fail fast on missing secrets
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
    process.exit(1);
  }

  const config = loadAppConfig();
  const app = express();

  app.use(cors({
    origin: "https://config-driven-app-builder.vercel.app",
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());

  // CSRF Protection Middleware
  // Enforce X-Requested-With on all POST, PUT, DELETE, PATCH requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
    if (isMutation) {
      const requestedWith = req.headers["x-requested-with"];
      if (requestedWith !== "XMLHttpRequest") {
        return res.status(403).json({ error: true, message: "CSRF token mismatch or missing X-Requested-With header" });
      }
    }
    next();
  });

  app.get("/health", (_req, res) => res.status(200).send("OK"));

  const crud = new CrudService(prisma);
  app.use(buildRoutes(config, crud));
  app.use(errorHandler);

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

void main();

