import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { ConversionError, convertFile } from "@/lib/converters";
import { storeConversion } from "@/lib/conversions";
import { claimJobForProcessing, completeJob, failJob, requeueJob, STALE_PROCESSING_MS } from "@/lib/jobs";
import { deleteBlobsBestEffort, readBlobAsBuffer } from "@/lib/blobStorage";
import { enqueueConversionJob } from "@/lib/queue";
import { recordUsageEvent } from "@/lib/usage";

/**
 * Runs one asynchronous conversion job to completion. This is Phase 4's
 * dedicated processor (see the design note in lib/db/schema.ts on `jobs`):
 * `POST /api/v1/convert` no longer runs a conversion inline — it durably
 * records the job and its input, hands the job id to Vercel Queues, and
 * returns. Queues invokes this function later, from an unrelated request
 * (see app/api/queues/process-conversion/route.ts), so nothing here may
 * assume access to anything that isn't durably stored under `jobId`.
 *
 * Safe to call more than once for the same `jobId`, including concurrently:
 * Vercel Queues delivers at-least-once, so redelivery after a crash, a
 * timeout, or a deployment rollout is expected, not exceptional (see
 * lib/jobs.ts's `claimJobForProcessing`). Only the caller that wins the
 * atomic claim does any conversion work; every other caller — a job that's
 * already completed, failed, cancelled, or is genuinely still being worked
 * on elsewhere — returns immediately having touched nothing.
 */
export type ProcessJobResult =
  /** Nothing to do: already terminal, or another still-live invocation owns it. */
  | { outcome: "skipped" }
  | { outcome: "completed"; conversionId: string | null }
  /** Permanently failed (job row is already marked "failed"). Caller should acknowledge the message. */
  | { outcome: "failed" };
/**
 * A failure that may succeed on a fresh attempt never returns: the job is
 * put back in "queued" (see `requeueJob`) and the original error is
 * rethrown, so a queue consumer's handler propagates it and Vercel Queues
 * schedules a redelivery — see `retryOrGiveUp` below.
 */

export interface ProcessJobOptions {
  /**
   * The queue delivery's 1-based attempt count (`metadata.deliveryCount`
   * from `@vercel/queue`). Defaults to 1 for callers outside the queue
   * (e.g. tests, or a future manual "retry this job" action) — a single,
   * unconditional attempt.
   */
  deliveryCount?: number;
}

/** Delivery attempts (including the first) after which a retryable failure is given up on. */
export const MAX_DELIVERY_ATTEMPTS = 8;

export async function processJob(
  jobId: string,
  { deliveryCount = 1 }: ProcessJobOptions = {}
): Promise<ProcessJobResult> {
  const job = await claimJobForProcessing(jobId);
  if (!job) return { outcome: "skipped" };

  const startedAtMs = (job.startedAt ?? new Date()).getTime();
  const isFinalAttempt = deliveryCount >= MAX_DELIVERY_ATTEMPTS;

  // A job created by createAsyncJob always has this; a job somehow claimed
  // here without one (e.g. a bug elsewhere) can never be processed, and
  // retrying will not change that, so this is treated as permanent.
  if (!job.inputBlobPath) {
    await giveUp(jobId, null, {
      code: "missing_input",
      message: "This job has no recorded input and cannot be processed.",
      startedAtMs,
    });
    return { outcome: "failed" };
  }

  let inputBuffer: Buffer;
  try {
    const buffer = await readBlobAsBuffer(job.inputBlobPath);
    if (!buffer) throw new Error(`Job input Blob is missing: ${job.inputBlobPath}`);
    inputBuffer = buffer;
  } catch (e) {
    return retryOrGiveUp(jobId, job.inputBlobPath, e, { isFinalAttempt, startedAtMs });
  }

  let result;
  try {
    result = await convertFile(job.type, inputBuffer, job.originalFilename ?? "file");
  } catch (e) {
    // A ConversionError (unknown type, unsupported pair, wrong extension) is
    // deterministic: rerunning it on the same bytes fails the same way
    // every time, so there is no point retrying regardless of attempt count.
    const permanent = e instanceof ConversionError;
    return retryOrGiveUp(jobId, job.inputBlobPath, e, {
      isFinalAttempt: isFinalAttempt || permanent,
      startedAtMs,
    });
  }

  let conversionId: string | null;
  try {
    conversionId = await storeConversion({
      userId: job.userId,
      // /api/v1/convert doesn't accept a collection to file into (it never
      // did, pre-Phase-4) — nothing async ever has one to pass on.
      collectionId: null,
      filename: job.originalFilename ?? "file",
      inputBuffer,
      inputMimeType: job.inputMimeType,
      result,
    });
  } catch (e) {
    // Unlike lib/conversions.ts's synchronous runConversion, a storage
    // failure here must NOT complete the job: in the synchronous flow the
    // caller already has the converted bytes in the HTTP response, so a
    // failure to also save history is a minor degradation. Here, storage
    // IS delivery — the only way the result ever reaches the user is a
    // `conversions` row a download route can read. So this is treated as a
    // failed attempt and retried like any other: convertFile is cheap to
    // rerun, and storeConversion is itself safe to retry (see its own
    // docstring) since it mints a fresh conversion id each attempt.
    return retryOrGiveUp(jobId, job.inputBlobPath, e, { isFinalAttempt, startedAtMs });
  }

  const processingTimeMs = Date.now() - startedAtMs;
  await completeJob(jobId, { conversionId, processingTimeMs });

  // Idempotent via the (job_id, type) unique index in lib/usage.ts — safe
  // even if this point is somehow reached twice for the same job.
  await recordUsageEvent({ userId: job.userId, jobId, type: "file_processed", amount: 1 });
  await recordUsageEvent({ userId: job.userId, jobId, type: "processing_time", amount: processingTimeMs });
  await recordUsageEvent({
    userId: job.userId,
    jobId,
    type: "bandwidth",
    amount: inputBuffer.length + result.buffer.length,
    metadata: { input_bytes: inputBuffer.length, output_bytes: result.buffer.length },
  });

  // The durable copy now lives under the conversion-scoped path
  // (storeConversion just put it there); the job-scoped copy was only ever
  // needed to survive until this point. Best-effort: a failure here leaves
  // a harmless leftover the orphan sweep in lib/conversionStorage.ts will
  // find, never a correctness problem.
  await deleteBlobsBestEffort([job.inputBlobPath], `job ${jobId} completed`);

  return { outcome: "completed", conversionId };
}

