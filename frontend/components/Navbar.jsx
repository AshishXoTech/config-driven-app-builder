import Link from "next/link";
import { useRouter } from "next/router";
import LanguageToggle from "./LanguageToggle";

/**
 * Top navigation bar — displays across all authenticated pages.
 * Shows product name, language toggle, and logout action.
 */
export default function Navbar() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
    } catch (_) {}
    router.push("/login");
  }

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      height: "56px",
      background: "var(--bg-raised)",
      borderBottom: "1px solid var(--border)",
      backdropFilter: "blur(12px)",
    }}>
      <Link href="/" style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "linear-gradient(135deg, #8b7af5 0%, #6c5ce7 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "#fff",
        }}>
          S
        </div>
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: "var(--text)",
        }}>
          SchemaForge
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <LanguageToggle />
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.color = "var(--text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
