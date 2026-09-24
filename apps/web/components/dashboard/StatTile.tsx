import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2 || Math.max(...values) === 0) return null;
  const w = 96;
  const h = 28;
  const max = Math.max(...values);
  const step = w / (values.length - 1);
  const points = values.map((v, i) => [i * step, h - 2 - (v / max) * (h - 6)] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1]!;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-24 shrink-0 overflow-visible" aria-hidden="true">
      <path d={`${line} L${w},${h} L0,${h} Z`} className="fill-ember/10" />
      <path d={line} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="stroke-ember" />
      {/* 2px surface ring so the end marker reads against the line */}
      <circle cx={lastX} cy={lastY} r={3} strokeWidth={2} className="fill-ember stroke-surface-elevated" />
    </svg>
  );
}

/** Percent change vs the previous period. Null when there's nothing to compare against. */
function Delta({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return null;
  if (previous === 0) {
    return current === 0 ? (
      <span className="text-[11px] text-ink-muted">no change</span>
    ) : (
      <span className="text-[11px] text-ink-muted">new this period</span>
    );
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium",
        pct > 0 ? "text-success" : "text-ink-muted"
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      {Math.abs(pct)}%<span className="font-normal text-ink-muted"> vs previous</span>
    </span>
  );
}

export default function StatTile({
  label,
  value,
  hint,
  current,
  previous,
  spark,
}: {
  label: string;
  value: string;
  /** Secondary line when there's no delta (e.g. "12 of 14 jobs"). */
  hint?: string;
  current?: number;
  previous?: number | null;
  spark?: number[];
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface-elevated p-4 sm:p-5">
      <p className="truncate text-xs font-medium text-ink-muted">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-display text-2xl font-bold leading-none text-ink sm:text-3xl">{value}</p>
        {spark ? <Sparkline values={spark} /> : null}
      </div>
      <div className="mt-2 min-h-4">
        {current !== undefined && previous != null ? (
          <Delta current={current} previous={previous} />
        ) : hint ? (
          <span className="text-[11px] text-ink-muted">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}
