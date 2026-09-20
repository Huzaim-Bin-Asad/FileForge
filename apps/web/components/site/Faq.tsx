"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Section, SectionHeading } from "./primitives";
import Reveal from "./Reveal";

const faqs = [
  {
    q: "What happens to my files after conversion?",
    a: "Conversions happen inside FileForge. Your files are never uploaded to another conversion service. If you're signed in, history stores only metadata, filename, formats, and timestamp, not the file itself.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can convert without signing up. An account is optional and unlocks conversion history plus profile controls, including sign in with Google.",
  },
  {
    q: "Which formats are supported?",
    a: "Pretty much whatever you'd have sitting on a normal desk: PDF, Word, Excel, PowerPoint, HTML, Markdown, TXT, and EPUB, moving between each other in both directions where it makes sense. More formats are on the roadmap.",
  },
  {
    q: "Is there a file size limit?",
    a: "Very large files may take longer or fail depending on device memory. For everyday documents like reports, decks, and sheets, FileForge is built to feel snappy.",
  },
  {
    q: "Is there an API?",
    a: "A dedicated API is scaffolded and coming next. Today the web converter is the working product. Create an account to hear about early access.",
  },
  {
    q: "Can I sign in with Google?",
    a: "Yes. Use Continue with Google on the login or signup page once Google OAuth credentials are configured for your environment.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. From Profile you can permanently delete your account and conversion history. Password accounts confirm with your password; accounts that only use Google confirm by typing DELETE.",
  },
  {
    q: "Do you store converted files?",
    a: "No. Downloads happen in your browser session. We keep conversion metadata only for accounts that choose to sign in, and only if you want history.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <Section id="faq" className="bg-section-sand">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-16">
        <Reveal variant="left" className="lg:sticky lg:top-28">
          <SectionHeading
            index="07 FAQ"
            title="Straight answers"
            subtitle="Still curious? Open the converter and try a file. That usually settles it faster than another paragraph."
          />
          <Link
            href="/dashboard"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-ember-deep sm:mt-8 sm:w-auto"
          >
            Try a conversion
          </Link>
        </Reveal>

        <Reveal delay={1} variant="right" className="flex flex-col gap-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                data-open={isOpen}
                className={`accordion-item overflow-hidden rounded-2xl border transition-colors duration-300 ${
                  isOpen
                    ? "border-ember/35 bg-surface-elevated shadow-[0_18px_40px_-30px_rgba(228,87,46,0.55)]"
                    : "border-line bg-surface-elevated/70 hover:border-ember/25 hover:bg-surface-elevated"
                }`}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                  >
                    <span
                      className={`font-display text-[15px] font-bold leading-snug transition-colors duration-300 sm:text-base md:text-lg ${
                        isOpen ? "text-ember-deep" : "text-ink"
                      }`}
                    >
                      {f.q}
                    </span>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? "rotate-[135deg] border-ember bg-ember text-white"
                          : "border-line bg-surface text-ink-muted"
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </span>
                  </button>
                </h3>
                <div className="accordion-panel">
                  <div>
                    <p className="accordion-answer px-5 pb-5 text-sm leading-relaxed text-ink-muted sm:px-6 sm:pb-6 sm:text-[15px] md:text-base">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </Section>
  );
}
