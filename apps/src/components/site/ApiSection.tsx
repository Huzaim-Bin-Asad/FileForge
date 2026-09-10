import { ArrowUpRight, BookOpen, Check, Copy, Webhook } from "lucide-react";
import { GlassCard, Section, SectionHeading } from "./primitives";

function Code() {
  return (
    <div className="font-mono text-[13px] leading-relaxed">
      <p>
        <span className="text-emerald">POST</span>{" "}
        <span className="text-foreground">https://api.fileforge.dev/v1/convert</span>
      </p>
      <p className="mt-3 text-muted-foreground">{"{"}</p>
      <p className="pl-4">
        <span className="text-sky">&quot;input&quot;</span>
        <span className="text-muted-foreground">: </span>
        <span className="text-violet">&quot;pdf&quot;</span>
        <span className="text-muted-foreground">,</span>
      </p>
      <p className="pl-4">
        <span className="text-sky">&quot;output&quot;</span>
        <span className="text-muted-foreground">: </span>
        <span className="text-violet">&quot;docx&quot;</span>
        <span className="text-muted-foreground">,</span>
      </p>
      <p className="pl-4">
        <span className="text-sky">&quot;file&quot;</span>
        <span className="text-muted-foreground">: </span>
        <span className="text-violet">&quot;@report-q4.pdf&quot;</span>
        <span className="text-muted-foreground">,</span>
      </p>
      <p className="pl-4">
        <span className="text-sky">&quot;enhancements&quot;</span>
        <span className="text-muted-foreground">: [</span>
        <span className="text-violet">&quot;ocr&quot;</span>
        <span className="text-muted-foreground">, </span>
        <span className="text-violet">&quot;summarize&quot;</span>
        <span className="text-muted-foreground">]</span>
      </p>
      <p className="text-muted-foreground">{"}"}</p>
      <p className="mt-4 text-muted-foreground">
        <span className="text-cyan">200</span> · job queued · webhook on completion
      </p>
    </div>
  );
}

export function ApiSection() {
  return (
    <Section id="api">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <SectionHeading
            align="left"
            eyebrow="Developer first"
            title={<>One endpoint for every conversion</>}
            subtitle="No per-format SDKs, no queue plumbing. Send a file, name an output, optionally add enhancements — we handle the rest."
          />

          <div className="flex flex-col gap-3">
            {[
              "Typed SDKs for TypeScript, Python, Go and Rust",
              "Signed webhooks with automatic retries",
              "Idempotency keys and per-key rate limits",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <span className="bg-emerald/15 grid h-6 w-6 shrink-0 place-items-center rounded-full">
                  <Check className="text-emerald h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                <span className="min-w-0 text-sm text-muted-foreground">{t}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="#faq"
              className="bg-brand inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              <BookOpen className="h-4 w-4" />
              Read the docs
            </a>
            <a
              href="#pricing"
              className="glass-soft inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary/70"
            >
              Get an API key
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <GlassCard hover={false} className="overflow-hidden p-0">
            <div className="border-border flex items-center gap-3 border-b px-5 py-3.5">
              <span className="flex gap-1.5">
                <span className="bg-destructive/70 h-2.5 w-2.5 rounded-full" />
                <span className="bg-chart-4/70 h-2.5 w-2.5 rounded-full" />
                <span className="bg-emerald/70 h-2.5 w-2.5 rounded-full" />
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                convert.request.json
              </span>
              <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="p-6">
              <Code />
            </div>
          </GlassCard>

          <GlassCard className="flex items-start gap-4 p-6">
            <span className="glass-soft grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
              <Webhook className="text-cyan h-5 w-5" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-medium">API documentation</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                OpenAPI 3.1 spec, live playground, and copy-paste snippets for every tool in the
                catalog.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </Section>
  );
}
