import Link from "next/link";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { CONVERSION_PAIRS } from "@/lib/converters/catalog";
import { getDashboardData } from "@/lib/dashboard/queries";
import { parseRange, RANGE_OPTIONS } from "@/lib/dashboard/range";
import { formatBytes, formatDurationMs } from "@/lib/dashboard/stats";
import { getCurrentBillingPeriodUsage } from "@/lib/usage";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import StatTile from "@/components/dashboard/StatTile";
import VolumeChart from "@/components/dashboard/VolumeChart";
import { BreakdownPanel, Panel, RecentPanel, ReliabilityPanel } from "@/components/dashboard/Panels";

export const metadata = {
  title: "Dashboard | FileForge",
};

const FORMAT_OPTIONS = CONVERSION_PAIRS.map((p) => ({
  type: p.type,
  label: `${p.labels[p.extensions[0]]} & ${p.labels[p.extensions[1]]}`,
}));

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; format?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const params = await searchParams;
  const rangeKey = parseRange(params.range);
  const format = FORMAT_OPTIONS.some((f) => f.type === params.format) ? params.format! : null;

  const [[{ value: lifetimeTotal }], data, { usage }] = await Promise.all([
    db.select({ value: count() }).from(conversions).where(eq(conversions.userId, user.id)),
    getDashboardData(user.id, rangeKey, format),
    getCurrentBillingPeriodUsage(user.id),
  ]);

  const rangeLabel = RANGE_OPTIONS.find((o) => o.key === rangeKey)!.description;
  const attempts = data.jobs.completed + data.jobs.failed;
  const successRate = attempts === 0 ? null : (data.jobs.completed / attempts) * 100;

  return (
    <WorkspaceShell
      title="Dashboard"
      subtitle={`${user.email} · ${rangeLabel}`}
      action={
        <Link
          href="/convert"
          className="inline-flex items-center gap-1.5 rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-deep"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          New conversion
        </Link>
      }
    >
      {lifetimeTotal === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface-elevated px-6 py-16 text-center">
          <p className="font-display text-lg font-bold text-ink">No conversions yet</p>
          <p className="mt-2 text-sm text-ink-muted">
            Convert a file and your stats, charts, and recent files will show up here.
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
          <DashboardFilters range={rangeKey} format={format} formats={FORMAT_OPTIONS} />

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile
              label="Conversions"
              value={data.totals.count.toLocaleString("en-US")}
              current={data.totals.count}
              previous={data.totals.prevCount}
              hint="all time"
              spark={data.series.map((p) => p.count)}
            />
            <StatTile
              label="Data processed"
              value={formatBytes(Math.round(data.totals.bytes))}
              current={data.totals.bytes}
              previous={data.totals.prevBytes}
              hint="all time"
              spark={data.series.map((p) => p.bytes)}
            />
            <StatTile
              label="Success rate"
              value={successRate === null ? "—" : `${successRate.toFixed(successRate === 100 ? 0 : 1)}%`}
              hint={attempts === 0 ? "no attempts yet" : `${data.jobs.completed} of ${attempts} attempts`}
            />
            <StatTile
              label="Avg processing time"
              value={
                data.jobs.avgProcessingMs === null
                  ? "—"
                  : formatDurationMs(Math.round(data.jobs.avgProcessingMs))
              }
              hint="per completed conversion"
            />
          </div>

          <section className="min-w-0 rounded-2xl border border-line bg-surface-elevated p-4 sm:p-5">
            <VolumeChart series={data.series} bucket={data.range.bucket} />
          </section>

          <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
            <BreakdownPanel breakdown={data.breakdown} />
            <ReliabilityPanel jobs={data.jobs} />
          </div>

          <RecentPanel recent={data.recent} />

          <Panel
            title="This month's usage"
            description="Current billing period — not affected by the filters above"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Files processed", value: String(usage.file_processed.amount) },
                { label: "API requests", value: String(usage.api_request.amount) },
                { label: "Processing time", value: formatDurationMs(usage.processing_time.amount) },
                { label: "Bandwidth", value: formatBytes(usage.bandwidth.amount) },
              ].map((s) => (
                <div key={s.label} className="min-w-0">
                  <p className="truncate text-xs text-ink-muted">{s.label}</p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">{s.value}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </WorkspaceShell>
  );
}
