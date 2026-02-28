"use client";

import { useState } from "react";
import PaperModal from "./PaperModal";

export default function PapersSidebar({ papers, loading, query, open, onToggle, userText }) {
  const [selectedPaper, setSelectedPaper] = useState(null);

  return (
    <>
      <aside
        className={`flex flex-col border-l border-[var(--border)] bg-[var(--surface)] transition-all ${
          open ? "w-80" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--muted)]">
              Papers
            </span>
            {loading && <span className="papers-loader" />}
          </div>
          <button
            onClick={onToggle}
            className="text-xs text-[var(--muted)] hover:text-[var(--fg)] transition"
          >
            ✕
          </button>
        </div>

        {query && (
          <div className="px-4 py-2 border-b border-[var(--border)]">
            <p className="text-[10px] text-[var(--muted)] truncate">
              Searching: <span className="text-[var(--fg)]">{query}</span>
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {papers.length === 0 && !loading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-[var(--muted)]">
                {query
                  ? "No papers found for this topic."
                  : "Start writing to discover relevant research papers."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {papers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onClick={() => setSelectedPaper(paper)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Paper detail modal */}
      {selectedPaper && (
        <PaperModal
          paper={selectedPaper}
          userText={userText}
          onClose={() => setSelectedPaper(null)}
        />
      )}
    </>
  );
}

function PaperCard({ paper, onClick }) {
  return (
    <div
      className="px-4 py-3 hover:bg-[#fafafa] transition group cursor-pointer"
      onClick={onClick}
    >
      <h4 className="text-xs font-medium leading-snug mb-1 group-hover:text-blue-700 transition">
        {paper.title}
      </h4>

      <p className="text-[10px] text-[var(--muted)] mb-1.5 leading-relaxed">
        {paper.summaryShort || paper.summary}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-[var(--muted)]">
          {paper.authors.join(", ")}
          {paper.authors.length >= 4 && " et al."}
        </span>
        <span className="text-[10px] text-[var(--muted)]">·</span>
        <span className="text-[10px] text-[var(--muted)]">{paper.published}</span>
      </div>

      <div className="flex items-center gap-2 mt-1.5">
        {paper.categories.map((cat) => (
          <span
            key={cat}
            className="text-[9px] px-1.5 py-0.5 rounded bg-[#f0f0f0] text-[var(--muted)]"
          >
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}