function describeFailure(err: unknown): { code: string; message: string } {
  if (err instanceof ConversionError) {
    return {
      code: err.status === 501 ? "not_implemented" : "invalid_conversion",
      message: err.message,
    };
  }
  return {
    code: "conversion_failed",
    message: err instanceof Error && err.message ? err.message : "Conversion failed.",
  };
}

async function giveUp(
  jobId: string,
  inputBlobPath: string | null,
  { code, message, startedAtMs }: { code: string; message: string; startedAtMs: number }
): Promise<void> {
  await failJob(jobId, { code, message, processingTimeMs: Date.now() - startedAtMs });
  // Nothing will ever read this again, so reclaim the space now rather than
  // waiting for the orphan sweep.
  if (inputBlobPath) await deleteBlobsBestEffort([inputBlobPath], `job ${jobId} permanently failed`);
}

/**
 * Shared tail of every failure branch above. On the final allowed attempt,
 * marks the job permanently failed and returns normally (the caller should
 * acknowledge the queue message — retrying further would just repeat this).
 * Otherwise, puts the job back in "queued" so the *next* delivery can claim
 * it right away, then rethrows so the queue consumer's handler sees a
 * thrown error and Vercel Queues schedules a redelivery with its own
 * backoff (see app/api/queues/process-conversion/route.ts).
 */
async function retryOrGiveUp(
  jobId: string,
  inputBlobPath: string | null,
  error: unknown,
  { isFinalAttempt, startedAtMs }: { isFinalAttempt: boolean; startedAtMs: number }
): Promise<{ outcome: "failed" }> {
  if (isFinalAttempt) {
    await giveUp(jobId, inputBlobPath, { ...describeFailure(error), startedAtMs });
    return { outcome: "failed" };
  }
  await requeueJob(jobId);
  throw error;
}

// --- Stale-job recovery ------------------------------------------------------
//
// Vercel Queues already redelivers a message whenever its consumer fails,
// times out, or is killed by a deployment rollout — the ordinary case is
// covered without any of this (see retryOrGiveUp above, and the Phase 4
// report's timeout/crash discussion). This exists for the residual case
// where a queue message stops being delivered at all before processJob ever
// got to run and leave the job in a recoverable state — e.g. every delivery
// crashes before reaching the handler at all, exhausting the message's
// retention. That leaves a job stuck "processing" with nothing left that
// will ever revisit it.
//
// Deliberately not wired to a cron trigger (see Phase 4 report) — like
// lib/conversionStorage.ts's orphan sweep, it's here so it can be later,
// without inventing a mechanism that depends on an always-running process.

export interface StaleJob {
  id: string;
  userId: string;
  type: string;
  startedAt: Date | null;
}

/** Read-only. Jobs stuck "processing" past `STALE_PROCESSING_MS` with no update. */
export async function findStaleProcessingJobs(limit = 100): Promise<StaleJob[]> {
  const staleCutoff = new Date(Date.now() - STALE_PROCESSING_MS);
  return db
    .select({ id: jobs.id, userId: jobs.userId, type: jobs.type, startedAt: jobs.startedAt })
    .from(jobs)
    .where(and(eq(jobs.status, "processing"), lt(jobs.startedAt, staleCutoff)))
    .limit(limit);
}

export interface ReclaimResult {
  found: number;
  requeued: string[];
  failed: string[];
}

/**
 * Publishes a fresh queue message for each stale job found by
 * `findStaleProcessingJobs`. Safe to call anytime and safe to overlap with a
 * processor that's actually still running: `processJob`'s atomic claim is
 * what decides whether a delivery does anything, not this function — a
 * spurious extra delivery for a job that turns out not to be stuck after
 * all just finds nothing claimable and exits (see `claimJobForProcessing`).
 * A job whose id can no longer be enqueued (e.g. Queues is down) is marked
 * failed instead of left stuck.
 */
export async function reclaimStaleJobs(limit = 100): Promise<ReclaimResult> {
  const stale = await findStaleProcessingJobs(limit);
  const result: ReclaimResult = { found: stale.length, requeued: [], failed: [] };

  for (const job of stale) {
    try {
      await enqueueConversionJob(job.id, `reclaim-${Date.now()}`);
      result.requeued.push(job.id);
    } catch (e) {
      console.error(`Reclaim: could not re-enqueue stale job ${job.id}`, e);
      await failJob(job.id, {
        code: "reclaim_failed",
        message: "This job stalled and could not be automatically retried.",
      });
      result.failed.push(job.id);
    }
  }
  return result;
}
