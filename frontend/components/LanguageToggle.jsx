import { useLanguage } from "../contexts/LanguageContext";

/**
 * Language toggle — renders a compact segmented control.
 */
export default function LanguageToggle() {
  const { lang, setLang, languages } = useLanguage();

  return (
    <div style={{
      display: "flex",
      padding: 3,
      borderRadius: 10,
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      gap: 2,
    }}>
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          title={l.name}
          style={{
            padding: "5px 10px",
            borderRadius: 7,
            border: "none",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.02em",
            cursor: "pointer",
            transition: "all 150ms ease",
            background: lang === l.code ? "var(--accent-muted)" : "transparent",
            color: lang === l.code ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
