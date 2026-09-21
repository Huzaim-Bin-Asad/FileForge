"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderOpen, CheckCircle2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import FileDropzone from "@/components/convert/FileDropzone";
import {
  ACCEPTED_EXTENSIONS,
  getTargetsForExtension,
  normalizeExtension,
  type ConversionPair,
  type ConversionTarget,
} from "@/lib/converters/catalog";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";
import { cn } from "@/lib/utils";

interface CollectionRef {
  id: string;
  name: string;
}

function getExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1]!.toLowerCase() : "";
}

/** Direction is inferred from the uploaded file; only valid when it matches one side of the pair. */
function getTargetForPair(pair: ConversionPair, sourceExt: string): ConversionTarget | null {
  const normalized = normalizeExtension(sourceExt);
  const idx = pair.extensions.indexOf(normalized);
  if (idx === -1) return null;
  const targetExt = pair.extensions[1 - idx]!;
  return { type: pair.type, targetExt, targetLabel: pair.labels[targetExt]! };
}

export default function ConvertPanel({
  collections = [],
  initialPair,
}: {
  collections?: CollectionRef[];
  initialPair?: ConversionPair;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState<ConversionTarget | null>(null);
  const [collectionId, setCollectionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [conversionId, setConversionId] = useState<string | null>(null);

  const sourceExt = file ? getExtension(file.name) : "";
  const targets = useMemo(() => (sourceExt ? getTargetsForExtension(sourceExt) : []), [sourceExt]);

  const pairLabel = initialPair
    ? `${initialPair.labels[initialPair.extensions[0]]} ↔ ${initialPair.labels[initialPair.extensions[1]]}`
    : null;
  const pairAccept = initialPair
    ? initialPair.extensions.map((ext) => `.${ext}`).join(",")
    : ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");
  const pairMismatch = initialPair && file && !getTargetForPair(initialPair, sourceExt);

  function selectFile(next: File | null) {
    setFile(next);
    setError(null);
    setConversionId(null);
    if (next && next.size > MAX_UPLOAD_BYTES) {
      setError(`That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.`);
      setTarget(null);
      return;
    }
    if (initialPair) {
      setTarget(next ? getTargetForPair(initialPair, getExtension(next.name)) : null);
    } else {
      setTarget(null);
    }
  }

  async function handleConvert() {
    if (!file || !target) return;
    setLoading(true);
    setError(null);
    setDone(false);
    setConversionId(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversionType", target.type);
      if (collectionId) formData.append("collectionId", collectionId);

      const response = await fetch("/api/convert", { method: "POST", body: formData });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Conversion failed." }));
        setError(data.error ?? "Conversion failed.");
        return;
      }

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const downloadName = match ? match[1]! : file.name;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadName;
      link.click();
      window.URL.revokeObjectURL(url);

      setDone(true);
      setConversionId(response.headers.get("X-Conversion-Id"));
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-surface-elevated p-6 shadow-sm sm:p-8">
      {pairLabel && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-ember-soft px-4 py-3">
          <p className="text-sm font-semibold text-ember-deep">{pairLabel}</p>
          <Link
            href="/convert"
            className="inline-flex items-center gap-1 text-xs font-medium text-ember-deep/80 hover:text-ember-deep"
          >
            <X className="h-3.5 w-3.5" />
            Change
          </Link>
        </div>
      )}

      <div className="space-y-6">
        <FileDropzone file={file} onFileSelect={selectFile} accept={pairAccept} />

        {pairMismatch && initialPair && (
          <Alert>
            This converter only accepts {initialPair.extensions.map((e) => `.${e}`).join(" or ")}{" "}
            files.
          </Alert>
        )}

        {!initialPair && file && targets.length === 0 && (
          <Alert>
            FileForge doesn&apos;t support .{sourceExt} files yet. Supported types:{" "}
            {ACCEPTED_EXTENSIONS.join(", ")}.
          </Alert>
        )}

        {!initialPair && targets.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Convert to</p>
            <div className="flex flex-wrap gap-2">
              {targets.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => {
                    setTarget(t);
                    setConversionId(null);
                  }}
                  className={cn(
                    "rounded-lg border px-3.5 py-2 text-sm font-medium transition",
                    target?.type === t.type
                      ? "border-ember bg-ember-soft text-ember-deep"
                      : "border-line bg-surface text-ink hover:bg-steel-soft"
                  )}
                >
                  {t.targetLabel}
                </button>
              ))}
            </div>
          </div>
        )}

        {collections.length > 0 && target && (
          <div>
            <label
              htmlFor="collection"
              className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink"
            >
              <FolderOpen className="h-3.5 w-3.5 text-ink-muted" />
              Save to collection
              <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <select
              id="collection"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-line bg-surface-elevated px-4 py-2.5 text-sm text-ink transition focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
            >
              <option value="">Don&apos;t file it</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {done && !error && (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {conversionId ? (
            <>
              Converted and saved.{" "}
              <Link href="/history" className="font-semibold underline underline-offset-2">
                View in history
              </Link>
            </>
          ) : (
            "Converted. Check your downloads."
          )}
        </p>
      )}

      <Button
        disabled={!file || !target || loading}
        loading={loading}
        onClick={handleConvert}
        className="mt-6 w-full"
      >
        Convert
      </Button>
    </div>
  );
}
