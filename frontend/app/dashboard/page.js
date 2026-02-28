"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState([]);
  const [loadingWs, setLoadingWs] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const loadWorkspaces = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/api/workspaces", {}, token);
      setWorkspaces(data.workspaces || []);
    } catch {
      // silent
    } finally {
      setLoadingWs(false);
    }
  }, [token]);

  useEffect(() => { loadWorkspaces(); }, [loadWorkspaces]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const data = await apiFetch(
        "/api/workspaces",
        { method: "POST", body: JSON.stringify({ name: newName.trim() }) },
        token
      );
      setNewName("");
      router.push(`/dashboard/${data.workspace.id}`);
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Synthesis</h1>
        <button
          onClick={logout}
          className="text-xs text-[var(--muted)] transition hover:text-[var(--fg)]"
        >
          Log out
        </button>
      </header>

      {/* New workspace */}
      <form onSubmit={handleCreate} className="mt-10 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New workspace…"
          className="flex-1 border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--fg)]"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="rounded-lg bg-[var(--fg)] px-4 py-2 text-xs font-medium text-white transition hover:opacity-80 disabled:opacity-30"
        >
          Create
        </button>
      </form>

      {/* List */}
      {loadingWs ? (
        <p className="mt-12 text-center text-sm text-[var(--muted)]">Loading…</p>
      ) : workspaces.length === 0 ? (
        <p className="mt-16 text-center text-sm text-[var(--muted)]">
          No workspaces yet. Create one above.
        </p>
      ) : (
        <div className="mt-8 divide-y divide-[var(--border)]">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/${ws.id}`}
              className="group flex items-center justify-between py-3 transition"
            >
              <div>
                <p className="text-sm font-medium group-hover:text-[var(--fg)]">
                  {ws.name}
                </p>
                {ws.description && (
                  <p className="mt-0.5 text-xs text-[var(--muted)] line-clamp-1">
                    {ws.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-[var(--muted)]">
                {ws._count?.items || 0} docs
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
