"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api";
import { useArxivSuggestions } from "../../lib/use-arxiv";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Editor from "../../components/Editor";
import PapersSidebar from "../../components/PapersSidebar";

export default function WorkspacePage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id;

  const [workspace, setWorkspace] = useState(null);
  const [items, setItems] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);
  const [loadingWs, setLoadingWs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [papersOpen, setPapersOpen] = useState(true);
  const [editorText, setEditorText] = useState("");

  const { papers, loading: papersLoading, query: papersQuery } = useArxivSuggestions(editorText);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const loadWorkspace = useCallback(async () => {
    if (!token || !workspaceId) return;
    try {
      const [wsData, itemsData] = await Promise.all([
        apiFetch(`/api/workspaces/${workspaceId}`, {}, token),
        apiFetch(`/api/workspaces/${workspaceId}/items`, {}, token),
      ]);
      setWorkspace(wsData.workspace);
      const fetchedItems = itemsData.items || [];
      setItems(fetchedItems);
      // Auto-select first doc
      if (fetchedItems.length && !activeItemId) {
        setActiveItemId(fetchedItems[0].id);
      }
    } catch {
      // silent
    } finally {
      setLoadingWs(false);
    }
  }, [token, workspaceId, activeItemId]);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  const activeItem = items.find((i) => i.id === activeItemId) || null;

  async function handleCreateDoc() {
    try {
      const data = await apiFetch(
        `/api/workspaces/${workspaceId}/items`,
        {
          method: "POST",
          body: JSON.stringify({
            type: "note",
            title: "Untitled",
            content: "",
            autoEmbed: false,
          }),
        },
        token
      );
      setItems((prev) => [data.item, ...prev]);
      setActiveItemId(data.item.id);
    } catch {
      // silent
    }
  }

  async function handleUpdateContent(html) {
    if (!activeItemId) return;
    setSaving(true);
    // Optimistically update local state
    setItems((prev) =>
      prev.map((i) => (i.id === activeItemId ? { ...i, content: html } : i))
    );
    try {
      await apiFetch(
        `/api/workspaces/${workspaceId}/items/${activeItemId}`,
        { method: "PATCH", body: JSON.stringify({ content: html }) },
        token
      );
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleRenameItem(itemId, newTitle) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, title: newTitle } : i))
    );
    try {
      await apiFetch(
        `/api/workspaces/${workspaceId}/items/${itemId}`,
        { method: "PATCH", body: JSON.stringify({ title: newTitle }) },
        token
      );
    } catch {
      // silent
    }
  }

  async function handleDeleteItem(itemId) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (activeItemId === itemId) {
      const remaining = items.filter((i) => i.id !== itemId);
      setActiveItemId(remaining.length ? remaining[0].id : null);
    }
    try {
      await apiFetch(
        `/api/workspaces/${workspaceId}/items/${itemId}`,
        { method: "DELETE" },
        token
      );
    } catch {
      // silent
    }
  }

  if (loading || !user) return null;

  if (loadingWs) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <p className="text-sm text-[var(--muted)]">Workspace not found</p>
        <Link href="/dashboard" className="text-xs underline">Back</Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-all ${
          sidebarOpen ? "w-60" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="text-xs text-[var(--muted)] transition hover:text-[var(--fg)]"
          >
            ← Back
          </Link>
          <button
            onClick={handleCreateDoc}
            className="text-xs font-medium text-[var(--fg)] transition hover:opacity-60"
          >
            + New
          </button>
        </div>

        <div className="px-4 pb-2">
          <p className="truncate text-sm font-medium">{workspace.name}</p>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[var(--muted)]">
              No docs yet
            </p>
          ) : (
            items.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                active={item.id === activeItemId}
                onSelect={() => setActiveItemId(item.id)}
                onRename={(title) => handleRenameItem(item.id, title)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-xs text-[var(--muted)] transition hover:text-[var(--fg)]"
            >
              {sidebarOpen ? "◁" : "▷"}
            </button>
            {activeItem && (
              <span className="text-sm font-medium">{activeItem.title || "Untitled"}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-[10px] text-[var(--muted)]">Saving…</span>
            )}
            <button
              onClick={() => setPapersOpen(!papersOpen)}
              className={`text-xs transition ${
                papersOpen ? "text-[var(--fg)]" : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
              title="Toggle research papers"
            >
              📄 Papers
            </button>
          </div>
        </div>

        {/* Editor */}
        {activeItem ? (
          <Editor
            key={activeItemId}
            content={activeItem.content || ""}
            onUpdate={handleUpdateContent}
            onTextChange={setEditorText}
            placeholder="Start writing…"
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-[var(--muted)]">
                {items.length === 0
                  ? "Create a doc to get started"
                  : "Select a doc from the sidebar"}
              </p>
              {items.length === 0 && (
                <button
                  onClick={handleCreateDoc}
                  className="mt-3 rounded-lg bg-[var(--fg)] px-4 py-2 text-xs font-medium text-white transition hover:opacity-80"
                >
                  New doc
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Research papers sidebar */}
      <PapersSidebar
        papers={papers}
        loading={papersLoading}
        query={papersQuery}
        open={papersOpen}
        onToggle={() => setPapersOpen(false)}
      />
    </div>
  );
}

function SidebarItem({ item, active, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title || "Untitled");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commitRename() {
    setEditing(false);
    const trimmed = title.trim() || "Untitled";
    setTitle(trimmed);
    if (trimmed !== item.title) onRename(trimmed);
  }

  return (
    <div
      className={`group flex items-center gap-1 px-4 py-1.5 text-sm transition cursor-pointer ${
        active ? "bg-[#f0f0f0] font-medium" : "text-[var(--muted)] hover:bg-[#f8f8f8]"
      }`}
      onClick={onSelect}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") { setTitle(item.title || "Untitled"); setEditing(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      ) : (
        <span className="flex-1 truncate">{item.title || "Untitled"}</span>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="text-[10px] text-[var(--muted)] hover:text-[var(--fg)]"
          title="Rename"
        >
          ✎
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-[10px] text-[var(--muted)] hover:text-red-500"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
