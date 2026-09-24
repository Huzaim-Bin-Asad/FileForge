"use client";

import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/dashboard/stats";
import type { Bucket } from "@/lib/dashboard/range";
import { cn } from "@/lib/utils";

interface Point {
  key: string;
  label: string;
  count: number;
  bytes: number;
}

type Metric = "count" | "bytes";

const HEIGHT = 260;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 44 };
const TOOLTIP_W = 168;

const METRICS: { key: Metric; label: string }[] = [
  { key: "count", label: "Conversions" },
  { key: "bytes", label: "Data processed" },
];

/** Round the top of the axis up to a 1/2/5 × 10ⁿ step so gridlines land on tidy values. */
function niceScale(max: number, ticks = 4): { top: number; step: number } {
  if (max <= 0) return { top: ticks, step: 1 };
  const rough = max / ticks;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;
  // Both metrics are whole numbers (a count, or bytes), so never step below 1.
  const step = Math.max(1, (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow);
  return { top: Math.ceil(max / step) * step, step };
}

function formatValue(metric: Metric, v: number): string {
  return metric === "count" ? v.toLocaleString("en-US") : formatBytes(Math.round(v));
}

/** Bar with only its top corners rounded, anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

export default function VolumeChart({ series, bucket }: { series: Point[]; bucket: Bucket }) {
  const [metric, setMetric] = useState<Metric>("count");
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(640);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.floor(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const values = series.map((p) => p[metric]);
  const hasData = values.some((v) => v > 0);
  const { top, step } = niceScale(Math.max(0, ...values));
  const yFor = (v: number) => MARGIN.top + plotH - (v / top) * plotH;
  const slot = plotW / Math.max(1, series.length);
  const barW = Math.min(28, Math.max(2, slot - 2));
  const gridValues = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const maxLabels = Math.max(2, Math.floor(plotW / 72));
  const labelEvery = Math.ceil(series.length / maxLabels);
  const shortLabel = (p: Point) => p.label.replace("Week of ", "");

  const active = hover !== null ? series[hover] : null;
  const activeCenter = hover !== null ? MARGIN.left + slot * hover + slot / 2 : 0;
  const tooltipLeft = Math.min(Math.max(activeCenter - TOOLTIP_W / 2, 0), width - TOOLTIP_W);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Volume over time</p>
          <p className="text-xs text-ink-muted">
            {metric === "count" ? "Conversions" : "Data processed"} per {bucket}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Chart metric"
          className="inline-flex rounded-lg border border-line bg-surface p-0.5"
        >
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={metric === m.key}
              onClick={() => setMetric(m.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                metric === m.key
                  ? "bg-surface-elevated text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrapRef} className="relative mt-4">
        <svg
          width={width}
          height={HEIGHT}
          role="group"
          aria-label={`${metric === "count" ? "Conversions" : "Data processed"} per ${bucket}`}
          onPointerLeave={() => setHover(null)}
          className="block overflow-visible"
        >
          {gridValues.map((v) => (
            <g key={v}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={yFor(v)}
                y2={yFor(v)}
                strokeWidth={1}
                className={v === 0 ? "stroke-ink-muted/40" : "stroke-line"}
              />
              <text
                x={MARGIN.left - 8}
                y={yFor(v)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-ink-muted text-[10px]"
              >
                {formatValue(metric, v)}
              </text>
            </g>
          ))}

          {series.map((p, i) => {
            const v = p[metric];
            const cx = MARGIN.left + slot * i + slot / 2;
            const h = hasData ? (v / top) * plotH : 0;
            const isActive = hover === i;
            return (
              <g key={p.key}>
                {isActive ? (
                  <rect
                    x={MARGIN.left + slot * i}
                    y={MARGIN.top}
                    width={slot}
                    height={plotH}
                    className="fill-ember/[0.06]"
                  />
                ) : null}
                {v > 0 ? (
                  <path
                    d={barPath(cx - barW / 2, yFor(v), barW, Math.max(2, h), 4)}
                    className={isActive ? "fill-ember-deep" : "fill-ember"}
                  />
                ) : null}
                {i % labelEvery === 0 ? (
                  <text
                    x={cx}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-ink-muted text-[10px]"
                  >
                    {shortLabel(p)}
                  </text>
                ) : null}
                {/* Hit target: the whole slot, well past the painted bar. */}
                <rect
                  x={MARGIN.left + slot * i}
                  y={MARGIN.top}
                  width={slot}
                  height={plotH + MARGIN.bottom}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${p.label}: ${p.count} conversions, ${formatBytes(Math.round(p.bytes))}`}
                  onPointerMove={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
              </g>
            );
          })}
        </svg>

        {!hasData ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-7">
            <p className="rounded-lg bg-surface-elevated/90 px-3 py-1.5 text-sm text-ink-muted">
              No conversions in this range
            </p>
          </div>
        ) : null}

        {active ? (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-line bg-surface-elevated px-3 py-2 shadow-lg"
            style={{
              left: tooltipLeft,
              top: Math.max(0, yFor(active[metric]) - 76),
              width: TOOLTIP_W,
            }}
          >
            <p className="text-[11px] text-ink-muted">{active.label}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-0.5 w-3 shrink-0 rounded bg-ember" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">
                {active.count.toLocaleString("en-US")}{" "}
                <span className="font-normal text-ink-muted">
                  {active.count === 1 ? "conversion" : "conversions"}
                </span>
              </p>
            </div>
            <p className="mt-0.5 pl-5 text-xs text-ink-muted">
              {formatBytes(Math.round(active.bytes))}
            </p>
          </div>
        ) : null}
      </div>

      <details className="mt-3 text-xs text-ink-muted">
        <summary className="cursor-pointer select-none hover:text-ink">View as table</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface text-ink">
              <tr>
                <th className="px-3 py-1.5 font-medium">Period</th>
                <th className="px-3 py-1.5 text-right font-medium">Conversions</th>
                <th className="px-3 py-1.5 text-right font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {series.map((p) => (
                <tr key={p.key} className="border-t border-line">
                  <td className="px-3 py-1.5">{p.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.count}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatBytes(Math.round(p.bytes))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
