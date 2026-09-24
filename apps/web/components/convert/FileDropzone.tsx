"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileUp, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeExtension } from "@/lib/converters/catalog";
import { MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";
import FormatIcon from "@/components/convert/FormatIcon";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface FileStatus {
  ok: boolean;
  label: string;
}

export default function FileDropzone({
  file,
  onFileSelect,
  accept,
  status,
}: {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept: string;
  /** Shown under the filename as a colored dot + label; defaults to a plain "Ready to convert". */
  status?: FileStatus;
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
    const ext = normalizeExtension(file.name.split(".").pop() ?? "");
    const { ok, label } = status ?? { ok: true, label: "Ready to convert" };
    return (
      <div className="flex items-start gap-4 rounded-xl border border-line bg-surface px-4 py-4 sm:px-5">
        <FormatIcon ext={ext} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-ink">{file.name}</p>
            <span className="shrink-0 rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-ink-muted">
              {formatBytes(file.size)}
            </span>
          </div>
          <p
            className={cn(
              "mt-1.5 flex items-center gap-1.5 text-xs font-medium",
              ok ? "text-success" : "text-danger"
            )}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ok ? "bg-success" : "bg-danger")} />
            {label}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onFileSelect(null)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-surface-elevated hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
          Remove
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
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 text-center transition sm:py-20",
        dragging ? "border-ember bg-ember-soft" : "border-line bg-surface hover:bg-steel-soft"
      )}
    >
      <FileUp className="h-8 w-8 text-ink-muted" strokeWidth={1.5} />
      <p className="text-base font-medium text-ink">
        Drop a file here, or <span className="text-ember">browse</span>
      </p>
      <p className="mx-auto max-w-xs text-xs text-ink-muted">
        PDF, Word, Excel, PowerPoint, EPUB, HTML, Markdown, TXT
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          onFileSelect(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/**
 * A slim, always-available drop target shown below the main card once a
 * file is already selected, so swapping files doesn't require Remove first.
 */
export function ReplaceFileDrop({
  onFileSelect,
  accept,
}: {
  onFileSelect: (file: File) => void;
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
        "flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-6 text-center transition",
        dragging ? "border-ember bg-ember-soft" : "border-line/70 bg-surface-elevated hover:bg-steel-soft"
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-ember">
        <Plus className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <p className="text-sm text-ink-muted">
        Or drop another file here to replace{" "}
        <span className="text-ink-muted/70">(up to {MAX_UPLOAD_LABEL})</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onFileSelect(picked);
          e.target.value = "";
        }}
      />
    </div>
  );
}
