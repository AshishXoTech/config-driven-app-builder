import { useMemo, useState } from "react";
import { create } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import Spinner from "./Spinner";

function fieldKind(field) {
  const t = (field?.type || "text").toLowerCase();
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  if (t === "string" || t === "text" || t === "date") return "text";
  return "unknown";
}

function initialValueFor(field) {
  const kind = fieldKind(field);
  if (kind === "boolean") return false;
  return "";
}

function toApiValue(field, raw) {
  const kind = fieldKind(field);
  if (kind === "number") {
    if (raw === "" || raw == null) return raw;
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  if (kind === "boolean") return !!raw;
  return raw;
}

export default function DynamicForm({ schema, modelName, onCreated, onError }) {
  const fields = schema?.fields || [];
  const { resolveLabel } = useLanguage();

  const initial = useMemo(() => {
    const obj = {};
    for (const f of fields) obj[f.name] = initialValueFor(f);
    return obj;
  }, [fields]);

  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {};
      for (const f of fields) payload[f.name] = toApiValue(f, values[f.name]);
      await create(modelName, payload);
      setValues(initial);
      onCreated?.();
    } catch (err) {
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border-hover)",
    background: "var(--bg-surface)",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  };

  function handleFocus(e) {
    e.target.style.borderColor = "var(--accent)";
    e.target.style.boxShadow = "0 0 0 2px var(--accent)";
  }
  function handleBlur(e) {
    e.target.style.borderColor = "var(--border-hover)";
    e.target.style.boxShadow = "none";
  }

  return (
    <div style={{
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)",
      borderTop: "3px solid var(--blue)",
      background: "var(--bg-raised)",
      boxShadow: "var(--shadow-sm)",
      overflow: "hidden",
      transition: "box-shadow 150ms ease, border-color 150ms ease",
    }}>
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
          Create {modelName ? modelName.charAt(0).toUpperCase() + modelName.slice(1) : "Record"}
        </span>
      </div>

      <div style={{ padding: 20 }}>
        <form onSubmit={onSubmit}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}>
            {fields.map((f) => {
              const kind = fieldKind(f);
              const label = resolveLabel(f.label, f.name);
              const required = !!f.required;

              if (kind === "unknown") {
                if (process.env.NODE_ENV !== "production") {
                  console.warn(`⚠️ Unsupported field type: ${f.type}`);
                }
                return (
                  <div key={f.name} style={{
                    padding: "10px 14px",
                    background: "var(--amber-muted)",
                    border: "1px dashed var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--amber)",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    gridColumn: "1 / -1" // Span full width so it's obvious
                  }}>
                    <span>⚠️</span>
                    <span>Unsupported field type: <strong>{f.type}</strong> ({label})</span>
                  </div>
                );
              }

              if (kind === "boolean") {
                return (
                  <label key={f.name} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-hover)",
                    background: "var(--bg-surface)",
                    cursor: "pointer",
                  }}>
                    <input
                      type="checkbox"
                      checked={!!values[f.name]}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))}
                      disabled={submitting}
                      style={{ accentColor: "var(--teal)" }}
                    />
                    <span style={{ fontSize: 13, color: "var(--text)" }}>
                      {label}
                      {required && <span style={{ color: "var(--text-muted)" }}> *</span>}
                    </span>
                  </label>
                );
              }

              return (
                <div key={f.name}>
                  <label style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 6,
                  }}>
                    {label}{required ? " *" : ""}
                  </label>
                  <input
                    style={inputStyle}
                    type={kind === "number" ? "number" : "text"}
                    value={values[f.name]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    required={required}
                    disabled={submitting}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 20px",
                borderRadius: "var(--radius)",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
                transition: "all 150ms ease",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {submitting && <Spinner size="sm" />}
              {submitting ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setValues(initial)}
              disabled={submitting}
              style={{
                padding: "9px 20px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border-hover)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
