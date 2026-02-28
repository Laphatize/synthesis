"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";

const ACTIONS = [
  { key: "explore", label: "🔍 Explore further" },
  { key: "elaborate", label: "📝 Elaborate" },
  { key: "simplify", label: "✏️ Simplify" },
  { key: "shorten", label: "✂️ Shorten" },
  { key: "academic", label: "🎓 Academic tone" },
  { key: "counterargument", label: "⚖️ Counter-argument" },
];

export default function AIBubbleMenu({ editor }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, " ");

      if (from === to || text.trim().length < 3 || editor.isActive("codeBlock")) {
        setVisible(false);
        return;
      }

      // Get coordinates of selection
      const coords = editor.view.coordsAtPos(from);
      const editorRect = editor.view.dom.closest(".flex-1.overflow-y-auto")?.getBoundingClientRect();
      if (!editorRect) { setVisible(false); return; }

      setPos({
        top: coords.top - editorRect.top - 48,
        left: coords.left - editorRect.left,
      });
      setVisible(true);
    };

    editor.on("selectionUpdate", update);
    editor.on("blur", () => {
      // Delay to allow button clicks
      setTimeout(() => {
        if (!menuRef.current?.contains(document.activeElement)) {
          setVisible(false);
        }
      }, 200);
    });

    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  const handleAction = useCallback(
    async (action) => {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      if (!selectedText.trim()) return;

      setLoading(true);
      setActiveAction(action);

      try {
        const fullText = editor.getText();
        const data = await apiFetch("/api/arxiv/transform", {
          method: "POST",
          body: JSON.stringify({
            text: selectedText,
            action,
            context: fullText,
          }),
        });

        if (data.result) {
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContentAt(from, data.result)
            .run();
        }
      } catch (err) {
        console.error("AI transform failed:", err.message);
      } finally {
        setLoading(false);
        setActiveAction(null);
        setVisible(false);
      }
    },
    [editor]
  );

  if (!visible && !loading) return null;

  return (
    <div
      ref={menuRef}
      className="ai-bubble-menu"
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 50,
        transform: "translateX(-25%)",
      }}
    >
      {loading ? (
        <div className="ai-bubble-loading">
          <span className="papers-loader" />
          <span className="text-[11px] text-[var(--muted)]">
            {ACTIONS.find((a) => a.key === activeAction)?.label.replace(/^.+?\s/, "")}…
          </span>
        </div>
      ) : (
        <div className="ai-bubble-actions">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAction(a.key)}
              className="ai-bubble-btn"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
