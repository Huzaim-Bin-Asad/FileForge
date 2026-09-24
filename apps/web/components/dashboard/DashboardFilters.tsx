"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RANGE_OPTIONS, DEFAULT_RANGE, type RangeKey } from "@/lib/dashboard/range";
import { cn } from "@/lib/utils";
import Dropdown from "@/components/ui/Dropdown";

export interface FormatOption {
  type: string;
  label: string;
}

/**
 * One row of filters above the dashboard. Selection lives in the URL
 * (?range=…&format=…) so a view is shareable/bookmarkable and the server
 * page stays the single source of truth; the transition keeps the old
 * charts on screen (dimmed by the page) until the new data arrives.
 */
export default function DashboardFilters({
  range,
  format,
  formats,
}: {
  range: RangeKey;
  format: string | null;
  formats: FormatOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const formatOptions = useMemo(
    () => [{ value: "", label: "All formats" }, ...formats.map((f) => ({ value: f.type, label: f.label }))],
    [formats]
  );

  function update(key: "range" | "format", value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null || (key === "range" && value === DEFAULT_RANGE)) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  return (
    <div className="flex flex-wrap items-center gap-3" aria-busy={pending}>
      <div
        role="radiogroup"
        aria-label="Time range"
        className="inline-flex rounded-xl border border-line bg-surface-elevated p-0.5"
      >
        {RANGE_OPTIONS.map((o) => {
          const active = o.key === range;
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={active}
              title={o.description}
              onClick={() => update("range", o.key)}
              className={cn(
                "rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-ember text-white" : "text-ink-muted hover:bg-surface hover:text-ink"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <Dropdown
        id="dashboard-format"
        label="Conversion type"
        placeholder="All formats"
        value={format ?? ""}
        onChange={(v) => update("format", v || null)}
        options={formatOptions}
        className="w-40"
      />

      {pending ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Updating…
        </span>
      ) : null}
    </div>
  );
}
