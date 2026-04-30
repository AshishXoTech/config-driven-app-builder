import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import ErrorState from "../components/ErrorState";
import { fetchConfig } from "../services/api";
import { normalizeModels } from "../utils/configParser";

const features = [
  {
    title: "Config-Driven UI",
    desc: "Define your data model in JSON — forms, tables, and validation rules generate automatically.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
        <path d="M3 9h6" />
        <path d="M3 15h6" />
      </svg>
    ),
  },
  {
    title: "Auto-Generated APIs",
    desc: "CRUD endpoints created dynamically from config. No boilerplate, full validation built in.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: "Authentication",
    desc: "User-scoped data with JWT cookies, OTP login, rate limiting, and CSRF protection.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "CSV Import",
    desc: "Bulk import with streaming, row-level validation, duplicate detection, and detailed error reports.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    title: "Multi-Language",
    desc: "Labels resolve from config-driven language objects. Switch between EN and HI at runtime.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: "Notifications",
    desc: "Event-driven notification system logs CRUD operations with per-user tracking.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

const steps = [
  { num: "1", title: "Define Config", desc: "Write a JSON config with models, fields, types, and validation rules." },
  { num: "2", title: "System Generates", desc: "APIs, forms, tables, and validation are created automatically." },
  { num: "3", title: "Manage Data", desc: "Create, read, update, delete, and bulk import records instantly." },
];

const techStack = ["Next.js", "Node.js", "TypeScript", "Prisma", "PostgreSQL", "Zod"];

export default function Home() {
  const { data: rawConfig, error: fetchError, isLoading, mutate } = useSWR(
    "/config",
    fetchConfig,
    { revalidateOnFocus: false }
  );

  const error = fetchError?.message || null;
  const items = useMemo(() => {
    if (!rawConfig?.models) return [];
    return Object.values(normalizeModels(rawConfig.models));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(rawConfig?.models)]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────── */}
      <section style={{
        textAlign: "center",
        padding: "80px 24px 64px",
        background: "linear-gradient(to bottom, #ffffff, #eef2ff)",
      }}>
        <div style={{
          maxWidth: 680,
          margin: "0 auto",
        }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 14px",
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: "var(--bg-surface)",
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-secondary)",
          marginBottom: 24,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)" }} />
          Open Source · Config-Driven
        </div>

        <h1 style={{
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          margin: "0 0 16px",
          color: "var(--text)",
        }}>
          Build dynamic CRUD apps<br />
          <span style={{ color: "var(--accent)" }}>from config — instantly</span>
        </h1>

        <p style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          maxWidth: 480,
          margin: "0 auto 32px",
        }}>
          SchemaForge generates full-stack CRUD interfaces, APIs, and validation
          from a single JSON configuration file. No boilerplate.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <a href="#dashboard" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 24px",
            borderRadius: "var(--radius)",
            background: "var(--accent)",
            color: "#fff",
            boxShadow: "var(--shadow-sm)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 150ms ease",
          }}>
            Explore Dashboard ↓
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 24px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--bg-surface)",
            color: "var(--text-secondary)",
            boxShadow: "var(--shadow-sm)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 150ms ease",
          }}>
            View Source
          </a>
        </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "0 24px 64px",
      }}>
        <h2 style={{
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: 32,
        }}>
          Features
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {features.map((f, idx) => (
            <div key={f.title} style={{
              padding: "24px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--bg-raised)",
              boxShadow: "var(--shadow-sm)",
              transition: "box-shadow 150ms ease, border-color 150ms ease",
              borderTop: `3px solid ${["var(--accent)", "var(--blue)", "var(--teal)", "var(--amber)", "var(--blue)", "var(--accent)"][idx % 6]}`,
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: ["var(--accent-muted)", "var(--blue-muted)", "var(--teal-muted)", "var(--amber-muted)", "var(--blue-muted)", "var(--accent-muted)"][idx % 6],
                color: ["var(--accent)", "var(--blue)", "var(--teal)", "var(--amber)", "var(--blue)", "var(--accent)"][idx % 6],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                margin: "0 0 8px",
              }}>
                {f.title}
              </h3>
              <p style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--text-secondary)",
                margin: 0,
              }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────── */}
      <section style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "0 24px 64px",
      }}>
        <h2 style={{
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: 32,
        }}>
          How It Works
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.map((s, idx) => (
            <div key={s.num} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              padding: "20px 24px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--bg-raised)",
              boxShadow: "var(--shadow-sm)",
              borderLeft: `4px solid ${["var(--accent)", "var(--blue)", "var(--teal)"][idx % 3]}`,
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: ["var(--accent-muted)", "var(--blue-muted)", "var(--teal-muted)"][idx % 3],
                color: ["var(--accent)", "var(--blue)", "var(--teal)"][idx % 3],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}>
                {s.num}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: "var(--text)" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ─────────────────────────── */}
      <section style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "0 24px 64px",
        textAlign: "center",
      }}>
        <h2 style={{
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-muted)",
          marginBottom: 20,
        }}>
          Built With
        </h2>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {techStack.map((t) => (
            <span key={t} style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Dashboard ────────────────────────────── */}
      <section id="dashboard" style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "0 24px 80px",
      }}>
        <div style={{
          padding: "32px",
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--bg-raised)",
          boxShadow: "var(--shadow-lg)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "var(--text)" }}>
                Dashboard
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                Select a model to manage its records.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: "48px 0" }}>
              <Spinner size="lg" />
            </div>
          ) : null}

          {error ? (
            <ErrorState message={error} onRetry={() => mutate()} />
          ) : null}

          {!isLoading && !error && items.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 0",
              color: "var(--text-muted)",
              fontSize: 13,
            }}>
              No models configured. Add models to your backend config.
            </div>
          ) : null}

          {!isLoading && !error && items.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}>
              {items.map((m) => (
                <Link key={m.key} href={`/app/${m.key}`} style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "20px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  borderTop: "3px solid var(--teal)",
                  boxShadow: "var(--shadow-sm)",
                  textDecoration: "none",
                  transition: "all 150ms ease",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--accent-muted)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                    {m.key.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                    {m.key.charAt(0).toUpperCase() + m.key.slice(1)}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {m.fields?.length || 0} fields configured
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Footer ────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "24px",
        textAlign: "center",
        fontSize: 12,
        color: "var(--text-muted)",
      }}>
        SchemaForge — Config-driven full-stack CRUD system
      </footer>

      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "24px",
        textAlign: "center",
        fontSize: 12,
        color: "var(--text-muted)",
      }}>
        Made By Ashish Kumar Jha
      </footer>
    </div>
  );
}
