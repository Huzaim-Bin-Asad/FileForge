"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Dropdown from "@/components/ui/Dropdown";
import FileDropzone, { ReplaceFileDrop, type FileStatus } from "@/components/convert/FileDropzone";
import FormatIcon from "@/components/convert/FormatIcon";
import {
  ACCEPTED_EXTENSIONS,
  getTargetsForExtension,
  type ConversionTarget,
} from "@/lib/converters/catalog";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";
import { cn } from "@/lib/utils";
import {
  addAttempt,
  getServerSnapshot,
  getSnapshot,
  patchAttempt,
  subscribe,
} from "@/lib/convert/attemptsStore";

interface CollectionRef {
  id: string;
  name: string;
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
  // Backed by a module-level store, not local state — a conversion started
  // here keeps running (and this list keeps updating) even if the user
  // navigates away and back before it finishes. See lib/convert/attemptsStore.
  const attempts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const sourceExt = file ? getExtension(file.name) : "";
  const targets = useMemo(() => (sourceExt ? getTargetsForExtension(sourceExt) : []), [sourceExt]);
  // A file with exactly one possible output (e.g. .txt → PDF) needs no choosing.
  const target = chosen ?? (targets.length === 1 ? targets[0]! : null);
  const busy = attempts.some((a) => a.status === "processing");

  const collectionOptions = useMemo(
    () => [
      { value: "", label: "Don't file it" },
      ...collections.map((c) => ({ value: c.id, label: c.name })),
    ],
    [collections]
  );

  const fileStatus: FileStatus | undefined = !file
    ? undefined
    : error
      ? { ok: false, label: "File too large" }
      : targets.length === 0
        ? { ok: false, label: "Unsupported format" }
        : { ok: true, label: "Ready to convert" };

  function selectFile(next: File | null) {
    setFile(next);
    setChosen(null);
    setError(
      next && next.size > MAX_UPLOAD_BYTES
        ? `That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.`
        : null
    );
  }

  async function handleConvert() {
    if (!file || !target || file.size > MAX_UPLOAD_BYTES) return;
    const id = Date.now();
    const submitted = file;
    setError(null);
    addAttempt({ id, filename: submitted.name, targetLabel: target.targetLabel, status: "processing" });

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
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface-elevated p-5 shadow-sm sm:p-7">
        <FileDropzone file={file} onFileSelect={selectFile} accept={ACCEPT} status={fileStatus} />

        {file && (
          <div className="mt-6 flex flex-col gap-6">
            {targets.length === 0 ? (
              <Alert>
                FileForge doesn&apos;t support .{sourceExt} files yet. Supported types:{" "}
                {ACCEPTED_EXTENSIONS.join(", ")}.
              </Alert>
            ) : (
              <>
                <div>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {targets.length === 1 ? "Converts to:" : "Convert to:"}
                    </p>
                    {targets.length > 1 && (
                      <span className="text-xs text-ink-muted">Select destination format</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {targets.map((t) => {
                      const active = target?.type === t.type;
                      return (
                        <button
                          key={t.type}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setChosen(t)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition",
                            active
                              ? "border-ember-deep bg-ember-deep text-white"
                              : "border-line bg-surface text-ink hover:bg-steel-soft"
                          )}
                        >
                          <FormatIcon ext={t.targetExt} size="xs" />
                          <span className="min-w-0 flex-1 truncate">{t.targetLabel}</span>
                          {active && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {collections.length > 0 && (
                  <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
                    <label htmlFor="collection" className="text-xs font-medium text-ink-muted">
                      Save to collection
                    </label>
                    <Dropdown
                      id="collection"
                      label="Save to collection"
                      placeholder="Don't file it"
                      value={collectionId}
                      onChange={setCollectionId}
                      options={collectionOptions}
                      className="w-44"
                    />
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => selectFile(null)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
              >
                <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
                Choose different file
              </button>
              {targets.length > 0 && (
                <Button
                  disabled={!target || busy || file.size > MAX_UPLOAD_BYTES}
                  loading={busy}
                  onClick={handleConvert}
                  className="flex-1 sm:flex-none sm:min-w-[220px]"
                >
                  {!busy && <ArrowLeftRight className="h-4 w-4" strokeWidth={2.2} />}
                  {busy ? "Converting…" : target ? `Convert to ${target.targetLabel}` : "Convert"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {file && <ReplaceFileDrop accept={ACCEPT} onFileSelect={selectFile} />}

      {attempts.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface-elevated p-5">
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
