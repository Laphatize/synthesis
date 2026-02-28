"use client";

import { useState, useMemo } from "react";

export default function FileViewer({ item }) {
  const [viewMode, setViewMode] = useState("auto");
  const content = item.content || "";
  const ext = item.metadata?.extension || "";
  const type = item.type || "file";

  const isCSV = ext === "csv" || ext === "tsv";
  const isJSON = ext === "json";

  const parsedTable = useMemo(() => {
    if (!isCSV) return null;
    const sep = ext === "tsv" ? "\t" : ",";
    const lines = content.split("\n").filter((l) => l.trim());
    if (!lines.length) return null;
    const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) =>
      line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""))
    );
    return { headers, rows };
  }, [content, isCSV, ext]);

  const parsedJSON = useMemo(() => {
    if (!isJSON) return null;
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }, [content, isJSON]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
        <span className="text-xs text-[var(--muted)]">
          {type === "dataset" ? "📊" : type === "reference" ? "📎" : "📄"}{" "}
          {item.metadata?.fileName || item.title}
        </span>
        {item.metadata?.fileSize && (
          <span className="text-[10px] text-[var(--muted)]">
            ({formatBytes(item.metadata.fileSize)})
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {isCSV && (
            <>
              <ViewBtn
                label="Table"
                active={viewMode !== "raw"}
                onClick={() => setViewMode("auto")}
              />
              <ViewBtn
                label="Raw"
                active={viewMode === "raw"}
                onClick={() => setViewMode("raw")}
              />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isCSV && viewMode !== "raw" && parsedTable ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {parsedTable.headers.map((h, i) => (
                    <th
                      key={i}
                      className="border border-[var(--border)] bg-[#f8f8f8] px-3 py-1.5 text-left text-xs font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedTable.rows.slice(0, 200).map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "" : "bg-[#fafafa]"}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="border border-[var(--border)] px-3 py-1.5 text-xs"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedTable.rows.length > 200 && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Showing 200 of {parsedTable.rows.length} rows
              </p>
            )}
          </div>
        ) : isJSON && viewMode !== "raw" ? (
          <pre className="whitespace-pre-wrap rounded-lg bg-[#f8f8f8] p-4 text-xs leading-relaxed font-mono border border-[var(--border)]">
            {parsedJSON}
          </pre>
        ) : (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

function ViewBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-0.5 text-[10px] transition ${
        active
          ? "bg-[var(--fg)] text-white"
          : "text-[var(--muted)] hover:bg-[#f0f0f0]"
      }`}
    >
      {label}
    </button>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
