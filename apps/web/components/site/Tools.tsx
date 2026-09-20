import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "./primitives";
import Reveal from "./Reveal";

const pairs = [
  "PDF ↔ Word",
  "PDF ↔ Excel",
  "PDF ↔ PowerPoint",
  "PDF ↔ HTML",
  "PDF ↔ Markdown",
  "Word ↔ Markdown",
  "TXT ↔ PDF",
  "EPUB ↔ PDF",
];

export default function Tools() {
  return (
    <Section
      id="tools"
      className="border-y border-line/70 bg-section-peach"
    >
      <Reveal>
        <SectionHeading
          align="center"
          index="02 Tools"
          title="Every format, one converter"
        />
        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ember transition hover:text-ember-deep"
          >
            Open the converter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>

      <Reveal
        delay={1}
        className="mx-auto mt-10 max-w-2xl space-y-6 text-center text-[15px] leading-relaxed text-ink-muted sm:mt-12 sm:space-y-7 sm:text-base lg:text-lg lg:leading-relaxed"
      >
        <p>
          FileForge is not a shelf of separate tools wearing one name. It is a
          single converter built to understand whatever lands on your desk,
          then hand it back in the shape you actually need.
        </p>
        <p>
          Drop in a document, a spreadsheet, a deck, a page, or a plain text
          file. Pick the format you want out. The same converter carries it
          through, and the rest of the pipeline stays out of your way.
        </p>
        <p>
          Most of the work starts with a{" "}
          <span className="font-medium text-ink">PDF</span>. Turn locked pages
          into editable <span className="font-medium text-ink">Word</span>,
          pull tables into <span className="font-medium text-ink">Excel</span>,
          rebuild slides as{" "}
          <span className="font-medium text-ink">PowerPoint</span>, or ship the
          same document as <span className="font-medium text-ink">HTML</span>{" "}
          or <span className="font-medium text-ink">Markdown</span>. Need the
          other direction instead? Go right back to PDF.
        </p>
        <p>
          Reports, contracts, budgets, decks, notes, handouts. One converter
          for all of it, not a maze of narrow pages each built for a single
          job.
        </p>
      </Reveal>

      <Reveal
        delay={2}
        className="mx-auto mt-10 max-w-3xl sm:mt-12"
      >
        <p className="text-center font-mono text-[11px] tracking-[0.2em] text-ink-muted/70 uppercase sm:text-xs">
          Live in the converter today
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-2.5">
          {pairs.map((pair) => (
            <span
              key={pair}
              className="rounded-full border border-line bg-surface-elevated px-3.5 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-ember/40 hover:text-ink sm:text-[13px]"
            >
              {pair}
            </span>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
