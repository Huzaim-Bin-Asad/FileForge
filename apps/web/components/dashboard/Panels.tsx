import Link from "next/link";
import { CheckCircle2, Download, FileText, XCircle } from "lucide-react";
import { formatDurationMs, relativeTime } from "@/lib/dashboard/stats";
import { formatLabel, type DashboardData } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line bg-surface-elevated p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Horizontal bars, one hue, sorted high→low; "Other" is the recessive gray. */
export function BreakdownPanel({ breakdown }: { breakdown: DashboardData["breakdown"] }) {
  const max = Math.max(1, ...breakdown.map((b) => b.count));
  const total = breakdown.reduce((n, b) => n + b.count, 0);

  return (
    <Panel title="Top conversions" description="What you convert most, in this range">
      {breakdown.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">No conversions in this range</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {breakdown.map((b) => (
            <li key={b.label} title={`${b.label}: ${b.count} (${Math.round((b.count / total) * 100)}%)`}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate text-ink">{b.label}</span>
                <span className="shrink-0 tabular-nums text-ink-muted">
                  <span className="font-semibold text-ink">{b.count}</span>{" "}
                  · {Math.round((b.count / total) * 100)}%
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-surface">
                <div
                  className={cn("h-full rounded-full", b.label === "Other" ? "bg-ink-muted/40" : "bg-ember")}
                  style={{ width: `${Math.max(3, (b.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Completed vs failed jobs. Status is always icon + label, never color alone. */
export function ReliabilityPanel({ jobs }: { jobs: DashboardData["jobs"] }) {
  const total = jobs.completed + jobs.failed;
  const rate = total === 0 ? null : (jobs.completed / total) * 100;

  return (
    <Panel title="Reliability" description="Outcome of every conversion attempt in this range">
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">No conversion attempts in this range</p>
      ) : (
        <div>
          <p className="font-display text-3xl font-bold text-ink">
            {rate!.toFixed(rate === 100 || rate! < 10 ? 0 : 1)}%
            <span className="ml-2 font-sans text-xs font-normal text-ink-muted">success rate</span>
          </p>
          <div
            className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full"
            role="img"
            aria-label={`${jobs.completed} succeeded, ${jobs.failed} failed`}
          >
            {jobs.completed > 0 ? (
              <div className="rounded-full bg-success" style={{ flexGrow: jobs.completed }} />
            ) : null}
            {jobs.failed > 0 ? (
              <div className="rounded-full bg-danger" style={{ flexGrow: jobs.failed }} />
            ) : null}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <div>
                <dt className="text-ink-muted">Succeeded</dt>
                <dd className="text-sm font-semibold text-ink">{jobs.completed}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-danger" />
              <div>
                <dt className="text-ink-muted">Failed</dt>
                <dd className="text-sm font-semibold text-ink">{jobs.failed}</dd>
              </div>
            </div>
          </dl>
          {jobs.avgProcessingMs !== null ? (
            <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
              Average processing time{" "}
              <span className="font-semibold text-ink">{formatDurationMs(Math.round(jobs.avgProcessingMs))}</span>
            </p>
          ) : null}
        </div>
      )}
    </Panel>
  );
}

export function RecentPanel({ recent }: { recent: DashboardData["recent"] }) {
  return (
    <Panel
      title="Recent conversions"
      action={
        <Link href="/history" className="text-xs font-medium text-ember-deep hover:underline">
          View all
        </Link>
      }
    >
      {recent.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">No conversions in this range</p>
      ) : (
        <ul className="divide-y divide-line">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <FileText className="h-4 w-4 shrink-0 text-ember" strokeWidth={1.7} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{r.originalFilename}</p>
                <p className="text-xs text-ink-muted">
                  {formatLabel(r.sourceFormat)} → {formatLabel(r.targetFormat)} ·{" "}
                  {relativeTime(new Date(r.createdAt))}
                </p>
              </div>
              {r.hasFile ? (
                <a
                  href={`/api/conversions/${r.id}/download`}
                  aria-label={`Download ${r.originalFilename}`}
                  className="shrink-0 rounded-lg p-2 text-ink-muted transition hover:bg-surface hover:text-ink"
                >
                  <Download className="h-4 w-4" />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
