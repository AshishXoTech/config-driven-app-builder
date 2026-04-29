export default function EmptyState({ title = "No data available", description, icon }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      textAlign: "center",
      borderRadius: "var(--radius)",
      border: "1px dashed var(--border)",
      background: "var(--bg-surface)",
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: "var(--bg-hover)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        marginBottom: 16,
      }}>
        {icon || (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        )}
      </div>
      <h3 style={{
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text-secondary)",
        margin: "0 0 4px",
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          fontSize: 13,
          color: "var(--text-muted)",
          margin: 0,
          maxWidth: 320,
        }}>
          {description}
        </p>
      )}
    </div>
  );
}
