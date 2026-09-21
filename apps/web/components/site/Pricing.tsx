import Link from "next/link";
import { Check } from "lucide-react";
import { Section, SectionHeading } from "./primitives";
import Reveal from "./Reveal";

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "no card needed",
    desc: "Convert everyday documents without signing up. The full converter, no paywall.",
    features: [
      "Core format conversions",
      "PDF, Word, Excel, PowerPoint",
      "Markdown, HTML, TXT, EPUB",
      "Private processing, every time",
      "No account required",
    ],
    cta: "Start converting",
    href: "/dashboard",
    featured: false,
  },
  {
    name: "Account",
    price: "$0",
    note: "optional",
    desc: "Same converter, plus history, profile controls, and Google or email sign in.",
    features: [
      "Everything in Free",
      "Conversion history",
      "Google or email sign in",
      "Password & account controls",
      "Delete account anytime",
    ],
    cta: "Create account",
    href: "/signup",
    featured: true,
  },
  {
    name: "API",
    price: "Soon",
    note: "roadmap",
    desc: "Programmatic conversions for teams and pipelines. Join the waitlist early.",
    features: [
      "REST convert endpoint",
      "Webhooks on completion",
      "Usage metering",
      "Rate limits scoped per key",
      "Early access via signup",
    ],
    cta: "Join waitlist",
    href: "/signup",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <Section
      id="pricing"
      className="border-t border-line/70 bg-section-mist"
    >
      <Reveal>
        <SectionHeading
          index="06 Pricing"
          title="Free to convert. Optional account."
          subtitle="Convert today with no paywall. Sign up for history. API access is coming next, same forge, wired for machines."
        />
      </Reveal>

      <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-5 lg:mt-14 lg:grid-cols-3 lg:gap-6">
        {plans.map((p, i) => (
          <Reveal
            key={p.name}
            delay={(Math.min(i, 3) as 0 | 1 | 2 | 3)}
            variant="up"
            className={`interactive-lift flex flex-col gap-5 rounded-2xl border p-5 sm:gap-7 sm:rounded-3xl sm:p-7 md:p-8 ${
              p.featured
                ? "border-ember/40 bg-ember-soft/40 ring-1 ring-ember/20"
                : "border-line bg-surface/70"
            }`}
          >
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-wider text-ember uppercase">
                {p.featured ? "Recommended" : p.name}
              </p>
              <h3 className="font-display mt-2 text-xl font-bold text-ink sm:mt-3 sm:text-2xl">
                {p.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:mt-3 sm:text-[15px]">
                {p.desc}
              </p>
            </div>

            <div className="flex items-baseline gap-2 border-y border-line/80 py-4 sm:py-5">
              <span className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                {p.price}
              </span>
              <span className="text-sm text-ink-muted">{p.note}</span>
            </div>

            <ul className="flex flex-col gap-2.5 sm:gap-3">
              {p.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm text-ink-muted sm:text-[15px]"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-ember"
                    strokeWidth={2.4}
                  />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={p.href}
              className={`mt-auto inline-flex justify-center rounded-xl px-5 py-3 text-sm font-semibold transition sm:py-3.5 ${
                p.featured
                  ? "bg-brand text-white shadow-md shadow-ember/20 hover:opacity-95"
                  : "border border-line bg-surface-elevated text-ink hover:bg-steel-soft"
              }`}
            >
              {p.cta}
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
