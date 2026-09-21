import Link from "next/link";
import { redirect } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import { Activity, FileText } from "lucide-react";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import {
  bucketWeeklyVolume,
  formatBytes,
  formatDurationMs,
  pairKeyFor,
  relativeTime,
  SUPPORTED_PAIR_COUNT,
} from "@/lib/dashboard/stats";
import { getCurrentBillingPeriodUsage } from "@/lib/usage";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Dashboard | FileForge",
};

const VOLUME_WEEKS = 12;
const RECENT_LIMIT = 5;
const SAMPLE_LIMIT = 300;

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [[{ value: total }], items, { usage }] = await Promise.all([
    db
      .select({ value: count() })
      .from(conversions)
      .where(eq(conversions.userId, user.id)),
    db
      .select({
        id: conversions.id,
        originalFilename: conversions.originalFilename,
        sourceFormat: conversions.sourceFormat,
        targetFormat: conversions.targetFormat,
        createdAt: conversions.createdAt,
      })
      .from(conversions)
      .where(eq(conversions.userId, user.id))
      .orderBy(desc(conversions.createdAt))
      .limit(SAMPLE_LIMIT),
    getCurrentBillingPeriodUsage(user.id),
  ]);

  const recent = items.slice(0, RECENT_LIMIT);
  const formatsUsed = new Set(
    items.map((i) => pairKeyFor(i.sourceFormat, i.targetFormat)).filter(Boolean)
  ).size;

  const buckets = bucketWeeklyVolume(items, VOLUME_WEEKS);
  const maxBucket = Math.max(1, ...buckets);
  const bars = buckets.map((c) => (c === 0 ? 0 : Math.max(8, Math.round((c / maxBucket) * 100))));

  const stats = [
    { label: "Conversions", value: String(total), delta: "all time" },
    { label: "Formats used", value: String(formatsUsed), delta: `of ${SUPPORTED_PAIR_COUNT} pairs` },
    { label: "History items", value: String(Math.min(total, 50)), delta: "in your history" },
  ];

  // Current-month usage. There's no billing system yet, so "this month" is
  // the whole abstraction — see lib/usage.ts.
  const monthlyStats = [
    { label: "Files processed", value: String(usage.file_processed.amount) },
    { label: "API requests", value: String(usage.api_request.amount) },
    { label: "Processing time", value: formatDurationMs(usage.processing_time.amount) },
    { label: "Bandwidth", value: formatBytes(usage.bandwidth.amount) },
  ];

  return (
    <WorkspaceShell
      title="Welcome back"
      subtitle={user.email}
      action={
        <Link
          href="/convert"
          className="rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-deep"
        >
          New conversion
        </Link>
      }
    >
      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface-elevated px-6 py-16 text-center">
          <p className="font-display text-lg font-bold text-ink">No conversions yet</p>
          <p className="mt-2 text-sm text-ink-muted">
            Convert a file and your stats, chart, and recent files will show up here.
          </p>
          <Link
            href="/convert"
            className="mt-6 inline-flex rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-steel-soft"
          >
            Open the converter
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0 rounded-2xl bg-surface-elevated p-4 sm:p-5">
                <p className="truncate text-xs text-ink-muted">{s.label}</p>
                <div className="mt-2 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                  <p className="font-display text-2xl font-bold text-ink">{s.value}</p>
                  <span className="text-[11px] text-ink-muted">{s.delta}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-surface-elevated p-5">
            <p className="text-sm font-semibold text-ink">This month</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {monthlyStats.map((s) => (
                <div key={s.label} className="min-w-0">
                  <p className="truncate text-xs text-ink-muted">{s.label}</p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-[1.35fr_1fr]">
            <div className="min-w-0 rounded-2xl bg-surface-elevated p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">Conversion volume</p>
                <span className="shrink-0 text-xs text-ink-muted">{VOLUME_WEEKS} weeks</span>
              </div>
              <div className="chart-bars-ready mt-5 flex h-32 items-end gap-1.5 sm:h-40">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%`, animationDelay: `${i * 45}ms` }}
                    className="chart-bar w-full rounded-t-sm bg-gradient-to-t from-ember to-gold/80"
                  />
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-2xl bg-surface-elevated p-5">
              <p className="text-sm font-semibold text-ink">Recent files</p>
              <div className="mt-4 flex flex-col gap-3">
                {recent.map((f) => (
                  <div key={f.id} className="flex items-center gap-2.5">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-ember" strokeWidth={1.7} />
                    <span className="min-w-0 flex-1 truncate text-xs text-ink">
                      {f.originalFilename}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase text-ink-muted">
                      {f.targetFormat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-elevated p-5">
            <p className="text-sm font-semibold text-ink">Latest activity</p>
            <div className="mt-4 flex flex-col gap-3">
              {recent.slice(0, 3).map((f) => (
                <div key={f.id} className="flex items-start gap-2.5">
                  <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" strokeWidth={1.8} />
                  <span className="text-xs text-ink-muted">
                    Converted {f.originalFilename} → {f.targetFormat.toUpperCase()},{" "}
                    {relativeTime(new Date(f.createdAt))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
