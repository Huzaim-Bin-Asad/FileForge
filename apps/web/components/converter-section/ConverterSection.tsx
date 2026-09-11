"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import ConversionSelect from "./ConversionSelect";
import FileDropzone from "./FileDropzone";
import ConvertButton from "./ConvertButton";
import { CONVERSION_EXTENSIONS, DEFAULT_CONVERSION_TYPE } from "./conversions";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";

interface CollectionRef {
  id: string;
  name: string;
}

export default function ConverterSection({
  collections = [],
}: {
  collections?: CollectionRef[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState(DEFAULT_CONVERSION_TYPE);
  const [collectionId, setCollectionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const extensions = CONVERSION_EXTENSIONS[conversionType] ?? [];
  const accept = extensions.map((ext) => `.${ext}`).join(",");
  const acceptLabel = extensions.map((ext) => ext.toUpperCase()).join(" or ");

  function handleConversionTypeChange(value: string) {
    setConversionType(value);
    setFile(null);
    setError(null);
    setDone(false);
  }

  async function handleConvert() {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    setLoading(true);
    setError(null);
    setDone(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversionType", conversionType);
      if (collectionId) formData.append("collectionId", collectionId);

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({ error: "Conversion failed." }));
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
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-surface-elevated p-6 shadow-sm sm:p-8">
      <div className="space-y-6">
        <ConversionSelect
          value={conversionType}
          onChange={handleConversionTypeChange}
        />
        <FileDropzone
          file={file}
          onFileSelect={(next) => {
            setFile(next);
            setError(null);
            setDone(false);
          }}
          accept={accept}
          acceptLabel={acceptLabel}
        />

        {collections.length > 0 && (
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
        <p className="mt-4 rounded-xl border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          Converted. Check your downloads.
        </p>
      )}

      <ConvertButton
        disabled={!file || loading}
        loading={loading}
        onClick={handleConvert}
      />
    </div>
  );
}
