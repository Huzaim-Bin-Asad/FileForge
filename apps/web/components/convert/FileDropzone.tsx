"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropzone({
  file,
  onFileSelect,
  accept,
}: {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileSelect(dropped);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
        <FileUp className="h-5 w-5 shrink-0 text-ember" strokeWidth={1.7} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
          <p className="text-xs text-ink-muted">{formatBytes(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onFileSelect(null)}
          aria-label="Remove file"
          className="shrink-0 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-elevated hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition",
        dragging ? "border-ember bg-ember-soft" : "border-line bg-surface hover:bg-steel-soft"
      )}
    >
      <FileUp className="h-6 w-6 text-ink-muted" strokeWidth={1.5} />
      <p className="text-sm font-medium text-ink">
        Drop a file here, or <span className="text-ember">browse</span>
      </p>
      <p className="text-xs text-ink-muted">PDF, Word, Excel, PowerPoint, EPUB, HTML, Markdown, TXT</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
