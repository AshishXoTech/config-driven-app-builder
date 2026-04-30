import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { delete_, getAll } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

function safeString(v) {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function DynamicTable({ schema, modelName, refreshKey = 0, onError }) {
  const idField = schema?.idField || "id";
  const fields = schema?.fields || [];
  const { resolveLabel } = useLanguage();

  const colInfo = useMemo(() => {
    const info = [{ name: idField, label: "ID", type: "string" }];
    for (const f of fields) {
      info.push({ name: f.name, label: resolveLabel(f.label, f.name), type: f.type });
    }
    return info;
  }, [idField, fields, resolveLabel]);

  function getFieldKind(type) {
    const t = (type || "text").toLowerCase();
    if (["number", "boolean", "string", "date", "text"].includes(t)) return t;
    return "unknown";
  }

  const { data: rows, error: swrError, isLoading: loading, mutate } = useSWR(
    modelName ? `/api/${modelName}` : null,
    () => getAll(modelName)
  );

  const error = swrError?.message || null;
  const safeRows = Array.isArray(rows) ? rows : [];

  useEffect(() => {
    if (refreshKey > 0) mutate();
  }, [refreshKey, mutate]);

  async function onDelete(id) {
    try {
      await delete_(modelName, id);
      mutate();
    } catch (e) {
      onError?.(e);
    }
  }

  return (
    <div style={{
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)",
      borderTop: "3px solid var(--teal)",
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
          {modelName ? modelName.charAt(0).toUpperCase() + modelName.slice(1) : "Records"}
          <span style={{
            marginLeft: 8,
            padding: "2px 8px",
            borderRadius: 999,
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-muted)",
          }}>
            {safeRows.length}
          </span>
        </span>
        <button
          type="button"
          onClick={() => mutate()}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border-hover)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
            transition: "all 150ms ease",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {loading ? <Spinner size="sm" /> : null}
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div style={{ padding: 20 }}>
        {error ? (
          <div style={{ marginBottom: 16 }}>
            <ErrorState message={error} onRetry={() => mutate()} />
          </div>
        ) : null}

        {loading && safeRows.length === 0 ? (
          <div style={{ padding: "48px 0" }}>
            <Spinner size="lg" />
          </div>
        ) : safeRows.length === 0 ? (
          <EmptyState
            title="No records yet"
            description="Create a new record using the form to get started."
          />
        ) : (
          <div style={{
            overflowX: "auto",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {colInfo.map((c) => (
                    <th key={c.name} style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--text-secondary)",
                      borderBottom: "1px solid var(--border)",
                      position: "sticky",
                      top: 0,
                      background: "var(--bg-hover)",
                    }}>
                      {c.label}
                    </th>
                  ))}
                  <th style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    top: 0,
                    background: "var(--bg-hover)",
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {safeRows.map((r, idx) => (
                  <tr key={safeString(r?.[idField])} style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 100ms ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {colInfo.map((c) => (
                      <td key={c.name} style={{
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "var(--text)",
                        verticalAlign: "top",
                      }}>
                        {getFieldKind(c.type) === "unknown" ? (
                          <span style={{ color: "var(--amber)", fontSize: 11, fontWeight: 500, background: "var(--amber-muted)", padding: "2px 6px", borderRadius: 4 }}>
                            ⚠️ Unsupported
                          </span>
                        ) : safeString(r?.[c.name])}
                      </td>
                    ))}
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        type="button"
                        onClick={() => onDelete(r?.[idField])}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: "1px solid var(--border-hover)",
                          background: "var(--danger-muted)",
                          color: "var(--danger)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 150ms ease",
                          boxShadow: "var(--shadow-sm)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--bg-hover)";
                          e.currentTarget.style.borderColor = "var(--border-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--danger-muted)";
                          e.currentTarget.style.borderColor = "var(--border)";
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
