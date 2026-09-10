import { Check, Sparkles } from "lucide-react";
import { GlassCard, Section, SectionHeading } from "./primitives";

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "forever",
    desc: "For occasional conversions and trying out the pipeline.",
    features: ["20 conversions / month", "Files up to 25 MB", "Core formats", "Standard queue", "7-day history"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    note: "/ month",
    desc: "For professionals who convert every day and need AI.",
    features: [
      "Unlimited conversions",
      "Files up to 2 GB",
      "All AI enhancements",
      "Batch processing",
      "Priority queue",
      "Unlimited history",
    ],
    cta: "Upgrade to Pro",
    featured: true,
  },
  {
    name: "Business",
    price: "$79",
    note: "/ month",
    desc: "For teams shipping FileForge inside their own product.",
    features: [
      "Everything in Pro",
      "5 seats included",
      "API + webhooks",
      "SSO & audit logs",
      "Dedicated throughput",
      "99.99% SLA",
    ],
    cta: "Talk to sales",
    featured: false,
  },
];

export function Pricing() {
  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow="Pricing"
        title={<>Simple plans that scale with your files</>}
        subtitle="No per-conversion surprises. Change or cancel at any time."
      />

      <div className="mt-16 grid items-start gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`glass gradient-border lift relative flex flex-col gap-6 rounded-3xl p-8 ${
              p.featured ? "glow lg:-mt-4 lg:pb-10" : ""
            }`}
          >
            {p.featured ? (
              <span className="bg-brand absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium text-primary-foreground">
                <Sparkles className="h-3 w-3" />
                Most popular
              </span>
            ) : null}

            <div>
              <h3 className="font-display text-lg font-medium">{p.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-5xl font-semibold tracking-tight">{p.price}</span>
              <span className="text-sm text-muted-foreground">{p.note}</span>
            </div>

            <div className="flex flex-col gap-3">
              {p.features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <span className="bg-emerald/15 grid h-5 w-5 shrink-0 place-items-center rounded-full">
                    <Check className="text-emerald h-3 w-3" strokeWidth={2.6} />
                  </span>
                  <span className="min-w-0 text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>

            <button
              className={`mt-auto rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ${
                p.featured
                  ? "bg-brand animate-gradient-pan text-primary-foreground hover:shadow-[var(--shadow-glow)]"
                  : "glass-soft hover:bg-secondary/70"
              }`}
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

const testimonials = [
  {
    quote:
      "We replaced four vendors with one endpoint. Our invoice pipeline went from a weekly chore to something nobody thinks about.",
    name: "Aria Kessler",
    role: "Head of Ops, Northlane",
    initials: "AK",
  },
  {
    quote:
      "The OCR quality on scanned contracts is genuinely better than what we were paying enterprise money for.",
    name: "Marcus Vale",
    role: "Legal Engineer, Corvid",
    initials: "MV",
  },
  {
    quote:
      "It's the rare developer tool that's also beautiful. Our non-technical team uses the same product we call from the API.",
    name: "Priya Raman",
    role: "CTO, Fieldbase",
    initials: "PR",
  },
];

export function Testimonials() {
  return (
    <Section id="testimonials">
      <SectionHeading
        eyebrow="Loved by teams"
        title={<>Trusted where files actually matter</>}
      />

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {testimonials.map((t) => (
          <GlassCard key={t.name} className="flex flex-col gap-6 p-8">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" className="fill-chart-4 h-4 w-4">
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                </svg>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">“{t.quote}”</p>
            <div className="mt-auto flex items-center gap-3">
              <span className="bg-brand font-display grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-semibold text-primary-foreground">
                {t.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
