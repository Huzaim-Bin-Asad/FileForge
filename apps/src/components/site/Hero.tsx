import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType2,
  UploadCloud,
} from "lucide-react";
import { Blobs } from "./primitives";

const formats = [
  "PDF", "DOCX", "PPTX", "XLSX", "CSV", "JSON", "XML", "YAML",
  "PNG", "JPG", "WEBP", "HEIC", "SVG", "ZIP", "EPUB",
];

const floaters = [
  { Icon: FileText, className: "left-[4%] top-[18%]", delay: "0s", tone: "text-indigo" },
  { Icon: FileSpreadsheet, className: "right-[6%] top-[12%]", delay: "-2s", tone: "text-emerald" },
  { Icon: FileJson, className: "left-[10%] bottom-[16%]", delay: "-4s", tone: "text-cyan" },
  { Icon: FileImage, className: "right-[9%] bottom-[22%]", delay: "-1.4s", tone: "text-purple" },
  { Icon: FileType2, className: "right-[2%] top-[46%]", delay: "-3.2s", tone: "text-sky" },
];

export function Hero() {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (progress === 0 || progress >= 100) return;
    const t = setTimeout(() => setProgress((p) => Math.min(100, p + 7)), 90);
    return () => clearTimeout(t);
  }, [progress]);

  useEffect(() => {
    if (progress < 100) return undefined;
    const t = setTimeout(() => setDone(true), 300);
    return () => clearTimeout(t);
  }, [progress]);


  const start = () => {
    setDone(false);
    setProgress(1);
  };

  return (
    <div id="top" className="relative overflow-hidden pt-36 pb-20 sm:pt-44 lg:pb-28">
      <Blobs />
      <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000_10%,transparent_72%)]" />

      {floaters.map(({ Icon, className, delay, tone }, i) => (
        <div
          key={i}
          aria-hidden
          style={{ animationDelay: delay }}
          className={`glass animate-float-slow pointer-events-none absolute hidden rounded-2xl p-3.5 lg:block ${className}`}
        >
          <Icon className={`h-6 w-6 ${tone}`} strokeWidth={1.6} />
        </div>
      ))}

      <div className="mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-8">
        <div className="glass-soft animate-rise inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-muted-foreground">
          <span className="bg-emerald h-1.5 w-1.5 rounded-full" />
          Now processing 40+ formats with AI enhancements
        </div>

        <h1 className="font-display animate-rise mt-7 text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-7xl lg:text-[5.2rem]">
          Convert Anything.
          <br />
          <span className="text-gradient">One Platform.</span>
        </h1>

        <p className="animate-rise mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Upload once. Convert, compress, OCR, summarize, extract data, and automate your
          workflow with FileForge.
        </p>

        <div className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={start}
            className="bg-brand animate-gradient-pan group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:shadow-[var(--shadow-glow)]"
          >
            <UploadCloud className="h-4.5 w-4.5" />
            Upload File
          </button>
          <a
            href="#tools"
            className="glass-soft group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-colors hover:bg-secondary/70"
          >
            Explore Tools
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Drop zone */}
        <div
          id="upload"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            start();
          }}
          onClick={start}
          className={`glass gradient-border mt-14 w-full cursor-pointer rounded-4xl p-8 transition-all duration-500 sm:p-12 ${
            dragging ? "glow scale-[1.015]" : ""
          }`}
        >
          <div
            className={`rounded-3xl border border-dashed p-10 transition-colors duration-500 sm:p-14 ${
              dragging ? "border-violet bg-secondary/40" : "border-border"
            }`}
          >
            {done ? (
              <div className="animate-pop flex flex-col items-center gap-3">
                <span className="bg-emerald/15 ring-emerald/30 grid h-16 w-16 place-items-center rounded-full ring-8">
                  <CheckCircle2 className="text-emerald h-8 w-8" strokeWidth={1.8} />
                </span>
                <p className="font-display text-lg font-medium">Conversion complete</p>
                <p className="text-sm text-muted-foreground">report-q4.pdf → report-q4.docx · 1.2 MB</p>
              </div>
            ) : progress > 0 ? (
              <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                <p className="font-display text-lg font-medium">Processing your file…</p>
                <div className="bg-secondary relative h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-brand h-full rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="shimmer absolute inset-0" />
                </div>
                <p className="text-xs text-muted-foreground">{progress}% · auto-detecting output formats</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <span className="glass animate-float grid h-16 w-16 place-items-center rounded-2xl">
                  <UploadCloud className="text-violet h-7 w-7" strokeWidth={1.6} />
                </span>
                <p className="font-display text-lg font-medium sm:text-xl">
                  Drag &amp; drop your file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse · up to 2 GB · batch supported
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {formats.map((f) => (
              <span
                key={f}
                className="glass-soft rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
