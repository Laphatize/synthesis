"use client";

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "../lib/api";

export default function GeniePanel({ workspaceId, token, open, onClose, onMutations }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [researchPending, setResearchPending] = useState(null); // { papers, queries, originalMessage, partialReply }
  const [selectedPapers, setSelectedPapers] = useState(new Set());
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, researchPending]);

  async function handleSend(overrideMessage, approvedPapers) {
    const text = overrideMessage || input.trim();
    if (!text || loading) return;

    if (!overrideMessage) {
      const userMsg = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
    }
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const body = { message: text, history };
      if (approvedPapers) body.approvedPapers = approvedPapers;

      const data = await apiFetch(
        `/api/workspaces/${workspaceId}/genie`,
        { method: "POST", body: JSON.stringify(body) },
        token
      );

      if (data.status === "research_pending") {
        // Show researching indicator + paper approval
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.partialReply, isResearching: true },
        ]);
        const allSelected = new Set(data.papers.map((_, i) => i));
        setSelectedPapers(allSelected);
        setResearchPending({
          papers: data.papers,
          queries: data.queries,
          originalMessage: text,
        });
      } else {
        const assistantMsg = { role: "assistant", content: data.reply || "No response." };
        setMessages((prev) => [...prev, assistantMsg]);

        if (data.createdItems?.length || data.updatedItems?.length || data.deletedItems?.length) {
          onMutations?.({
            createdItems: data.createdItems || [],
            updatedItems: data.updatedItems || [],
            deletedItems: data.deletedItems || [],
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleTogglePaper(idx) {
    setSelectedPapers((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  async function handleApproveResearch() {
    if (!researchPending) return;
    const approved = researchPending.papers.filter((_, i) => selectedPapers.has(i));
    const pending = researchPending;
    setResearchPending(null);

    // Replace the "researching" message with a summary of what was approved
    const paperNames = approved.map((p) => p.title).slice(0, 3);
    const summary = approved.length === 0
      ? "Continuing without papers…"
      : `Researching with ${approved.length} paper${approved.length > 1 ? "s" : ""}: ${paperNames.map((t) => `"${t.length > 40 ? t.slice(0, 40) + "…" : t}"`).join(", ")}`;
    setMessages((prev) => [
      ...prev.filter((m) => !m.isResearching),
      { role: "assistant", content: `🔍 ${summary}`, isStatus: true },
    ]);

    // Send follow-up with approved papers
    await handleSend(pending.originalMessage, approved);
  }

  function handleSkipResearch() {
    if (!researchPending) return;
    const pending = researchPending;
    setResearchPending(null);
    setMessages((prev) => [
      ...prev.filter((m) => !m.isResearching),
      { role: "assistant", content: "Continuing without papers…", isStatus: true },
    ]);
    handleSend(pending.originalMessage, []);
  }

  if (!open) return null;

  const starters = [
    "Find me relevant papers on my research topic",
    "Generate a sample dataset with 20 rows",
    "Summarize what's in this workspace",
    "What connections exist between my documents?",
  ];

  return (
    <aside className="flex w-80 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">✨</span>
          <span className="text-sm font-medium">Genie</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-[var(--muted)] transition hover:text-[var(--fg)]"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !researchPending ? (
          <div className="flex flex-col gap-3 pt-4">
            <p className="text-xs text-[var(--muted)] text-center mb-2">
              Ask Genie to find data, research papers, answer questions, or generate datasets.
            </p>
            {starters.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="w-full text-left rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)] transition hover:border-[var(--fg)] hover:text-[var(--fg)]"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--fg)] text-white"
                      : msg.isStatus
                        ? "bg-[#e8f4fd] text-[var(--fg)]"
                        : "bg-[#f4f4f4] text-[var(--fg)]"
                  }`}
                >
                  <InlineMarkdown text={msg.content} />
                </div>
              </div>
            ))}

            {/* Research approval modal inline */}
            {researchPending && (
              <div className="genie-research-card">
                <div className="genie-research-header">
                  <span className="text-sm">🔍</span>
                  <span className="text-xs font-medium">Genie wants to research</span>
                </div>
                <p className="text-[10px] text-[var(--muted)] px-3 pb-1">
                  Select which papers to include:
                </p>
                <div className="genie-research-papers">
                  {researchPending.papers.map((paper, idx) => (
                    <label
                      key={idx}
                      className={`genie-research-paper ${selectedPapers.has(idx) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPapers.has(idx)}
                        onChange={() => handleTogglePaper(idx)}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-2">
                        <span className={`genie-research-check ${selectedPapers.has(idx) ? "checked" : ""}`}>
                          {selectedPapers.has(idx) ? "✓" : ""}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium leading-tight line-clamp-2">{paper.title}</p>
                          <p className="text-[10px] text-[var(--muted)] mt-0.5">
                            {(paper.authors || []).slice(0, 2).join(", ")}{paper.authors?.length > 2 ? " et al." : ""} · {paper.published}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="genie-research-actions">
                  <button
                    onClick={handleSkipResearch}
                    className="text-[10px] text-[var(--muted)] transition hover:text-[var(--fg)]"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleApproveResearch}
                    disabled={selectedPapers.size === 0}
                    className="rounded-md bg-[var(--fg)] px-3 py-1.5 text-[10px] font-medium text-white transition hover:opacity-80 disabled:opacity-40"
                  >
                    Continue with {selectedPapers.size} paper{selectedPapers.size !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            )}

            {loading && !researchPending && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-[#f4f4f4] px-3 py-2">
                  <span className="papers-loader" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Genie…"
            disabled={loading || !!researchPending}
            className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-xs outline-none transition focus:border-[var(--fg)]"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim() || !!researchPending}
            className="rounded-lg bg-[var(--fg)] px-3 py-2 text-xs text-white transition hover:opacity-80 disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </aside>
  );
}

function InlineMarkdown({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // File action badges (Cursor-style)
        const fileActionMatch = line.match(/^(📎|✏️|🗑)\s+(Created|Updated|Deleted)\s+file:\s+\*\*(.*?)\*\*$/);
        if (fileActionMatch) {
          const [, icon, action, fileName] = fileActionMatch;
          return (
            <div key={i} className="genie-file-pill">
              <span className="genie-file-pill-icon">{icon}</span>
              <span className="genie-file-pill-action" data-action={action.toLowerCase()}>{action}</span>
              <span className="genie-file-pill-name">{fileName}</span>
            </div>
          );
        }

        // Bold
        let processed = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        // Inline code
        processed = processed.replace(/`([^`]+)`/g, '<code class="text-[10px] bg-white/20 px-1 rounded">$1</code>');

        if (!processed.trim()) return <br key={i} />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
      })}
    </div>
  );
}
