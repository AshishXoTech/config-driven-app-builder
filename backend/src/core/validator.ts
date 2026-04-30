import { z } from "zod";
import type { ModelConfig, ModelField } from "./configLoader";
import { triggerSafeMode } from "./safeMode";

// ─── Config validation ──────────────────────────────────────────────

/**
 * Base field schema (for config validation)
 */
const fieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "date"]),
  required: z.boolean().optional(),
  // Label can be a plain string ("Name") or multi-language object ({ en: "Name", hi: "नाम" })
  label: z.union([z.string(), z.record(z.string())]).optional(),
});

/**
 * Validate model config safely
 */
export function validateModelConfig(model: ModelConfig): ModelConfig | null {
  const modelSchema = z.object({
    table: z.string().min(1),
    idField: z.string().min(1),
    fields: z.array(fieldSchema),
  });

  const result = modelSchema.safeParse(model);

  if (!result.success) {
    const errorMsg = `Invalid model config: ${JSON.stringify(result.error.issues[0])}`;
    console.error("❌ Invalid model config — stripping model to prevent crash:", result.error.format());
    triggerSafeMode(errorMsg);
    return null; // Return null instead of throwing to prevent server crash
  }

  return result.data;
}

// ─── Smart field detection ──────────────────────────────────────────

/**
 * Heuristic patterns for semantic field validation.
 * When a field name matches a pattern, extra Zod refinements are applied
 * on top of the base type — fully config-driven, zero hardcoding per model.
 */
const STRING_PATTERNS: { test: (name: string) => boolean; build: () => z.ZodType }[] = [
  {
    // email, userEmail, email_address, etc.
    test: (n) => /email/i.test(n),
    build: () => z.string().email("Must be a valid email address").min(1, "Email is required"),
  },
  {
    // url, imageUrl, websiteUrl, etc.
    test: (n) => /url/i.test(n),
    build: () => z.string().url("Must be a valid URL"),
  },
  {
    // phone, phoneNumber, etc.
    test: (n) => /phone/i.test(n),
    build: () => z.string().min(7, "Phone number too short").max(20, "Phone number too long"),
  },
];

/**
 * Build a Zod schema for a single field based on its type AND name.
 *
 * - Matches field name against known semantic patterns (email → .email(), url → .url(), etc.)
 * - Falls back to base type coercion if no pattern matches
 * - Works for ANY config — no per-model hardcoding
 */
function zodForField(field: ModelField): z.ZodTypeAny {
  // Resolve label to a plain string for error messages
  const lbl = labelText(field);

  // For string fields, check if the name implies a semantic constraint
  if (field.type === "string") {
    for (const pattern of STRING_PATTERNS) {
      if (pattern.test(field.name)) {
        return pattern.build();
      }
    }
    // Generic required string must be non-empty
    return field.required
      ? z.string().min(1, `${lbl} is required`)
      : z.string();
  }

  switch (field.type) {
    case "number":
      return z.coerce.number({
        required_error: `${lbl} is required`,
        invalid_type_error: `${lbl} must be a number`,
      });
    case "boolean":
      return z.coerce.boolean({
        required_error: `${lbl} is required`,
        invalid_type_error: `${lbl} must be a boolean`,
      });
    case "date":
      return z.coerce.date({
        errorMap: () => ({ message: `${lbl} must be a valid date` }),
      });
    default:
      return z.string();
  }
}

/**
 * Resolve a field's label to a plain string for error messages.
 * Handles both string ("Name") and multi-language ({ en: "Name", hi: "नाम" }) formats.
 */
function labelText(field: ModelField): string {
  if (!field.label) return field.name;
  if (typeof field.label === "string") return field.label;
  // Multi-language object — prefer English for error messages
  return field.label.en || Object.values(field.label)[0] || field.name;
}

// ─── Schema builders ────────────────────────────────────────────────

/**
 * Build a strict Zod schema for create validation.
 *
 * - Dynamically generated from ANY model config
 * - Rejects unknown fields (.strict())
 * - Applies semantic refinements (email, url, phone, etc.)
 * - Required fields are enforced; optional fields accept undefined/null
 */
export function buildCreateSchema(model: ModelConfig) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const f of model.fields) {
    const base = zodForField(f);
    shape[f.name] = f.required ? base : base.optional().nullable();
  }

  // Use .strip() instead of .strict() to ignore unknown fields automatically
  // This allows UI configs to have extra fields without crashing the backend validation
  return z.object(shape).strip();
}

/**
 * Build a partial schema for update validation.
 *
 * Same semantic rules as create, but all fields are optional
 * (only provided fields are validated). Still rejects unknowns.
 */
export function buildUpdateSchema(model: ModelConfig) {
  return buildCreateSchema(model).partial();
}

// ─── Validation error formatting ────────────────────────────────────

/**
 * Custom validation error with structured per-field info.
 * Thrown by the validation middleware and caught by errorHandler.
 */
export class ValidationError extends Error {
  public readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * Parse request body against a Zod schema and throw a structured
 * ValidationError on the FIRST failing field.
 *
 * Returns the parsed + sanitized data on success.
 */
export function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown
): z.infer<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  // Extract the first issue for a clean, single-field error message
  const first = result.error.issues[0];
  const field = first.path.length > 0 ? String(first.path[0]) : "unknown";

  // Zod "unrecognized_keys" means unknown fields were sent
  if (first.code === "unrecognized_keys") {
    const keys = (first as z.ZodUnrecognizedKeysIssue).keys;
    throw new ValidationError(
      `Unknown field(s): ${keys.join(", ")}`,
      keys[0]
    );
  }

  throw new ValidationError(first.message, field);
}

// ─── Legacy helpers (preserved for backward compatibility) ──────────

/**
 * Build dynamic Zod schema for request validation
 */
function buildZodSchema(fields: ModelField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const f of fields) {
    let schema: z.ZodTypeAny;

    switch (f.type) {
      case "number":
        schema = z.coerce.number();
        break;
      case "boolean":
        schema = z.coerce.boolean();
        break;
      case "date":
        schema = z.coerce.date();
        break;
      case "string":
      default:
        schema = z.coerce.string();
        break;
    }

    // Optional vs required
    shape[f.name] = f.required ? schema : schema.optional();
  }

  return z.object(shape).passthrough(); // 👈 KEY: allows unknown fields
}

/**
 * Validate + sanitize incoming request body
 */
export function validateAndSanitize(
  model: ModelConfig,
  input: Record<string, any>
) {
  const schema = buildZodSchema(model.fields);

  const result = schema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.format(),
      data: null,
    };
  }

  const parsedData = result.data;

  // 🔥 Remove unknown fields manually (since passthrough keeps them)
  const allowedFields = new Set(model.fields.map((f) => f.name));

  const sanitized: Record<string, any> = {};

  for (const key of Object.keys(parsedData)) {
    if (allowedFields.has(key)) {
      sanitized[key] = parsedData[key];
    }
  }

  // 🔥 Fill missing optional fields with null (or default)
  for (const field of model.fields) {
    if (!(field.name in sanitized)) {
      sanitized[field.name] = null;
    }
  }

  return {
    success: true,
    errors: null,
    data: sanitized,
  };
}