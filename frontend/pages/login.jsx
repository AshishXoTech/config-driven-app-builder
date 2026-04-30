import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { login as apiLogin, signup as apiSignup, sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import Spinner from "../components/Spinner";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (router.query.expired) {
      setError("Session expired, please login again");
    }
  }, [router.query.expired]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "otp") {
        if (!otpSent) {
          await apiSendOtp(email);
          setOtpSent(true);
          setLoading(false);
          return;
        } else {
          await apiVerifyOtp(email, otpCode);
          login();
        }
      } else if (mode === "login") {
        await apiLogin(email, password);
        login();
      } else {
        await apiSignup(email, password);
        login();
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: "login", label: "Sign in" },
    { key: "signup", label: "Sign up" },
    { key: "otp", label: "OTP Login" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "var(--bg)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "var(--bg-raised)",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "32px 32px 0", textAlign: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            margin: "0 auto 16px",
          }}>
            S
          </div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "0 0 4px",
            color: "var(--text)",
          }}>
            SchemaForge
          </h1>
          <p style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: "0 0 24px",
          }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create an account" : "Passwordless login"}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          margin: "0 32px",
          borderRadius: 10,
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          padding: 3,
          gap: 2,
        }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setMode(t.key);
                setError(null);
                setOtpSent(false);
                setOtpCode("");
              }}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease",
                background: mode === t.key ? "var(--bg-hover)" : "transparent",
                color: mode === t.key ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            margin: "16px 32px 0",
            padding: "10px 14px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--danger-muted)",
            fontSize: 13,
            color: "var(--text)",
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 32px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={mode === "otp" && otpSent}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-hover)",
                  background: "var(--bg-surface)",
                  color: "var(--text)",
                  fontSize: 13,
                  outline: "none",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 2px var(--accent)";
                }}
                  onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-hover)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {mode !== "otp" && (
              <div>
                <label style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-hover)",
                    background: "var(--bg-surface)",
                    color: "var(--text)",
                    fontSize: 13,
                    outline: "none",
                    transition: "border-color 150ms ease, box-shadow 150ms ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                    e.target.style.boxShadow = "0 0 0 2px var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-hover)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            )}

            {mode === "otp" && otpSent && (
              <div>
                <label style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}>
                  6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-hover)",
                    background: "var(--bg-surface)",
                    color: "var(--text)",
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "0.2em",
                    textAlign: "center",
                    outline: "none",
                    transition: "border-color 150ms ease, box-shadow 150ms ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                    e.target.style.boxShadow = "0 0 0 2px var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-hover)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                  Check your server console for the OTP code.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 20,
              padding: "10px 0",
              borderRadius: "var(--radius)",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "all 150ms ease",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading && <Spinner size="sm" />}
            {loading
              ? "Please wait..."
              : mode === "otp"
              ? otpSent ? "Verify Code" : "Send OTP"
              : mode === "login"
              ? "Sign in"
              : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
