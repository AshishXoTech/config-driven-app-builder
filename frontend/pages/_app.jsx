import "../styles/globals.css";
import Head from "next/head";
import { LanguageProvider } from "../contexts/LanguageContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import SafeModeBanner from "../components/SafeModeBanner";

import { getMe } from "../services/api";

function ProtectedRoute({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleExpired = () => {
      setAuthenticated(false);
      router.push("/login?expired=true");
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [router]);

  useEffect(() => {
    if (router.pathname === "/login") {
      setLoading(false);
      return;
    }

    // Force validation
    async function validate() {
      try {
        await getMe();
        setAuthenticated(true);
      } catch (err) {
        setAuthenticated(false);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    validate();
  }, [router.pathname]);

  if (!mounted) return null;

  if (router.pathname === "/login") {
    return children;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!authenticated) {
    return null; // The useEffect will handle the redirect
  }

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/logo.png" />
      </Head>
      <AuthProvider>
        <LanguageProvider>
          <ProtectedRoute>
            <SafeModeBanner />
            <Component {...pageProps} />
          </ProtectedRoute>
        </LanguageProvider>
      </AuthProvider>
    </>
  );
}
