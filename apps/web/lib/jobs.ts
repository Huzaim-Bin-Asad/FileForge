import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs, type JobStatus } from "@/lib/db/schema";

/**
 * Job lifecycle helpers. A job records the state of one conversion attempt;
 * conversions still run synchronously inside the request, so nothing here
 * schedules or runs work.
 *
 * Transitions are guarded in the WHERE clause, so a terminal job (completed,
 * failed, cancelled) is never overwritten and a late `completeJob` can't
 * resurrect a cancelled one. Each helper returns whether it applied.
 */

const ACTIVE_STATUSES: JobStatus[] = ["queued", "processing"];

const MAX_TYPE_LENGTH = 64;
const MAX_ERROR_CODE_LENGTH = 64;
const MAX_ERROR_MESSAGE_LENGTH = 500;

/** Elapsed ms since `started_at`, used when the caller doesn't supply a timing. */
const elapsedSinceStartMs = sql<number | null>`
  case when ${jobs.startedAt} is null then null
  else (extract(epoch from (now() - ${jobs.startedAt})) * 1000)::integer end
`;

export async function createJob({
  userId,
  type,
}: {
  userId: string;
  type: string;
}): Promise<string> {
  const [row] = await db
    .insert(jobs)
    .values({ userId, type: type.slice(0, MAX_TYPE_LENGTH) })
    .returning({ id: jobs.id });
  return row!.id;
}

export async function startJob(jobId: string): Promise<boolean> {
  const updated = await db
    .update(jobs)
    .set({ status: "processing", startedAt: new Date() })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, "queued")))
    .returning({ id: jobs.id });
  return updated.length > 0;
}

/** Clamps to 0–100. Only applies while the job is processing. */
export async function updateJobProgress(jobId: string, progress: number): Promise<boolean> {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  const updated = await db
    .update(jobs)
    .set({ progress: clamped })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, "processing")))
    .returning({ id: jobs.id });
  return updated.length > 0;
}

export async function completeJob(
  jobId: string,
  { conversionId, processingTimeMs }: { conversionId?: string | null; processingTimeMs?: number } = {}
): Promise<boolean> {
  const updated = await db
    .update(jobs)
    .set({
      status: "completed",
      progress: 100,
      completedAt: new Date(),
      processingTimeMs:
        processingTimeMs === undefined ? elapsedSinceStartMs : Math.max(0, Math.round(processingTimeMs)),
      ...(conversionId ? { conversionId } : {}),
    })
    .where(and(eq(jobs.id, jobId), inArray(jobs.status, ACTIVE_STATUSES)))
    .returning({ id: jobs.id });
  return updated.length > 0;
}

export async function failJob(
  jobId: string,
  {
    code,
    message,
    processingTimeMs,
  }: { code: string; message: string; processingTimeMs?: number }
): Promise<boolean> {
  const updated = await db
    .update(jobs)
    .set({
      status: "failed",
      failedAt: new Date(),
      errorCode: code.slice(0, MAX_ERROR_CODE_LENGTH),
      errorMessage: message.slice(0, MAX_ERROR_MESSAGE_LENGTH),
      processingTimeMs:
        processingTimeMs === undefined ? elapsedSinceStartMs : Math.max(0, Math.round(processingTimeMs)),
    })
    .where(and(eq(jobs.id, jobId), inArray(jobs.status, ACTIVE_STATUSES)))
    .returning({ id: jobs.id });
  return updated.length > 0;
}

/**
 * Takes the owning user's id, not just the job id, so a cancel can never
 * reach another user's job. The schema has no `cancelled_at`, so a
 * cancelled job records only its status.
 */
export async function cancelJob(jobId: string, userId: string): Promise<boolean> {
  const updated = await db
    .update(jobs)
    .set({ status: "cancelled" })
    .where(
      and(eq(jobs.id, jobId), eq(jobs.userId, userId), inArray(jobs.status, ACTIVE_STATUSES))
    )
    .returning({ id: jobs.id });
  return updated.length > 0;
}

/** Owner-scoped lookup. A job that exists but belongs to someone else is indistinguishable from a missing one. */
export async function getJobForUser(jobId: string, userId: string) {
  const [row] = await db
    .select({
      id: jobs.id,
      type: jobs.type,
      status: jobs.status,
      progress: jobs.progress,
      conversionId: jobs.conversionId,
      errorCode: jobs.errorCode,
      errorMessage: jobs.errorMessage,
      createdAt: jobs.createdAt,
      startedAt: jobs.startedAt,
      completedAt: jobs.completedAt,
      failedAt: jobs.failedAt,
      processingTimeMs: jobs.processingTimeMs,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)))
    .limit(1);
  return row ?? null;
}

export type JobRecord = NonNullable<Awaited<ReturnType<typeof getJobForUser>>>;

/** Public shape returned by `GET /api/v1/jobs/:id`. */
export function serializeJob(job: JobRecord) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    conversion_id: job.conversionId,
    error: job.errorCode
      ? { code: job.errorCode, message: job.errorMessage }
      : null,
    created_at: job.createdAt,
    started_at: job.startedAt,
    completed_at: job.completedAt,
    failed_at: job.failedAt,
    processing_time_ms: job.processingTimeMs,
  };
}

/**
 * A failed conversion surfaces as a thrown error, which the route turns into
 * an error response. The job id is remembered against that error object so
 * the route can still hand it to the caller.
 */
const errorJobIds = new WeakMap<object, string>();

export function rememberJobForError(err: unknown, jobId: string) {
  if (typeof err === "object" && err !== null) errorJobIds.set(err, jobId);
}

export function getJobIdForError(err: unknown): string | null {
  return typeof err === "object" && err !== null ? (errorJobIds.get(err) ?? null) : null;
}
