"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../lib/api";

export default function PaperModal({ paper, userText, onClose }) {
  const [tab, setTab] = useState("overview"); // overview | suggestions | chat
  const [suggestions, setSuggestions] = useState("");
  const [sugLoading, setSugLoading] = useState(false);
  const [sugError, setSugError] = useState("");

  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Auto-fetch suggestions when tab is selected
  useEffect(() => {
    if (tab === "suggestions" && !suggestions && !sugLoading) {
      fetchSuggestions();
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  // Focus input when switching to chat
  useEffect(() => {
    if (tab === "chat") inputRef.current?.focus();
  }, [tab]);

  const fetchSuggestions = useCallback(async () => {
    setSugLoading(true);
    setSugError("");
    try {
      const data = await apiFetch("/api/arxiv/analyze", {
        method: "POST",
        body: JSON.stringify({
          paper: {
            title: paper.title,
            summary: paper.summary,
            authors: paper.authors,
          },
          userText: userText || "",
        }),
      });
      setSuggestions(data.suggestions);
    } catch (err) {
      setSugError(err.message);
    } finally {
      setSugLoading(false);
    }
  }, [paper, userText]);

  async function sendChat(e) {
    e?.preventDefault();
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const newHistory = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const data = await apiFetch("/api/arxiv/chat", {
        method: "POST",
        body: JSON.stringify({
          paper: {
            title: paper.title,
            summary: paper.summary,
            authors: paper.authors,
          },
          history: newHistory.slice(-10),
          message: msg,
        }),
      });
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="paper-modal-overlay" onClick={onClose}>
      <div className="paper-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="paper-modal-header">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold leading-snug pr-4">{paper.title}</h2>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              {paper.authors?.join(", ")}
              {paper.authors?.length >= 4 && " et al."}
              {paper.published && <> · {paper.published}</>}
            </p>
          </div>
          <button onClick={onClose} className="paper-modal-close">✕</button>
        </div>

        {/* Tabs */}
        <div className="paper-modal-tabs">
          {["overview", "suggestions", "chat"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`paper-modal-tab ${tab === t ? "active" : ""}`}
            >
              {t === "overview" && "Overview"}
              {t === "suggestions" && "✨ Suggestions"}
              {t === "chat" && "💬 Chat"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="paper-modal-body">
          {/* ─── Overview ─── */}
          {tab === "overview" && (
            <div className="paper-modal-scroll">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                  Abstract
                </h3>
                <p className="text-sm leading-relaxed">{paper.summary}</p>
              </div>

              {paper.categories?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f0f0] text-[var(--muted)]"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                {paper.absUrl && (
                  <a
                    href={paper.absUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded border border-[var(--border)] text-[var(--fg)] hover:bg-[#f8f8f8] transition"
                  >
                    View on ArXiv ↗
                  </a>
                )}
                {paper.pdfUrl && (
                  <a
                    href={paper.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded border border-[var(--border)] text-[var(--fg)] hover:bg-[#f8f8f8] transition"
                  >
                    PDF ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ─── Suggestions ─── */}
          {tab === "suggestions" && (
            <div className="paper-modal-scroll">
              {sugLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center">
                  <span className="papers-loader" />
                  <span className="text-xs text-[var(--muted)]">
                    Analyzing how this paper applies to your writing…
                  </span>
                </div>
              ) : sugError ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-red-500 mb-2">{sugError}</p>
                  <button
                    onClick={fetchSuggestions}
                    className="text-xs text-[var(--fg)] underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="paper-markdown text-sm leading-relaxed">
                  <Markdown text={suggestions} />
                </div>
              )}
            </div>
          )}

          {/* ─── Chat ─── */}
          {tab === "chat" && (
            <div className="flex flex-col h-full">
              <div className="paper-modal-scroll flex-1">
                {chatHistory.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-[var(--muted)]">
                      Ask anything about this paper.
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                      {[
                        "What methodology does this paper use?",
                        "What are the key findings?",
                        "What are the limitations?",
                        "How does this compare to related work?",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setChatInput(q);
                            inputRef.current?.focus();
                          }}
                          className="text-[10px] px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] hover:border-[var(--fg)] transition"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`paper-chat-msg ${msg.role === "user" ? "user" : "assistant"}`}
                  >
                    <div className="text-[10px] font-medium text-[var(--muted)] mb-0.5 uppercase tracking-wider">
                      {msg.role === "user" ? "You" : "Synthesis"}
                    </div>
                    <div className="paper-markdown text-sm leading-relaxed">
                      <Markdown text={msg.content} />
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="paper-chat-msg assistant">
                    <div className="text-[10px] font-medium text-[var(--muted)] mb-0.5 uppercase tracking-wider">
                      Synthesis
                    </div>
                    <span className="papers-loader" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendChat} className="paper-chat-input-bar">
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about this paper…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="text-xs font-medium text-[var(--fg)] disabled:text-[var(--muted)] transition"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple markdown-to-JSX renderer.
 * Handles: headers, bold, italic, code, bullet lists, numbered lists, links.
 */
function Markdown({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headers
    if (line.startsWith("### ")) {
      elements.push(<h4 key={i} className="font-semibold text-xs mt-3 mb-1">{parseInline(line.slice(4))}</h4>);
    } else if (line.startsWith("## ")) {
      elements.push(<h3 key={i} className="font-semibold text-sm mt-3 mb-1">{parseInline(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      elements.push(<h2 key={i} className="font-bold text-base mt-3 mb-1">{parseInline(line.slice(2))}</h2>);
    }
    // Bullet list
    else if (/^[-*•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-4 my-1.5 space-y-1">
          {items.map((item, j) => (
            <li key={j}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    else if (/^\d+[.)]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+[.)]\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-4 my-1.5 space-y-1">
          {items.map((item, j) => (
            <li key={j}>{parseInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }
    // Empty line
    else if (line.trim() === "") {
      // skip
    }
    // Paragraph
    else {
      elements.push(<p key={i} className="my-1">{parseInline(line)}</p>);
    }

    i++;
  }

  return <>{elements}</>;
}

function parseInline(text) {
  // Process: **bold**, *italic*, `code`, [links](url)
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic
    const italicMatch = remaining.match(/\*(.+?)\*/);
    // Code
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Link
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    // Find earliest match
    const matches = [
      boldMatch && { type: "bold", index: boldMatch.index, match: boldMatch },
      italicMatch && { type: "italic", index: italicMatch.index, match: italicMatch },
      codeMatch && { type: "code", index: codeMatch.index, match: codeMatch },
      linkMatch && { type: "link", index: linkMatch.index, match: linkMatch },
    ].filter(Boolean);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    // Prefer bold over italic when at same position
    matches.sort((a, b) => {
      if (a.index !== b.index) return a.index - b.index;
      if (a.type === "bold") return -1;
      if (b.type === "bold") return 1;
      return 0;
    });

    const first = matches[0];
    const before = remaining.slice(0, first.index);
    if (before) parts.push(before);

    if (first.type === "bold") {
      parts.push(<strong key={key++}>{first.match[1]}</strong>);
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === "italic") {
      parts.push(<em key={key++}>{first.match[1]}</em>);
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === "code") {
      parts.push(
        <code key={key++} className="text-[12px] bg-[#f4f4f4] px-1 py-0.5 rounded font-mono">
          {first.match[1]}
        </code>
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === "link") {
      parts.push(
        <a key={key++} href={first.match[2]} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">
          {first.match[1]}
        </a>
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    }
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}
