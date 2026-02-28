"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) { router.replace("/dashboard"); return null; }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <Link href="/" className="mb-8 block text-center text-lg font-semibold">
          Synthesis
        </Link>

        <form onSubmit={handleSubmit}>
          {error && (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          )}

          <div className="grid gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--fg)]"
              placeholder="Email"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--fg)]"
              placeholder="Password"
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-lg bg-[var(--fg)] py-2 text-sm font-medium text-white transition hover:opacity-80 disabled:opacity-40"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          No account?{" "}
          <Link href="/register" className="text-[var(--fg)] underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
