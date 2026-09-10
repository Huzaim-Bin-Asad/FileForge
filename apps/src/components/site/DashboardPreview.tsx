import {
  Activity,
  CreditCard,
  FileText,
  FolderOpen,
  Gauge,
  History,
  KeyRound,
  LayoutDashboard,
  Settings,
  Star,
  Zap,
} from "lucide-react";
import { GlassCard, Section, SectionHeading } from "./primitives";

const sidebar = [
  { Icon: LayoutDashboard, label: "Dashboard", active: true },
  { Icon: History, label: "History" },
  { Icon: FolderOpen, label: "Collections" },
  { Icon: Star, label: "Favorites" },
  { Icon: KeyRound, label: "API Keys" },
  { Icon: Gauge, label: "Usage" },
  { Icon: CreditCard, label: "Billing" },
  { Icon: Settings, label: "Settings" },
];

const stats = [
  { label: "Conversions", value: "12,481", delta: "+18%" },
  { label: "Storage used", value: "64.2 GB", delta: "42%" },
  { label: "API calls", value: "89,204", delta: "+9%" },
];

const recent = [
  { name: "annual-report.pdf", to: "DOCX", time: "2m ago" },
  { name: "invoices-q3.zip", to: "JSON", time: "18m ago" },
  { name: "scan-contract.jpg", to: "Searchable PDF", time: "1h ago" },
  { name: "metrics.json", to: "CSV", time: "3h ago" },
];

const bars = [42, 68, 55, 84, 61, 92, 74, 48, 88, 70, 96, 63];

export function DashboardPreview() {
  return (
    <Section id="dashboard">
      <SectionHeading
        eyebrow="Dashboard"
        title={<>Your entire file operation, at a glance</>}
        subtitle="History, collections, usage and API keys in a workspace built for daily use."
      />

      <GlassCard hover={false} className="mt-16 overflow-hidden p-0">
        <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="border-border bg-sidebar hidden flex-col gap-1 border-r p-4 lg:flex">
            <div className="flex items-center gap-2.5 px-2 py-3">
              <span className="bg-brand grid h-8 w-8 place-items-center rounded-xl">
                <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.2} />
              </span>
              <span className="font-display text-sm font-semibold">Workspace</span>
            </div>
            {sidebar.map(({ Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-secondary/80 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.7} />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </aside>

          {/* Main */}
          <div className="flex flex-col gap-5 p-5 sm:p-7">
            <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-display truncate text-lg font-medium">Good evening, Aria</h3>
                <p className="truncate text-xs text-muted-foreground">
                  4 conversions running · 2 scheduled jobs
                </p>
              </div>
              <button className="bg-brand shrink-0 rounded-full px-4 py-2 text-xs font-medium text-primary-foreground">
                New conversion
              </button>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="glass-soft rounded-2xl p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="font-display text-xl font-semibold">{s.value}</p>
                    <span className="text-emerald text-[11px]">{s.delta}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="glass-soft rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Conversion volume</p>
                  <span className="text-xs text-muted-foreground">Last 12 weeks</span>
                </div>
                <div className="mt-6 flex h-36 items-end gap-2">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="bg-brand w-full rounded-t-lg opacity-70 transition-opacity hover:opacity-100"
                    />
                  ))}
                </div>
              </div>

              <div className="glass-soft rounded-2xl p-5">
                <p className="text-sm font-medium">Storage usage</p>
                <div className="mt-6 flex flex-col gap-4">
                  {[
                    { label: "Documents", pct: 62 },
                    { label: "Images", pct: 24 },
                    { label: "Archives", pct: 11 },
                  ].map((r) => (
                    <div key={r.label}>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{r.label}</span>
                        <span>{r.pct}%</span>
                      </div>
                      <div className="bg-secondary mt-2 h-1.5 overflow-hidden rounded-full">
                        <div className="bg-brand h-full rounded-full" style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="glass-soft rounded-2xl p-5">
                <p className="text-sm font-medium">Recent files</p>
                <div className="mt-4 flex flex-col gap-3">
                  {recent.map((f) => (
                    <div key={f.name} className="flex items-center gap-3">
                      <FileText className="text-violet h-4 w-4 shrink-0" strokeWidth={1.7} />
                      <span className="min-w-0 flex-1 truncate text-xs">{f.name}</span>
                      <span className="border-border shrink-0 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                        {f.to}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{f.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-soft rounded-2xl p-5">
                <p className="text-sm font-medium">Latest activity</p>
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    "Batch job “invoices-q3” finished — 248 files",
                    "API key “prod-eu” created",
                    "OCR enabled on collection “Contracts”",
                    "Plan upgraded to Pro",
                  ].map((a) => (
                    <div key={a} className="flex items-start gap-3">
                      <Activity className="text-cyan mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                      <span className="min-w-0 text-xs text-muted-foreground">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </Section>
  );
}
