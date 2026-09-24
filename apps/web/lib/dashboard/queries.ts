import { and, desc, eq, gte, inArray, lt, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { conversions, jobs } from "@/lib/db/schema";
import { CONVERSION_PAIRS } from "@/lib/converters/catalog";
import {
  bucketKeys,
  formatBucketLabel,
  previousWindow,
  resolveRange,
  type Bucket,
  type RangeKey,
  type ResolvedRange,
} from "./range";

const BREAKDOWN_LIMIT = 6;
const RECENT_LIMIT = 8;

/** "pdf" -> "PDF", "docx" -> "Word", ... from the converter catalog. */
const FORMAT_LABELS: Record<string, string> = Object.assign(
  {},
  ...CONVERSION_PAIRS.map((p) => p.labels)
);

export function formatLabel(ext: string): string {
  return FORMAT_LABELS[ext] ?? ext.toUpperCase();
}

export interface SeriesPoint {
  key: string;
  label: string;
  count: number;
  bytes: number;
}

export interface DashboardData {
  range: { key: RangeKey; bucket: Bucket; start: string; end: string };
  series: SeriesPoint[];
  totals: {
    count: number;
    bytes: number;
    /** Null for "all time", which has nothing to compare against. */
    prevCount: number | null;
    prevBytes: number | null;
  };
  breakdown: { label: string; count: number }[];
  jobs: { completed: number; failed: number; avgProcessingMs: number | null };
  recent: {
    id: string;
    originalFilename: string;
    sourceFormat: string;
    targetFormat: string;
    createdAt: string;
    hasFile: boolean;
  }[];
}

/**
 * Everything the dashboard shows, scoped to one user, one time range and
 * (optionally) one converter pair, so every tile and chart agrees.
 * `pairType` is a registry key such as "pdf-word"; an unknown key is
 * treated as "all formats".
 */
export async function getDashboardData(
  userId: string,
  rangeKey: RangeKey,
  pairType: string | null
): Promise<DashboardData> {
  const pair = CONVERSION_PAIRS.find((p) => p.type === pairType) ?? null;
  const now = new Date();

  const pairFilter: SQL[] = pair
    ? [
        inArray(conversions.sourceFormat, pair.extensions),
        inArray(conversions.targetFormat, pair.extensions),
      ]
    : [];
  const owned = [eq(conversions.userId, userId), ...pairFilter];

  let earliest: Date | null = null;
  if (rangeKey === "all") {
    const [row] = await db
      .select({ first: sql<Date | null>`min(${conversions.createdAt})` })
      .from(conversions)
      .where(and(...owned));
    earliest = row?.first ? new Date(row.first) : null;
  }
  const range: ResolvedRange = resolveRange(rangeKey, now, earliest);
  const prev = rangeKey === "all" ? null : previousWindow(range);

  // `bucket` is one of three literals from range.ts, never user input, so
  // inlining it (rather than binding a parameter) is safe — and necessary,
  // since Postgres won't match a bound parameter in GROUP BY to SELECT.
  const bucketExpr = sql<string>`to_char(date_trunc(${sql.raw(`'${range.bucket}'`)}, ${conversions.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;
  const bytesExpr = sql<number>`coalesce(sum(coalesce(${conversions.inputFileSize}, ${conversions.fileSize}, 0)), 0)::float8`;
  const inWindow = (from: Date, to: Date | null) => [
    ...owned,
    gte(conversions.createdAt, from),
    ...(to ? [lt(conversions.createdAt, to)] : []),
  ];

  const jobFilters: SQL[] = [
    eq(jobs.userId, userId),
    gte(jobs.createdAt, range.start),
    ...(pair ? [eq(jobs.type, pair.type)] : []),
  ];

  const [seriesRows, prevRows, breakdownRows, jobRows, recentRows] = await Promise.all([
    db
      .select({ key: bucketExpr, count: sql<number>`count(*)::int`, bytes: bytesExpr })
      .from(conversions)
      .where(and(...inWindow(range.start, null)))
      .groupBy(bucketExpr),
    prev
      ? db
          .select({ count: sql<number>`count(*)::int`, bytes: bytesExpr })
          .from(conversions)
          .where(and(...inWindow(prev.start, prev.end)))
      : Promise.resolve(null),
    db
      .select({
        source: conversions.sourceFormat,
        target: conversions.targetFormat,
        count: sql<number>`count(*)::int`,
      })
      .from(conversions)
      .where(and(...inWindow(range.start, null)))
      .groupBy(conversions.sourceFormat, conversions.targetFormat)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({
        status: jobs.status,
        count: sql<number>`count(*)::int`,
        avgMs: sql<number | null>`avg(${jobs.processingTimeMs})::float8`,
      })
      .from(jobs)
      .where(and(...jobFilters))
      .groupBy(jobs.status),
    db
      .select({
        id: conversions.id,
        originalFilename: conversions.originalFilename,
        sourceFormat: conversions.sourceFormat,
        targetFormat: conversions.targetFormat,
        createdAt: conversions.createdAt,
        mimeType: conversions.mimeType,
      })
      .from(conversions)
      .where(and(...inWindow(range.start, null)))
      .orderBy(desc(conversions.createdAt))
      .limit(RECENT_LIMIT),
  ]);

  const byKey = new Map(seriesRows.map((r) => [r.key, r]));
  const series: SeriesPoint[] = bucketKeys(range).map((key) => ({
    key,
    label: formatBucketLabel(key, range.bucket),
    count: byKey.get(key)?.count ?? 0,
    bytes: byKey.get(key)?.bytes ?? 0,
  }));

  const head = breakdownRows.slice(0, BREAKDOWN_LIMIT).map((r) => ({
    label: `${formatLabel(r.source)} → ${formatLabel(r.target)}`,
    count: r.count,
  }));
  const otherCount = breakdownRows.slice(BREAKDOWN_LIMIT).reduce((n, r) => n + r.count, 0);
  const breakdown = otherCount > 0 ? [...head, { label: "Other", count: otherCount }] : head;

  const completed = jobRows.find((r) => r.status === "completed");
  const failed = jobRows.find((r) => r.status === "failed");

  return {
    range: {
      key: range.key,
      bucket: range.bucket,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    },
    series,
    totals: {
      count: series.reduce((n, p) => n + p.count, 0),
      bytes: series.reduce((n, p) => n + p.bytes, 0),
      prevCount: prevRows ? (prevRows[0]?.count ?? 0) : null,
      prevBytes: prevRows ? (prevRows[0]?.bytes ?? 0) : null,
    },
    breakdown,
    jobs: {
      completed: completed?.count ?? 0,
      failed: failed?.count ?? 0,
      avgProcessingMs: completed?.avgMs ?? null,
    },
    recent: recentRows.map((r) => ({
      id: r.id,
      originalFilename: r.originalFilename,
      sourceFormat: r.sourceFormat,
      targetFormat: r.targetFormat,
      createdAt: r.createdAt.toISOString(),
      hasFile: r.mimeType !== null,
    })),
  };
}
