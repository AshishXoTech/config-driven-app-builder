import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Renderer from "../../components/Renderer";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import ErrorState from "../../components/ErrorState";
import { fetchConfig } from "../../services/api";
import { normalizeModels } from "../../utils/configParser";

export default function ModelPage() {
  const router = useRouter();
  const modelKey = typeof router.query.model === "string" ? router.query.model : null;
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: rawConfig, error: fetchError, isLoading } = useSWR(
    "/config",
    fetchConfig,
    { revalidateOnFocus: false }
  );

  const cfgError = fetchError?.message || (!modelKey && router.isReady ? "Missing model in URL" : null);

  const normalizedModels = useMemo(() => {
    if (!rawConfig?.models) return {};
    return normalizeModels(rawConfig.models);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(rawConfig?.models)]);

  const model = useMemo(() => normalizedModels[modelKey], [normalizedModels, modelKey]);
  const modelKeys = useMemo(() => Object.keys(normalizedModels), [normalizedModels]);

  useEffect(() => {
    if (!modelKey) return;
    setRefreshKey((k) => k + 1);
  }, [modelKey]);

  // Auto-clear toast after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      <div className="container">
        {/* Page Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Link href="/" style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textDecoration: "none",
              }}>
                Dashboard
              </Link>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>/</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
                {modelKey ? modelKey.charAt(0).toUpperCase() + modelKey.slice(1) : "..."}
              </span>
            </div>
            <h1 className="title" style={{ fontSize: 22 }}>
              {modelKey ? modelKey.charAt(0).toUpperCase() + modelKey.slice(1) : "Model"}
            </h1>
            <p className="subtitle">Manage records using generated forms and APIs.</p>
          </div>
          <div className="row">
            <button className="btn" type="button" onClick={() => setRefreshKey((k) => k + 1)}>
              Refresh
            </button>
          </div>
        </div>

        {/* Model Tabs */}
        {modelKeys.length > 1 && (
          <div style={{
            display: "flex",
            gap: 6,
            marginBottom: 24,
            overflowX: "auto",
          }}>
            {modelKeys.map((k) => (
              <Link
                key={k}
                href={`/app/${k}`}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius)",
                  border: "1px solid",
                  borderColor: k === modelKey ? "var(--accent)" : "var(--border)",
                  background: k === modelKey ? "var(--accent-muted)" : "var(--bg-surface)",
                  color: k === modelKey ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "all 150ms ease",
                }}
              >
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </Link>
            ))}
          </div>
        )}

        {/* Loading */}
        {!router.isReady || isLoading ? (
          <div style={{ padding: "64px 0" }}>
            <Spinner size="lg" />
          </div>
        ) : null}

        {/* Error */}
        {cfgError ? (
          <div style={{ marginBottom: 16 }}>
            <ErrorState message={cfgError} onRetry={() => setRefreshKey(k => k + 1)} />
          </div>
        ) : null}

        {/* Unknown model */}
        {!isLoading && !cfgError && !model ? (
          <div style={{ marginBottom: 16 }}>
            <ErrorState message={`Unknown model: ${String(modelKey)}`} />
          </div>
        ) : null}

        {/* Content */}
        {!isLoading && !cfgError && model ? (
          <>
            <Renderer
              uiConfig={[{ type: "form" }, { type: "table" }, { type: "csvImport" }]}
              schema={model}
              modelName={model.key}
              refreshKey={refreshKey}
              onCreated={async () => {
                setToast({ type: "ok", msg: "Record created successfully." });
                setRefreshKey((k) => k + 1);
              }}
              onError={(e) => setToast({ type: "err", msg: e?.message || "Request failed" })}
            />

            {/* Toast Notification */}
            {toast ? (
              <div style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                padding: "12px 20px",
                borderRadius: "var(--radius)",
                border: "1px solid",
                borderColor: toast.type === "ok" ? "var(--ok-muted)" : "var(--danger-muted)",
                background: toast.type === "ok" ? "var(--ok-muted)" : "var(--danger-muted)",
                color: toast.type === "ok" ? "var(--ok)" : "var(--danger)",
                fontSize: 13,
                fontWeight: 500,
                boxShadow: "var(--shadow-lg)",
                animation: "fadeIn 200ms ease",
                zIndex: 100,
              }}>
                {toast.msg}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
