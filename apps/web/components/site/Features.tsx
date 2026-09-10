import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "./primitives";
import Reveal from "./Reveal";

const pillars = [
  {
    icon: "/Fast Car Icon.png",
    title: "Fast enough to stay in flow",
    desc: "Everyday reports, decks, and sheets convert in seconds, not a coffee break. You drop the file, pick a format, and keep moving.",
    points: [
      "Optimized for common office documents",
      "No wizard, no extra steps before you start",
      "Download as soon as the job finishes",
    ],
  },
  {
    icon: "/Secure Shield Icon.png",
    title: "Private by design",
    desc: "There is no hop through a third party service in the path. Everything happens inside FileForge. If you're signed in, history stores metadata only, filename, formats, timestamp, never the file itself.",
    points: [
      "Processing stays inside FileForge, end to end",
      "Optional history without file retention",
      "Delete your account and history anytime",
    ],
  },
  {
    icon: "/Bidirection Icon.png",
    title: "Every direction, not just one",
    desc: "Turn a locked document into something editable, then turn it right back when you need to. FileForge moves files both ways instead of trapping you on a one way trip.",
    points: [
      "Convert forward or reverse, same converter",
      "Pairs chosen for real desk work, not every combination",
      "New directions ship as the roadmap grows",
    ],
  },
  {
    icon: "/History payment icon.png",
    title: "History when you want it",
    desc: "Convert anonymously forever if you prefer. Create an account when you want a log of what converted and when, Google or email, your call.",
    points: [
      "No account required to convert",
      "History + profile after signup",
      "Google OAuth or password login",
    ],
  },
];

export default function Features() {
  return (
    <Section id="features" className="bg-section-cream">
      <Reveal>
        <SectionHeading
          index="03 Why FileForge"
          title="Built for people who just need the file"
          subtitle="Clear formats, private processing, and history only if you ask for it. No bloated dashboard between you and the download."
        />
      </Reveal>

      <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 lg:mt-16 lg:grid-cols-2 lg:gap-6">
        {pillars.map(({ icon, title, desc, points }, i) => (
          <Reveal
            key={title}
            delay={(Math.min(i % 4, 3) as 0 | 1 | 2 | 3)}
            variant="up"
            className="interactive-lift flex h-full flex-col rounded-2xl border border-line bg-surface/70 p-6 sm:rounded-3xl sm:p-8"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface-elevated sm:h-14 sm:w-14">
                <Image
                  src={icon}
                  alt=""
                  width={56}
                  height={56}
                  className="icon-ember-tint h-6 w-6 object-contain sm:h-7 sm:w-7"
                />
              </span>
              <h3 className="font-display text-lg font-bold tracking-tight text-ink sm:text-xl lg:text-2xl">
                {title}
              </h3>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-muted sm:mt-5 sm:text-base">
              {desc}
            </p>
            <ul className="mt-5 space-y-2.5 border-t border-line/70 pt-5 sm:mt-6 sm:pt-6">
              {points.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 text-sm text-ink sm:text-[15px]"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10 flex flex-col gap-3 border-t border-line pt-8 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:pt-10">
        <p className="text-sm text-ink-muted sm:text-base">
          Ready to try it on a real file?
        </p>
        <Link
          href="/convert"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ember transition hover:text-ember-deep"
        >
          Open the converter
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </Section>
  );
}
