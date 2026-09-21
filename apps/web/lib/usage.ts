import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { usageEvents, USAGE_EVENT_TYPES, type UsageEventType } from "@/lib/db/schema";

/**
 * Usage metering, independent of any subscription/billing concept — there
 * isn't one yet. `getCurrentBillingPeriodUsage` stands in for what a real
 * billing period will eventually be, using the calendar month for now.
 *
 * Idempotency: recording is a plain insert with `onConflictDoNothing`
 * against the `(job_id, type)` unique index on `usage_events`
 * (see lib/db/schema.ts). That makes "this job's file_processed event" (or
 * processing_time, or the api_request tied to it) safe to attempt more than
 * once — only the first attempt is ever stored. Events with no job_id carry
 * no such guarantee and are recorded at most once by the caller instead;
 * none of the recorders below currently rely on that case for correctness.
 */

/** A fixed, sensible unit per event type — see lib/db/schema.ts for what each represents. */
export const USAGE_UNIT: Record<UsageEventType, string> = {
  file_processed: "file",
  api_request: "request",
  bandwidth: "byte",
  storage: "byte",
  processing_time: "ms",
};

interface RecordUsageEventInput {
  userId: string;
  /** The job this usage was measured from, when there is one — see the idempotency note above. */
  jobId?: string | null;
  type: UsageEventType;
  amount: number;
  /** Defaults to USAGE_UNIT[type]; only pass this to override. */
  unit?: string;
  metadata?: Record<string, unknown>;
}

/** Records one usage event. Returns false when an identical (job_id, type) event already exists. */
export async function recordUsageEvent({
  userId,
  jobId = null,
  type,
  amount,
  unit,
  metadata,
}: RecordUsageEventInput): Promise<boolean> {
  const inserted = await db
    .insert(usageEvents)
    .values({
      userId,
      jobId,
      type,
      amount: Math.max(0, Math.round(amount)),
      unit: unit ?? USAGE_UNIT[type],
      metadata,
    })
    .onConflictDoNothing({ target: [usageEvents.jobId, usageEvents.type] })
    .returning({ id: usageEvents.id });
  return inserted.length > 0;
}

export interface UsageTotal {
  amount: number;
  unit: string;
  /** Number of usage_events rows contributing to `amount`. */
  count: number;
}

export type UsageSummary = Record<UsageEventType, UsageTotal>;

function emptySummary(): UsageSummary {
  const summary = {} as UsageSummary;
  for (const type of USAGE_EVENT_TYPES) {
    summary[type] = { amount: 0, unit: USAGE_UNIT[type], count: 0 };
  }
  return summary;
}

/**
 * Sums `amount` and counts rows per type for one user in `[from, to)`.
 * Selects only the columns it aggregates over — never `metadata`.
 *
 * Reads a zeroed summary rather than throwing if the query itself fails —
 * notably while migration 0005 (the `usage_events` table) is applied to a
 * given environment's own database but not yet to another's. Usage must
 * never be able to break a page or endpoint that doesn't otherwise depend
 * on it, the same stance taken for writes in lib/conversions.ts.
 */
export async function getUsageInRange(userId: string, from: Date, to: Date): Promise<UsageSummary> {
  try {
    const rows = await db
      .select({
        type: usageEvents.type,
        amount: sql<number>`coalesce(sum(${usageEvents.amount}), 0)`.mapWith(Number),
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(usageEvents)
      .where(
        and(eq(usageEvents.userId, userId), gte(usageEvents.createdAt, from), lt(usageEvents.createdAt, to))
      )
      .groupBy(usageEvents.type);

    const summary = emptySummary();
    for (const row of rows) {
      const type = row.type as UsageEventType;
      summary[type] = { amount: row.amount, unit: USAGE_UNIT[type], count: row.count };
    }
    return summary;
  } catch (e) {
    console.error("Usage: failed to read usage_events (returning zeroed usage)", e);
    return emptySummary();
  }
}

/** [start of UTC day, start of next UTC day) for `date` (defaults to now). */
function utcDayRange(date: Date = new Date()): [Date, Date] {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return [start, end];
}

/** [start of UTC calendar month, start of next UTC calendar month). `month` is 1–12. */
function utcMonthRange(year: number, month: number): [Date, Date] {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return [start, end];
}

export async function getDailyUsage(userId: string, date: Date = new Date()): Promise<UsageSummary> {
  const [from, to] = utcDayRange(date);
  return getUsageInRange(userId, from, to);
}

export async function getMonthlyUsage(
  userId: string,
  year: number,
  month: number
): Promise<UsageSummary> {
  const [from, to] = utcMonthRange(year, month);
  return getUsageInRange(userId, from, to);
}

/**
 * There's no billing system yet, so the "billing period" is just the
 * current calendar month (UTC). Swap this out once a real one exists —
 * everything else in this module is period-agnostic.
 */
export async function getCurrentBillingPeriodUsage(
  userId: string
): Promise<{ periodStart: Date; periodEnd: Date; usage: UsageSummary }> {
  const now = new Date();
  const [periodStart, periodEnd] = utcMonthRange(now.getUTCFullYear(), now.getUTCMonth() + 1);
  const usage = await getUsageInRange(userId, periodStart, periodEnd);
  return { periodStart, periodEnd, usage };
}
