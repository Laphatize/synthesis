"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

export default function NewDocModal({ onCreated, onClose, workspaceId, token }) {
  const [mode, setMode] = useState(null); // null = choosing, "ai" = AI form
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  function handleScratch() {
    onCreated({ title: "Untitled", content: "" });
  }

  async function handleAI(e) {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setError("");

    try {
      const data = await apiFetch(
        "/api/arxiv/generate",
        {
          method: "POST",
          body: JSON.stringify({ topic: topic.trim() }),
        },
        token
      );
      onCreated({
        title: data.title || topic.trim(),
        content: data.content || "",
      });
    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
  }

  return (
    <div className="paper-modal-overlay" onClick={onClose}>
      <div
        className="paper-modal"
        style={{ maxWidth: 420, maxHeight: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="paper-modal-header">
          <div className="flex-1">
            <h2 className="text-sm font-semibold">
              {mode === "ai" ? "Create with AI" : "New document"}
            </h2>
          </div>
          <button onClick={onClose} className="paper-modal-close">✕</button>
        </div>

        <div style={{ padding: "1.25rem" }}>
          {/* ─── Mode selection ─── */}
          {mode === null && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleScratch}
                className="new-doc-option"
              >
                <span className="new-doc-icon">✎</span>
                <div className="text-left">
                  <p className="text-sm font-medium">From scratch</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Start with a blank document
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("ai")}
                className="new-doc-option"
              >
                <span className="new-doc-icon">✨</span>
                <div className="text-left">
                  <p className="text-sm font-medium">With AI</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Generate a starter draft from a topic
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ─── AI form ─── */}
          {mode === "ai" && (
            <form onSubmit={handleAI}>
              <label className="block text-xs text-[var(--muted)] mb-1.5">
                What do you want to write about?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Transformer architectures for protein folding"
                className="w-full border-b border-[var(--border)] bg-transparent py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--fg)] mb-3"
                autoFocus
                disabled={generating}
              />

              {error && (
                <p className="text-[11px] text-red-500 mb-2">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setMode(null); setError(""); }}
                  className="text-xs text-[var(--muted)] hover:text-[var(--fg)] transition"
                  disabled={generating}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={!topic.trim() || generating}
                  className="text-xs font-medium px-4 py-1.5 rounded bg-[var(--fg)] text-white disabled:opacity-40 transition"
                >
                  {generating ? (
                    <span className="flex items-center gap-1.5">
                      <span className="papers-loader" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />
                      Generating…
                    </span>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
