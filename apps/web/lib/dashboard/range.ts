/**
 * Time-range presets for the dashboard and the bucketing that goes with
 * them. Pure and client-safe (the filter bar imports the options); all
 * arithmetic is UTC so it matches the `date_trunc(... at time zone 'UTC')`
 * buckets the queries group by.
 */

export type RangeKey = "7d" | "30d" | "90d" | "12m" | "all";
export type Bucket = "day" | "week" | "month";

export const RANGE_OPTIONS: { key: RangeKey; label: string; description: string }[] = [
  { key: "7d", label: "7 days", description: "Last 7 days, by day" },
  { key: "30d", label: "30 days", description: "Last 30 days, by day" },
  { key: "90d", label: "90 days", description: "Last 90 days, by week" },
  { key: "12m", label: "12 months", description: "Last 12 months, by month" },
  { key: "all", label: "All time", description: "Everything you've converted" },
];

export const DEFAULT_RANGE: RangeKey = "30d";

export function parseRange(value: string | undefined): RangeKey {
  return RANGE_OPTIONS.some((o) => o.key === value) ? (value as RangeKey) : DEFAULT_RANGE;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Monday-based, to match Postgres' date_trunc('week'). */
function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const sinceMonday = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - sinceMonday * DAY_MS);
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function startOfBucket(d: Date, bucket: Bucket): Date {
  if (bucket === "day") return startOfDay(d);
  if (bucket === "week") return startOfWeek(d);
  return startOfMonth(d);
}

function addBucket(d: Date, bucket: Bucket): Date {
  if (bucket === "day") return new Date(d.getTime() + DAY_MS);
  if (bucket === "week") return new Date(d.getTime() + 7 * DAY_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

export interface ResolvedRange {
  key: RangeKey;
  bucket: Bucket;
  /** Bucket-aligned start, so the first bar is a whole bucket rather than a sliver. */
  start: Date;
  end: Date;
}

/**
 * @param earliest the user's first conversion; only used for "all time",
 *   where the bucket size follows how much history there is.
 */
export function resolveRange(key: RangeKey, now: Date, earliest: Date | null): ResolvedRange {
  switch (key) {
    case "7d":
      return { key, bucket: "day", start: startOfDay(new Date(now.getTime() - 6 * DAY_MS)), end: now };
    case "30d":
      return { key, bucket: "day", start: startOfDay(new Date(now.getTime() - 29 * DAY_MS)), end: now };
    case "90d":
      return { key, bucket: "week", start: startOfWeek(new Date(now.getTime() - 89 * DAY_MS)), end: now };
    case "12m": {
      const thisMonth = startOfMonth(now);
      const start = new Date(Date.UTC(thisMonth.getUTCFullYear(), thisMonth.getUTCMonth() - 11, 1));
      return { key, bucket: "month", start, end: now };
    }
    case "all": {
      const from = earliest ?? new Date(now.getTime() - 29 * DAY_MS);
      const spanDays = (now.getTime() - from.getTime()) / DAY_MS;
      const bucket: Bucket = spanDays <= 45 ? "day" : spanDays <= 200 ? "week" : "month";
      return { key, bucket, start: startOfBucket(from, bucket), end: now };
    }
  }
}

/** ISO date (YYYY-MM-DD) keys for every bucket from `start` through `end`, oldest first. */
export function bucketKeys(range: ResolvedRange): string[] {
  const keys: string[] = [];
  for (let d = range.start; d <= range.end; d = addBucket(d, range.bucket)) {
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export function formatBucketLabel(key: string, bucket: Bucket): string {
  const d = new Date(`${key}T00:00:00Z`);
  if (bucket === "month") {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  }
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return bucket === "week" ? `Week of ${label}` : label;
}

/** The equally long window immediately before `range`, for period-over-period deltas. */
export function previousWindow(range: ResolvedRange): { start: Date; end: Date } {
  const length = range.end.getTime() - range.start.getTime();
  return { start: new Date(range.start.getTime() - length), end: range.start };
}
