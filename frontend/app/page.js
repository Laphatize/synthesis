"use client";

import { useAuth } from "./lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Synthesis</h1>
      <p style={{ color: "var(--muted)" }}>A place to think.</p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Link
          href="/login"
          style={{
            padding: "0.5rem 1.25rem",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--fg)",
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
        <Link
          href="/register"
          style={{
            padding: "0.5rem 1.25rem",
            background: "var(--fg)",
            color: "var(--bg)",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
