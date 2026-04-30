import useSWR from "swr";
import { fetchConfig } from "../services/api";

export default function SafeModeBanner() {
  const { data: config } = useSWR("/config", fetchConfig);

  if (!config?.systemState?.safeMode) {
    return null;
  }

  return (
    <div style={{
      background: "rgba(245, 158, 11, 0.15)",
      color: "#d97706",
      padding: "12px 20px",
      textAlign: "center",
      fontWeight: 600,
      fontSize: 14,
      borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
      zIndex: 9999,
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "8px"
    }}>
      <span>⚠️</span>
      <span>Invalid config detected — fallback mode enabled</span>
    </div>
  );
}
