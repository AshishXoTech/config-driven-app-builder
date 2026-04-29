export default function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "14px 16px",
      borderRadius: "var(--radius)",
      border: "1px solid rgba(239,68,68,0.2)",
      background: "var(--danger-muted)",
    }}>
      <div style={{ color: "#f87171", marginTop: 1, flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#fca5a5", margin: 0 }}>
          {message || "Something went wrong"}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "5px 12px",
            borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.15)",
            color: "#fca5a5",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms ease",
            flexShrink: 0,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
