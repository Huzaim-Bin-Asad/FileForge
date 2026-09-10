"use client";

import Link from "next/link";
import { ArrowRight, Upload } from "lucide-react";
import Reveal from "@/components/site/Reveal";

export default function Hero() {
  return (
    <section
      id="top"
      className="bg-forge noise relative flex min-h-[100svh] flex-col justify-center overflow-hidden"
    >
      <div className="bg-mesh pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-16 top-24 h-48 w-48 rounded-full bg-ember/20 blur-3xl animate-forge-glow sm:h-64 sm:w-64" />
      <div className="pointer-events-none absolute -right-10 bottom-24 h-40 w-40 rounded-full bg-gold/20 blur-3xl animate-forge-glow sm:h-56 sm:w-56" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-1 items-center px-5 py-28 sm:px-6 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl md:text-7xl lg:text-8xl">
              File<span className="text-gradient">Forge</span>
            </p>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="font-display mx-auto mt-5 max-w-2xl text-xl font-semibold leading-snug tracking-tight text-ink sm:mt-7 sm:text-3xl lg:text-4xl lg:leading-snug">
              Universal document conversion, forged in seconds.
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:mt-5 sm:text-lg">
              Drop a file, pick a format, download instantly. Processing
              never leaves FileForge, no third party upload hop, no account
              required.
            </p>
          </Reveal>

          <Reveal
            delay={2}
            className="mt-7 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
          >
            <Link
              href="/convert"
              className="bg-brand inline-flex items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-ember/25 transition hover:opacity-95 sm:px-6 sm:text-base"
            >
              <Upload className="h-4 w-4" />
              Start converting
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-elevated px-5 py-3.5 text-sm font-semibold text-ink transition hover:border-ember/40 hover:bg-ember-soft/50 sm:px-6 sm:text-base"
            >
              See how it works
              <ArrowRight className="h-4 w-4" />
            </a>
          </Reveal>

          <Reveal
            delay={3}
            className="mt-8 grid gap-2.5 border-t border-line/80 pt-6 sm:mt-10 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-3 sm:pt-8"
          >
            {[
              "Private processing, every time",
              "No third party uploads",
              "Works without an account",
            ].map((label) => (
              <span
                key={label}
                className="flex items-center gap-2 text-sm font-medium text-ink-muted"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                {label}
              </span>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
