"use client";

import { useRef, useState } from "react";

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
    onFileSelect(files[0]);
  }

  if (file) {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          File
        </label>
        <div className="flex items-center gap-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{file.name}</p>
            <p className="text-sm text-emerald-700">
              Uploaded · {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onFileSelect(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600"
            aria-label="Remove file"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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
      <label className="mb-2 block text-sm font-medium text-slate-700">
        File
      </label>
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
        }`}
      >
        <svg
          className="mb-3 h-10 w-10 text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>

        <div>
          <p className="font-medium text-slate-900">
            Click to upload or drag and drop
          </p>
          {acceptLabel && (
            <p className="text-sm text-slate-500">{acceptLabel}</p>
          )}
        </div>
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
