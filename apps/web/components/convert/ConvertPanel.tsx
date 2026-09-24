"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, FolderOpen, Loader2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import FileDropzone from "@/components/convert/FileDropzone";
import {
  ACCEPTED_EXTENSIONS,
  getTargetsForExtension,
  type ConversionTarget,
} from "@/lib/converters/catalog";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";
import { cn } from "@/lib/utils";

interface CollectionRef {
  id: string;
  name: string;
}

/** One conversion attempted in this browser session, shown with its outcome. */
interface Attempt {
  id: number;
  filename: string;
  targetLabel: string;
  status: "processing" | "completed" | "failed";
  message?: string;
  /** Set when the result was saved to history (signed-in users). */
  conversionId?: string | null;
}

const ACCEPT = ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

function getExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1]!.toLowerCase() : "";
}

export default function ConvertPanel({ collections = [] }: { collections?: CollectionRef[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [chosen, setChosen] = useState<ConversionTarget | null>(null);
  const [collectionId, setCollectionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const sourceExt = file ? getExtension(file.name) : "";
  const targets = useMemo(() => (sourceExt ? getTargetsForExtension(sourceExt) : []), [sourceExt]);
  // A file with exactly one possible output (e.g. .txt → PDF) needs no choosing.
  const target = chosen ?? (targets.length === 1 ? targets[0]! : null);
  const busy = attempts.some((a) => a.status === "processing");

  function selectFile(next: File | null) {
    setFile(next);
    setChosen(null);
    setError(
      next && next.size > MAX_UPLOAD_BYTES
        ? `That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.`
        : null
    );
  }

  function patchAttempt(id: number, patch: Partial<Attempt>) {
    setAttempts((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  async function handleConvert() {
    if (!file || !target || file.size > MAX_UPLOAD_BYTES) return;
    const id = Date.now();
    const submitted = file;
    setError(null);
    setAttempts((list) => [
      { id, filename: submitted.name, targetLabel: target.targetLabel, status: "processing" },
      ...list,
    ]);

    try {
      const formData = new FormData();
      formData.append("file", submitted);
      formData.append("conversionType", target.type);
      if (collectionId) formData.append("collectionId", collectionId);

      const response = await fetch("/api/convert", { method: "POST", body: formData });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Conversion failed." }));
        patchAttempt(id, { status: "failed", message: data.error ?? "Conversion failed." });
        return;
      }

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const downloadName = match ? match[1]! : submitted.name;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadName;
      link.click();
      window.URL.revokeObjectURL(url);

      patchAttempt(id, {
        status: "completed",
        conversionId: response.headers.get("X-Conversion-Id"),
      });
      setFile(null);
      setChosen(null);
      // Re-render the server-fetched "Recent conversions" beside the panel.
      router.refresh();
    } catch (err) {
      console.error(err);
      patchAttempt(id, { status: "failed", message: "Something went wrong." });
    }
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-surface-elevated p-5 shadow-sm sm:p-7">
      <div className="space-y-6">
        <FileDropzone file={file} onFileSelect={selectFile} accept={ACCEPT} />

        {file && targets.length === 0 && (
          <Alert>
            FileForge doesn&apos;t support .{sourceExt} files yet. Supported types:{" "}
            {ACCEPTED_EXTENSIONS.join(", ")}.
          </Alert>
        )}

        {targets.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">
              {targets.length === 1 ? "Converts to" : "Convert to"}
            </p>
            <div className="flex flex-wrap gap-2">
              {targets.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  aria-pressed={target?.type === t.type}
                  onClick={() => setChosen(t)}
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

      <Button
        disabled={!file || !target || busy || file.size > MAX_UPLOAD_BYTES}
        loading={busy}
        onClick={handleConvert}
        className="mt-6 w-full"
      >
        {busy ? "Converting…" : target ? `Convert to ${target.targetLabel}` : "Convert"}
      </Button>

      {attempts.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            This session
          </p>
          <ul className="flex flex-col gap-2" aria-live="polite">
            {attempts.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
              >
                {a.status === "processing" ? (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-ember" />
                ) : a.status === "completed" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    {a.filename} <span className="text-ink-muted">→ {a.targetLabel}</span>
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      a.status === "failed" ? "text-danger" : "text-ink-muted"
                    )}
                  >
                    {a.status === "processing" && "Processing…"}
                    {a.status === "completed" &&
                      (a.conversionId ? (
                        <>
                          Completed and saved ·{" "}
                          <Link href="/history" className="font-medium underline underline-offset-2">
                            View in history
                          </Link>
                        </>
                      ) : (
                        "Completed · check your downloads"
                      ))}
                    {a.status === "failed" && `Failed · ${a.message}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
