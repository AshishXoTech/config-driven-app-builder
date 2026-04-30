import path from "node:path";
import fs from "node:fs";
import { triggerSafeMode } from "./safeMode";

/**
 * Supported field types
 */
export type FieldType = "string" | "number" | "boolean" | "date";

/**
 * Model field definition
 */
export type ModelField = {
  name: string;
  type: FieldType;
  required?: boolean;
  label?: string | Record<string, string>;
};

/**
 * Model config
 */
export type ModelConfig = {
  table: string;
  idField: string;
  fields: ModelField[];
};

/**
 * App config
 */
export type AppConfig = {
  port: number;
  cors?: { origin?: string[] | string };
  models: Record<string, ModelConfig>;
};

/**
 * Defaults
 */
const DEFAULT_CONFIG: AppConfig = {
  port: 5000,
  cors: { origin: "*" },
  models: {},
};

/**
 * Allowed types
 */
const VALID_TYPES: FieldType[] = ["string", "number", "boolean", "date"];

/**
 * Safe JSON loader
 */
function safeReadJSON(filePath: string): any {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Failed to read/parse config:", err);
    return {};
  }
}

/**
 * Sanitize fields
 */
function sanitizeFields(fields: any, modelName: string): ModelField[] {
  if (!Array.isArray(fields)) {
    console.warn(`⚠️ ${modelName}: fields must be an array. Using empty.`);
    return [];
  }

  return fields.map((field: any, index: number) => {
    const name =
      typeof field?.name === "string" && field.name.trim()
        ? field.name
        : `field_${index}`;

    let type: FieldType = "string";
    if (VALID_TYPES.includes(field?.type)) {
      type = field.type;
    } else {
      console.warn(
        `⚠️ ${modelName}.${name}: invalid type → defaulting to 'string'`
      );
    }

    return {
      name,
      type,
      required: Boolean(field?.required),
      label: typeof field?.label === "string" ? field.label : name,
    };
  });
}

/**
 * Sanitize models
 */
function sanitizeModels(models: any): Record<string, ModelConfig> {
  if (!models || typeof models !== "object") {
    const errorMsg = "Missing or invalid 'models' in config.";
    console.warn(`⚠️ ${errorMsg} Using empty.`);
    triggerSafeMode(errorMsg);
    return {};
  }

  const safeModels: Record<string, ModelConfig> = {};

  Object.entries(models).forEach(([modelName, model]: any) => {
    if (typeof model !== "object") {
      const errorMsg = `Skipping invalid model structure for: ${modelName}`;
      console.warn(`⚠️ ${errorMsg}`);
      triggerSafeMode(errorMsg);
      return;
    }

    const fields = sanitizeFields(model.fields, modelName);

    if (fields.length === 0) {
      console.warn(
        `⚠️ ${modelName}: no valid fields → adding default 'name' field`
      );
      fields.push({
        name: "name",
        type: "string",
        required: true,
        label: "Name",
      });
    }

    safeModels[modelName] = {
      table:
        typeof model.table === "string" && model.table.trim()
          ? model.table
          : modelName.toLowerCase(),

      idField:
        typeof model.idField === "string" && model.idField.trim()
          ? model.idField
          : "id",

      fields,
    };
  });

  return safeModels;
}

/**
 * Main loader
 */
export function loadAppConfig(): AppConfig {
  // Primary (safe) location: `${cwd}/shared/sampleConfig.json`
  // If the backend is started from `backend/`, fall back to `../shared/sampleConfig.json`.
  const primaryPath = path.join(process.cwd(), "shared", "sampleConfig.json");
  const fallbackPath = path.join(process.cwd(), "..", "shared", "sampleConfig.json");
  const configPath = fs.existsSync(primaryPath) ? primaryPath : fallbackPath;

  let rawConfig: any = {};

  // Check file exists
  if (!fs.existsSync(configPath)) {
    const errorMsg = "Config file not found.";
    console.error(`❌ ${errorMsg} Using default config.`);
    triggerSafeMode(errorMsg);
  } else {
    rawConfig = safeReadJSON(configPath);
  }

  return {
    port: process.env.PORT ? Number(process.env.PORT) : 4000,
    models: rawConfig.models || {},
  };
}
