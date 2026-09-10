import {
  Braces,
  Download,
  Eye,
  FileScan,
  Languages,
  ListChecks,
  Receipt,
  ScanText,
  Settings2,
  Sparkles,
  Table2,
  UploadCloud,
  Wand2,
  UserRoundCheck,
} from "lucide-react";
import { GlassCard, Section, SectionHeading } from "./primitives";

const steps = [
  { Icon: UploadCloud, title: "Upload", desc: "Drop any file or connect cloud storage." },
  { Icon: FileScan, title: "Auto Detect", desc: "We identify type, encoding, and structure." },
  { Icon: Settings2, title: "Choose Output", desc: "Pick from every compatible target format." },
  { Icon: Sparkles, title: "AI Enhancements", desc: "Optional OCR, summaries, extraction." },
  { Icon: Wand2, title: "Convert", desc: "Streamed processing on edge workers." },
  { Icon: Eye, title: "Preview", desc: "Inspect results before you commit." },
  { Icon: Download, title: "Download", desc: "Grab files or push to your API." },
];

const enhancements = [
  { Icon: ScanText, label: "OCR" },
  { Icon: ListChecks, label: "Summarize" },
  { Icon: Languages, label: "Translate" },
  { Icon: Table2, label: "Extract Tables" },
  { Icon: Receipt, label: "Invoice Parser" },
  { Icon: UserRoundCheck, label: "Resume Optimizer" },
  { Icon: Braces, label: "Meeting Notes" },
  { Icon: Wand2, label: "Improve Scan" },
];

export function Workflow() {
  return (
    <Section id="workflow">
      <SectionHeading
        eyebrow="Universal pipeline"
        title={<>One workflow for every file you own</>}
        subtitle="No maze of single-purpose converter pages. Everything runs through a single, predictable pipeline you can also call from the API."
      />

      <div className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {steps.map(({ Icon, title, desc }, i) => (
            <GlassCard key={title} className="p-6">
              <div className="flex items-start gap-4">
                <span className="glass-soft grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
                  <Icon className="text-violet h-5 w-5" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display truncate text-base font-medium">{title}</h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* AI panel */}
        <GlassCard hover={false} className="h-fit p-6 lg:sticky lg:top-28">
          <div className="flex items-center gap-3">
            <span className="bg-brand grid h-10 w-10 place-items-center rounded-2xl">
              <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-medium">AI Enhancements</h3>
              <p className="text-xs text-muted-foreground">Entirely optional</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {enhancements.map(({ Icon, label }) => (
              <label
                key={label}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-secondary/60"
              >
                <Icon className="text-cyan h-4.5 w-4.5 shrink-0" strokeWidth={1.7} />
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground group-hover:text-foreground">
                  {label}
                </span>
                <span className="border-border bg-secondary/70 relative h-5 w-9 shrink-0 rounded-full border transition-colors group-hover:bg-primary/70">
                  <span className="bg-foreground/80 absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full transition-transform group-hover:translate-x-4" />
                </span>
              </label>
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Conversions run without AI by default. Enable enhancements per file, per workflow, or
            per API request.
          </p>
        </GlassCard>
      </div>
    </Section>
  );
}
