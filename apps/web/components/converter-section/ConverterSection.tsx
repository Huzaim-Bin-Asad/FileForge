"use client";

import { useState } from "react";
import ConversionSelect from "./ConversionSelect";
import FileDropzone from "./FileDropzone";
import ConvertButton from "./ConvertButton";
import { CONVERSION_EXTENSIONS, DEFAULT_CONVERSION_TYPE } from "./conversions";

export default function ConverterSection() {
  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState(DEFAULT_CONVERSION_TYPE);
  const [loading, setLoading] = useState(false);

  const extensions = CONVERSION_EXTENSIONS[conversionType] ?? [];
  const accept = extensions.map((ext) => `.${ext}`).join(",");
  const acceptLabel = extensions.map((ext) => ext.toUpperCase()).join(" or ");

  function handleConversionTypeChange(value: string) {
    setConversionType(value);
    setFile(null);
  }

  async function handleConvert() {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversionType", conversionType);

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const { error } = await response
          .json()
          .catch(() => ({ error: "Conversion failed." }));
        alert(error ?? "Conversion failed.");
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
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white">
          📄
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            FileForge
          </h1>
          <p className="text-sm text-slate-500">
            Convert your documents in seconds.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <ConversionSelect
          value={conversionType}
          onChange={handleConversionTypeChange}
        />
        <FileDropzone
          file={file}
          onFileSelect={setFile}
          accept={accept}
          acceptLabel={acceptLabel}
        />
      </div>

      <ConvertButton
        disabled={!file || loading}
        loading={loading}
        onClick={handleConvert}
      />
    </div>
  );
}
