import {
  Download,
  FileSearch,
  MousePointerClick,
  Upload,
} from "lucide-react";
import { Section, SectionHeading } from "./primitives";
import Reveal from "./Reveal";

const steps = [
  {
    Icon: Upload,
    title: "Drop a file",
    body: "PDF, Word, Excel, PowerPoint, Markdown, HTML, TXT, or EPUB, whatever landed on your desk.",
    detail: "Drag it in, or click to browse. No signup gate.",
  },
  {
    Icon: FileSearch,
    title: "Pick a target",
    body: "Choose the format you actually need. Bidirectional pairs where the conversion makes sense.",
    detail: "One converter. Every format. No maze of narrow, one job pages.",
  },
  {
    Icon: MousePointerClick,
    title: "Hit convert",
    body: "Processing stays inside FileForge. Your file never hops to a third party conversion service.",
    detail: "Built to feel like a desktop utility that happens to live in the browser.",
  },
  {
    Icon: Download,
    title: "Download",
    body: "Get the file back the moment it’s ready. Sign in later if you want history saved.",
    detail: "Metadata only for accounts that choose to sign in, never the file itself.",
  },
];

export default function Workflow() {
  return (
    <Section id="workflow" className="bg-section-sand">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-20">
        <Reveal className="lg:self-center">
          <SectionHeading
            align="left"
            index="01 How it works"
            title="Four steps. No account required."
          />
        </Reveal>

        <div className="relative mx-auto w-full max-w-3xl">
          <div className="forge-rail absolute top-3 bottom-3 left-[1.05rem] w-px sm:left-[1.4rem]" />
          {steps.map(({ Icon, title, body, detail }, i) => (
            <Reveal
              key={title}
              delay={(Math.min(i, 5) as 0 | 1 | 2 | 3 | 4 | 5)}
              variant="up"
              className="relative grid grid-cols-[auto_1fr] gap-4 border-b border-line/70 py-5 last:border-0 sm:gap-7 sm:py-8"
            >
              <span className="relative z-10 grid h-9 w-9 place-items-center rounded-full border border-line bg-surface-elevated text-ember shadow-sm sm:h-12 sm:w-12">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="font-mono text-[11px] text-ink-muted sm:text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-lg font-bold text-ink sm:text-2xl">
                    {title}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:mt-3 sm:text-base">
                  {body}
                </p>
                <p className="mt-1.5 text-sm text-ink/70 sm:mt-2">{detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
