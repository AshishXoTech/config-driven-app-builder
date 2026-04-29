function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeString(v, fallback = "") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/**
 * Load/normalize a raw config JSON blob into a safe object.
 * Accepts either an object or a JSON string.
 */
export function loadConfig(json) {
  try {
    if (typeof json === "string") return isObject(JSON.parse(json)) ? JSON.parse(json) : {};
    return isObject(json) ? json : {};
  } catch {
    return {};
  }
}

export function normalizeModels(models) {
  const src = isObject(models) ? models : {};
  const out = {};

  for (const [key, raw] of Object.entries(src)) {
    const m = isObject(raw) ? raw : {};
    const fields = safeArray(m.fields)
      .map((f) => (isObject(f) ? f : {}))
      .filter((f) => safeString(f.name));

    out[key] = {
      key,
      table: safeString(m.table, key),
      idField: safeString(m.idField, "id"),
      fields: fields.map((f) => ({
        name: safeString(f.name),
        // Preserve raw label — can be a string or { en, hi, ... } object.
        // The LanguageContext resolveLabel() handles both formats at render time.
        label: f.label != null ? f.label : safeString(f.name),
        type: safeString(f.type, "text"),
        required: !!f.required
      }))
    };
  }

  return out;
}

/**
 * Convenience wrapper: returns a fully safe config object.
 */
export function parseConfig(rawJson) {
  const cfg = loadConfig(rawJson);
  const models = normalizeModels(cfg.models);
  return {
    apiBaseUrl: safeString(cfg.apiBaseUrl, ""),
    models
  };
}

