"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import Reveal from "./Reveal";

const points = [
  {
    title: "One convert endpoint",
    body: "Every format pair shares the same REST surface, send input, output, and the file.",
  },
  {
    title: "Signed webhooks",
    body: "Get notified when a job finishes so your pipeline doesn’t have to poll.",
  },
  {
    title: "Keys, limits, metering",
    body: "Idempotency keys, rate limits scoped per key, and usage metering for teams.",
  },
];

export default function ApiSection() {
  const [copied, setCopied] = useState(false);

  const snippet = `POST https://api.fileforge.dev/v1/convert
{
  "input": "pdf",
  "output": "docx",
  "file": "@report-q4.pdf"
}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <section
      id="api"
      className="bg-forge-deep relative flex flex-col justify-center overflow-hidden lg:min-h-[100svh]"
    >
      <div className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-ember/40 blur-3xl animate-forge-glow sm:-right-20 sm:top-10 sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -left-12 bottom-8 h-48 w-48 rounded-full bg-gold/25 blur-3xl animate-forge-glow sm:-left-16 sm:bottom-10 sm:h-72 sm:w-72" />

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-16 sm:gap-12 sm:px-6 sm:py-20 md:py-24 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <Reveal variant="left">
          <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[#ffb089] uppercase sm:text-xs sm:tracking-[0.22em]">
            04 API
          </p>
          <h2 className="font-display mt-3 max-w-xl text-[1.75rem] font-bold leading-tight tracking-tight text-[#fff8f4] sm:mt-4 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            One endpoint for every conversion
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#ffdcc8]/80 sm:mt-5 sm:text-lg">
            Send a file, name an output, we handle the rest. The API is on the
            roadmap; the web converter works today. Create an account to hear
            when keys ship.
          </p>

          <div className="mt-7 space-y-5 sm:mt-10 sm:space-y-6">
            {points.map((p, i) => (
              <Reveal key={p.title} delay={(Math.min(i + 1, 3) as 1 | 2 | 3)}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <Check
                    className="mt-1 h-4 w-4 shrink-0 text-[#ff9a6b]"
                    strokeWidth={2.4}
                  />
                  <div>
                    <p className="font-display text-[15px] font-bold text-[#fff8f4] sm:text-base">
                      {p.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#ffdcc8]/70">
                      {p.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <Link
              href="/signup"
              className="bg-brand inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-95 sm:px-6"
            >
              Get early access
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="#faq"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ffdcc8]/25 px-5 py-3.5 text-sm font-semibold text-[#fff0e8] transition hover:bg-white/5 sm:px-6"
            >
              Read FAQ
            </a>
          </div>
        </Reveal>

        <Reveal delay={1} variant="scale">
          <div className="overflow-hidden rounded-2xl border border-[#ffdcc8]/15 bg-[#4a261c]/80 sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#ffdcc8]/12 px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="min-w-0">
                <p className="truncate font-mono text-[11px] text-[#ffdcc8]/55 sm:text-xs">
                  convert.request.json
                </p>
                <p className="mt-1 text-[10px] text-[#ffdcc8]/35 sm:text-[11px]">
                  Illustrative, API not live yet
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#ffdcc8]/15 px-2.5 py-1.5 text-xs text-[#ffdcc8]/65 transition hover:border-[#ffdcc8]/35 hover:text-[#fff8f4] sm:px-3"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-[#fff0e8]/85 sm:p-6 sm:text-sm md:p-8 md:text-[15px]">
              <code>
                <span className="text-[#7ddea8]">POST</span>{" "}
                https://api.fileforge.dev/v1/convert
                {"\n"}
                {"{\n"}
                {"  "}
                <span className="text-[#ff9a6b]">&quot;input&quot;</span>
                {": "}
                <span className="text-[#ffd38a]">&quot;pdf&quot;</span>
                {",\n"}
                {"  "}
                <span className="text-[#ff9a6b]">&quot;output&quot;</span>
                {": "}
                <span className="text-[#ffd38a]">&quot;docx&quot;</span>
                {",\n"}
                {"  "}
                <span className="text-[#ff9a6b]">&quot;file&quot;</span>
                {": "}
                <span className="text-[#ffd38a]">&quot;@report-q4.pdf&quot;</span>
                {"\n}"}
              </code>
            </pre>
            <div className="border-t border-[#ffdcc8]/12 px-4 py-3.5 sm:px-6 sm:py-4 md:px-8">
              <p className="font-mono text-[10px] tracking-wide text-[#ffdcc8]/40 uppercase sm:text-[11px]">
                Response → binary download + job id
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
