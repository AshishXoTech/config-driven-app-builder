export default function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "14px 16px",
      borderRadius: "var(--radius)",
      border: "1px solid var(--border)",
      background: "var(--danger-muted)",
    }}>
      <div style={{
        color: "var(--accent)",
        marginTop: 1,
        flexShrink: 0,
        padding: 8,
        borderRadius: 8,
        background: "var(--accent-muted)",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>
          {message || "Something went wrong"}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "5px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
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
