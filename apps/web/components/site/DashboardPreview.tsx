import Link from "next/link";
import {
  Activity,
  FileText,
  FolderOpen,
  History,
  KeyRound,
  LayoutDashboard,
  Settings,
  Zap,
} from "lucide-react";
import { Section, SectionHeading } from "./primitives";
import Reveal from "./Reveal";

const sidebar = [
  { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard", active: true },
  { href: "/history", Icon: History, label: "History" },
  { href: "/collections", Icon: FolderOpen, label: "Collections" },
  { href: "/api-keys", Icon: KeyRound, label: "API Keys" },
  { href: "/profile", Icon: Settings, label: "Settings" },
];

const stats = [
  { label: "Conversions", value: "128", delta: "this month" },
  { label: "Formats used", value: "6", delta: "of 8 pairs" },
  { label: "History items", value: "50", delta: "latest saved" },
];

const recent = [
  { name: "annual-report.pdf", to: "DOCX", time: "2m ago" },
  { name: "budget-q3.xlsx", to: "PDF", time: "18m ago" },
  { name: "notes.md", to: "DOCX", time: "1h ago" },
  { name: "slides.pptx", to: "PDF", time: "3h ago" },
  { name: "handbook.epub", to: "PDF", time: "Yesterday" },
];

const bars = [42, 68, 55, 84, 61, 92, 74, 48, 88, 70, 96, 63];

export default function DashboardPreview() {
  return (
    <Section id="dashboard" className="bg-section-copper" innerClassName="max-w-7xl">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)] lg:gap-14">
        <Reveal variant="left" className="min-w-0">
          <SectionHeading
            index="05 Workspace"
            title="Your file operation, at a glance"
            subtitle="History and account controls today. Collections, API keys, and usage as the product grows, so the converter stays simple, and the workspace stays useful."
          />
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-muted sm:mt-8 sm:space-y-4 sm:text-[15px]">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
              See what converted recently without digging through downloads.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
              Jump back into the converter from anywhere in the account.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
              API keys and collections arrive when the API ships.
            </li>
          </ul>
          <Link
            href="/signup"
            className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-ember-deep sm:mt-10 sm:w-auto"
          >
            Create a free account
          </Link>
        </Reveal>

        <Reveal delay={1} variant="scale" className="panel min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="grid min-w-0 lg:grid-cols-[12.5rem_minmax(0,1fr)]">
            <aside className="hidden flex-col gap-0.5 border-r border-line bg-surface/80 p-4 lg:flex">
              <div className="mb-3 flex items-center gap-2.5 px-2 py-3">
                <span className="bg-brand grid h-9 w-9 place-items-center rounded-xl text-white">
                  <Zap className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span className="font-display text-sm font-bold">Workspace</span>
              </div>
              {sidebar.map(({ href, Icon, label, active }) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-ember-soft font-medium text-ink"
                      : "text-ink-muted hover:bg-surface hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                  <span>{label}</span>
                </Link>
              ))}
            </aside>

            <div className="flex min-w-0 flex-col gap-4 p-4 sm:gap-5 sm:p-5 md:p-6">
              <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {sidebar.map(({ href, Icon, label, active }) => (
                  <Link
                    key={label}
                    href={href}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-ember-soft text-ember-deep"
                        : "bg-surface text-ink-muted hover:text-ink"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
                    {label}
                  </Link>
                ))}
              </div>

              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-ink sm:text-lg">
                    Good to see you
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted sm:text-sm">
                    Preview of the workspace once you sign in
                  </p>
                </div>
                <Link
                  href="/convert"
                  className="rounded-xl bg-ember px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ember-deep sm:px-4 sm:py-2.5"
                >
                  New conversion
                </Link>
              </header>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="min-w-0 rounded-xl bg-surface p-3 sm:rounded-2xl sm:p-4">
                    <p className="truncate text-[10px] text-ink-muted sm:text-xs">
                      {s.label}
                    </p>
                    <div className="mt-1.5 flex flex-col gap-0.5 sm:mt-2 sm:flex-row sm:items-baseline sm:gap-2">
                      <p className="font-display text-lg font-bold text-ink sm:text-2xl">
                        {s.value}
                      </p>
                      <span className="hidden text-[10px] text-ink-muted sm:inline sm:text-[11px]">
                        {s.delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[1.35fr_1fr]">
                <div className="min-w-0 rounded-xl bg-surface p-4 sm:rounded-2xl sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      Conversion volume
                    </p>
                    <span className="shrink-0 text-xs text-ink-muted">12 weeks</span>
                  </div>
                  <div className="mt-4 flex h-24 items-end gap-1 sm:mt-5 sm:h-36 sm:gap-1.5">
                    {bars.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          height: `${h}%`,
                          animationDelay: `${i * 45}ms`,
                        }}
                        className="chart-bar w-full rounded-t-sm bg-gradient-to-t from-ember to-gold/80"
                      />
                    ))}
                  </div>
                </div>

                <div className="min-w-0 rounded-xl bg-surface p-4 sm:rounded-2xl sm:p-5">
                  <p className="text-sm font-semibold text-ink">Recent files</p>
                  <div className="mt-3 flex flex-col gap-2.5 sm:mt-4 sm:gap-3">
                    {recent.map((f) => (
                      <div key={f.name} className="flex items-center gap-2.5">
                        <FileText
                          className="h-3.5 w-3.5 shrink-0 text-ember"
                          strokeWidth={1.7}
                        />
                        <span className="min-w-0 flex-1 truncate text-xs text-ink">
                          {f.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-ink-muted">
                          {f.to}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-surface p-4 sm:rounded-2xl sm:p-5">
                <p className="text-sm font-semibold text-ink">Latest activity</p>
                <div className="mt-3 flex flex-col gap-2.5 sm:mt-4 sm:gap-3">
                  {[
                    "Converted annual-report.pdf → DOCX",
                    "Signed in with Google",
                    "History synced for this device",
                  ].map((a) => (
                    <div key={a} className="flex items-start gap-2.5">
                      <Activity
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember"
                        strokeWidth={1.8}
                      />
                      <span className="text-xs text-ink-muted">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
