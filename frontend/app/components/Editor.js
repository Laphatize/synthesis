"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { useEffect, useRef } from "react";

export default function Editor({ content, onUpdate, onTextChange, placeholder = "Start writing…" }) {
  const debounceRef = useRef(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "code-block" } },
      }),
      Placeholder.configure({ placeholder }),
      Typography,
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
    onUpdate: ({ editor }) => {
      if (!onUpdate) return;
      // Debounce saves
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(editor.getHTML());
      }, 500);
      // Plain text for AI features (immediate)
      if (onTextChange) onTextChange(editor.getText());
    },
  });

  // Sync external content changes (e.g. loading a different doc)
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-1 flex-col">
      {/* Minimal toolbar */}
      <div className="flex items-center gap-0.5 border-b border-[var(--border)] px-1 py-1">
        <ToolBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="B"
          className="font-bold"
        />
        <ToolBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="I"
          className="italic"
        />
        <ToolBtn
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          label="S"
          className="line-through"
        />
        <Sep />
        <ToolBtn
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          label="H1"
        />
        <ToolBtn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="H2"
        />
        <ToolBtn
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="H3"
        />
        <Sep />
        <ToolBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="•"
        />
        <ToolBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="1."
        />
        <ToolBtn
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="❝"
        />
        <ToolBtn
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          label="<>"
          className="font-mono text-[10px]"
        />
        <Sep />
        <ToolBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label="—"
        />
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-10 md:px-16 lg:px-24">
        <div className="mx-auto max-w-2xl">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ active, onClick, label, className = "" }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs transition ${className} ${
        active
          ? "bg-[var(--fg)] text-white"
          : "text-[var(--muted)] hover:bg-[#f0f0f0] hover:text-[var(--fg)]"
      }`}
    >
      {label}
    </button>
  );
}

function Sep() {
  return <div className="mx-1 h-4 w-px bg-[var(--border)]" />;
}
