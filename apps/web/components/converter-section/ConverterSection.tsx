"use client";

import { useState } from "react";
import ConversionSelect from "./ConversionSelect";
import FileDropzone from "./FileDropzone";
import ConvertButton from "./ConvertButton";
import { CONVERSION_EXTENSIONS, DEFAULT_CONVERSION_TYPE } from "./conversions";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";

export default function ConverterSection() {
  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState(DEFAULT_CONVERSION_TYPE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extensions = CONVERSION_EXTENSIONS[conversionType] ?? [];
  const accept = extensions.map((ext) => `.${ext}`).join(",");
  const acceptLabel = extensions.map((ext) => ext.toUpperCase()).join(" or ");

  function handleConversionTypeChange(value: string) {
    setConversionType(value);
    setFile(null);
    setError(null);
  }

  async function handleConvert() {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversionType", conversionType);

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
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full border border-line bg-surface-elevated p-6 shadow-sm sm:p-8">
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
          }}
          accept={accept}
          acceptLabel={acceptLabel}
        />
      </div>

      {error && (
        <p className="mt-4 border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
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
