import type { Router } from "express";
import { Router as createRouter } from "express";
import { triggerSafeMode } from "./safeMode";
import type { AppConfig, ModelConfig } from "./configLoader";
import { validateModelConfig, buildCreateSchema, buildUpdateSchema, parseOrThrow } from "./validator";
import { CrudService } from "../services/crudService";
import { parseCSV, mapRowToConfig } from "../services/csvParser";
import { createJob } from "../services/jobQueue";
import multer from "multer";
import csvParser from "csv-parser";

const modelMap: Record<string, string> = {
  users: "User",
  tasks: "Task",
};

function parseId(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    const err = new Error("Invalid id");
    err.name = "BadRequest";
    throw err;
  }
  return n;
}

/**
 * Create CRUD router for a single dynamic model.
 *
 * Input:
 * - modelName: the Prisma model delegate name
 * - schema: validated model config (fields + types)
 *
 * Output:
 * - Express router with CRUD routes:
 *   POST /       -> create
 *   GET  /       -> list
 *   PUT  /:id    -> update
 *   DELETE /:id  -> delete
 *   POST /import -> CSV bulk import
 *
 * Validation is applied BEFORE any DB call via parseOrThrow,
 * which turns Zod errors into structured ValidationError.
 */
export function createModelRouter(modelName: string, schema: ModelConfig, crud: CrudService): Router {
  const router = createRouter();
  const createSchema = buildCreateSchema(schema);
  const updateSchema = buildUpdateSchema(schema);

  router.post("/", async (req, res, next) => {
    try {
      const data = parseOrThrow(createSchema, req.body);
      res.status(201).json(await crud.create(modelName, data, req.userId));
    } catch (e) {
      next(e);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      res.json(await crud.findAll(modelName, req.userId));
    } catch (e) {
      next(e);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const data = parseOrThrow(updateSchema, req.body);
      res.json(await crud.update(modelName, parseId(req.params.id), data, req.userId));
    } catch (e) {
      next(e);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      res.json(await crud.delete(modelName, parseId(req.params.id), req.userId));
    } catch (e) {
      next(e);
    }
  });

  /**
   * POST /import — CSV bulk import (True Streaming + Batch Insert)
   */
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const upload = multer({ dest: os.tmpdir() }); // Stream directly to temp disk

  router.post("/import", upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: true, message: "No CSV file uploaded" });
      }

      const uniqueFields = schema.fields.filter(f => f.name.toLowerCase() === 'email').map(f => f.name);
      const job = createJob();
      const filePath = req.file.path;
      const userId = req.userId;

      // Return 202 Accepted immediately — processing happens in background
      res.status(202).json({ jobId: job.id, status: "processing" });

      // ── Async processing (fire-and-forget from the HTTP response) ──
      (async () => {
        try {
          const rawRows: Record<string, string>[] = [];

          await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
              .pipe(csvParser())
              .on("data", (row: Record<string, string>) => rawRows.push(row))
              .on("end", resolve)
              .on("error", reject);
          });

          fs.unlink(filePath, (err: NodeJS.ErrnoException | null) => {
            if (err) console.error("Failed to cleanup temp CSV:", err);
          });

          if (rawRows.length === 0) {
            job.status = "done";
            return;
          }

          const seenValues: Record<string, Set<string>> = {};
          for (const uf of uniqueFields) seenValues[uf] = new Set<string>();

          for (let i = 0; i < rawRows.length; i++) {
            const mapped = mapRowToConfig(rawRows[i], schema);
            const result = createSchema.safeParse(mapped);

            if (!result.success) {
              job.failedCount++;
              const first = result.error.issues[0];
              job.errors.push({
                row: i + 1,
                message: first.message,
                field: first.path.length > 0 ? String(first.path[0]) : undefined,
              });
              continue;
            }

            // Intra-CSV duplicate check
            let isDuplicate = false;
            for (const uf of uniqueFields) {
              if (result.data[uf]) {
                const val = String(result.data[uf]).toLowerCase();
                if (seenValues[uf].has(val)) {
                  job.failedCount++;
                  job.errors.push({
                    row: i + 1,
                    message: `${uf} already exists (duplicate in CSV)`,
                    field: uf,
                  });
                  isDuplicate = true;
                  break;
                }
                seenValues[uf].add(val);
              }
            }

            if (!isDuplicate) {
              try {
                await crud.create(modelName, result.data as any, userId);
                job.successCount++;
              } catch (dbErr: any) {
                job.failedCount++;
                if (dbErr?.code === "P2002") {
                  const target = dbErr.meta?.target?.[0] || "field";
                  job.errors.push({
                    row: i + 1,
                    message: `${target.charAt(0).toUpperCase() + target.slice(1)} already exists`,
                    field: target,
                  });
                } else {
                  job.errors.push({
                    row: i + 1,
                    message: dbErr instanceof Error ? dbErr.message : "Database error",
                  });
                }
              }
            }
          }

          job.status = "done";
        } catch (e) {
          job.status = "failed";
          console.error("CSV job failed:", e);
        }
      })();
    } catch (e) {
      next(e);
    }
  });

  return router;
}

export function generateDynamicRoutes(config: AppConfig, crud: CrudService): Router {
  const router = createRouter();

  for (const [modelKey, rawModel] of Object.entries(config.models)) {
    const model: ModelConfig | null = validateModelConfig(rawModel);
    if (!model) continue; // Skip invalid models instead of crashing

    const prismaModel = modelMap[modelKey];
    const route = modelKey;

    if (!prismaModel) {
      const errorMsg = `No Prisma model mapping found for '${modelKey}'.`;
      console.warn(`⚠️ ${errorMsg} Skipping.`);
      triggerSafeMode(errorMsg);
      continue;
    }

    try {
      router.use(`/${route}`, createModelRouter(prismaModel, model, crud));
    } catch (err: any) {
      const errorMsg = `Failed to generate route for ${modelKey}: ${err.message}`;
      console.error(`❌ ${errorMsg}`);
      triggerSafeMode(errorMsg);
      continue;
    }
  }

  return router;
}
