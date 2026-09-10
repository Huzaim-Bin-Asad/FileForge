import {
  Boxes,
  CloudUpload,
  Gauge,
  History,
  Infinity as InfinityIcon,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { GlassCard, Section, SectionHeading } from "./primitives";

const features = [
  { Icon: Gauge, title: "Fast Processing", desc: "Edge workers convert most documents in under two seconds." },
  { Icon: ShieldCheck, title: "Secure Encryption", desc: "AES-256 at rest, TLS 1.3 in transit, auto-purge after 24h." },
  { Icon: Sparkles, title: "AI Powered", desc: "OCR, summarization and extraction available on any file." },
  { Icon: CloudUpload, title: "Cloud Storage", desc: "Connect Drive, Dropbox, S3 and convert in place." },
  { Icon: Terminal, title: "API Access", desc: "One REST endpoint, typed SDKs, webhooks on completion." },
  { Icon: InfinityIcon, title: "Unlimited Formats", desc: "40+ formats today, new targets shipped every month." },
  { Icon: Layers, title: "Batch Conversion", desc: "Queue thousands of files with parallel processing." },
  { Icon: History, title: "Conversion History", desc: "Searchable log with re-run and version diffing." },
];

export function Features() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Why FileForge"
        title={<>Built for teams that treat files as infrastructure</>}
        subtitle="The reliability of a platform, the polish of a product. Everything is measurable, auditable, and automatable."
      />

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ Icon, title, desc }) => (
          <GlassCard key={title} className="group relative overflow-hidden p-6">
            <span
              aria-hidden
              className="bg-brand absolute -top-16 -right-16 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
            />
            <span className="glass-soft grid h-11 w-11 place-items-center rounded-2xl">
              <Icon className="text-sky h-5 w-5" strokeWidth={1.7} />
            </span>
            <h3 className="font-display mt-5 text-base font-medium">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {[
          { value: "180M+", label: "Files processed" },
          { value: "99.99%", label: "Pipeline uptime" },
          { value: "1.4s", label: "Median conversion" },
        ].map((s) => (
          <GlassCard key={s.label} hover={false} className="flex items-center gap-4 p-6">
            <Boxes className="text-violet h-5 w-5 shrink-0" strokeWidth={1.6} />
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
