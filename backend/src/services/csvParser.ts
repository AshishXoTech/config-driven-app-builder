import type { ModelConfig, ModelField } from "../core/configLoader";

/**
 * Zero-dependency CSV parser.
 *
 * Handles:
 * - Quoted fields (including embedded commas and newlines)
 * - Empty lines
 * - Trimmed whitespace on headers and values
 *
 * Returns an array of objects keyed by header names.
 */
export function parseCSV(raw: string): Record<string, string>[] {
  const lines = splitCSVLines(raw);
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVRow(line);
    const row: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? "").trim();
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Split raw CSV text into lines, respecting quoted fields that may
 * contain newline characters.
 */
function splitCSVLines(raw: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && raw[i + 1] === "\n") i++; // skip \r\n
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    lines.push(current);
  }

  return lines;
}

/**
 * Parse a single CSV row into an array of field values.
 * Handles quoted fields with escaped quotes ("").
 */
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }

  fields.push(current);
  return fields;
}

/**
 * Map a raw CSV row (all strings) to typed values based on config fields.
 *
 * - Only includes fields that exist in the model config
 * - Coerces types: number → Number(), boolean → true/false, date → ISO string
 * - Ignores unknown CSV columns (extra columns in the CSV are dropped)
 * - Works for ANY model config — zero hardcoding
 */
export function mapRowToConfig(
  row: Record<string, string>,
  modelConfig: ModelConfig
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  const fieldMap = new Map<string, ModelField>();

  for (const f of modelConfig.fields) {
    fieldMap.set(f.name.toLowerCase(), f);
  }

  for (const [csvKey, csvValue] of Object.entries(row)) {
    const field = fieldMap.get(csvKey.toLowerCase());
    if (!field) continue; // ignore unknown columns

    mapped[field.name] = coerceValue(csvValue, field);
  }

  return mapped;
}

/**
 * Coerce a raw CSV string value to the expected type for a field.
 */
function coerceValue(value: string, field: ModelField): unknown {
  // Pass empty cells as undefined so Zod required_error triggers properly
  if (value === "" || value === undefined) {
    return undefined;
  }

  if (field.type === "boolean") {
    const lower = value.toLowerCase();
    if (["true", "1", "yes"].includes(lower)) return true;
    if (["false", "0", "no"].includes(lower)) return false;
    return value; // let Zod handle the invalid type error
  }

  // For string, number, and date, we return the raw string.
  // Zod's z.coerce will handle parsing ("123" -> 123) and
  // throw proper validation errors ("abc" -> "must be a number").
  return value;
}
