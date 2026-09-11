"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Upload, X } from "lucide-react";

interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  acceptLabel?: string;
}

export default function FileDropzone({
  file,
  onFileSelect,
  accept,
  acceptLabel,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    onFileSelect(files[0]!);
  }

  if (file) {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">File</label>
        <div className="flex items-center gap-4 rounded-xl border border-success/25 bg-success-soft px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{file.name}</p>
            <p className="text-sm text-success">
              Ready · {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onFileSelect(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="shrink-0 p-1.5 text-ink-muted transition hover:text-ink"
            aria-label="Remove file"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink">File</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
          isDragging
            ? "border-ember bg-ember-soft"
            : "border-line bg-surface hover:border-ember/50 hover:bg-ember-soft/40"
        }`}
      >
        <Upload className="mb-3 h-8 w-8 text-ember" strokeWidth={1.5} />
        <p className="font-medium text-ink">Click to upload or drag and drop</p>
        {acceptLabel && (
          <p className="mt-1 text-sm text-ink-muted">{acceptLabel}</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
