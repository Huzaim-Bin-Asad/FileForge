import { send as queueSend, handleCallback } from "@vercel/queue";

/**
 * Vercel Queues wiring for the asynchronous conversion workflow (Phase 4).
 * A thin wrapper only so the topic name and message shape live in one place
 * — the SDK's own client (auto-detects its region from `VERCEL_REGION`,
 * auto-authenticates via OIDC on Vercel) is used as-is otherwise.
 *
 * The consumer is app/api/queues/process-conversion/route.ts, wired to this
 * topic via the `queue/v2beta` trigger in vercel.json. It is not reachable
 * over the internet — Vercel invokes it directly — so it needs no
 * authentication of its own; job ownership was already established when
 * the job was created (see app/api/v1/convert/route.ts).
 */

export const CONVERSION_JOBS_TOPIC = "conversion-jobs";

export interface ConversionJobMessage {
  jobId: string;
}

/**
 * Publishes a job id for asynchronous processing.
 *
 * `idempotencyKey` defaults to the bare `jobId`, so a network-level retry of
 * *this specific call* (the caller's fetch failed after the message actually
 * landed) is deduplicated by Vercel Queues itself — belt-and-suspenders on
 * top of the processor's own database claim (lib/jobs.ts's
 * `claimJobForProcessing`), which is what actually prevents duplicate
 * processing when a message is legitimately redelivered (e.g. after a
 * timeout).
 *
 * `reason` distinguishes a deliberate *second* publish for the same job
 * (lib/jobProcessor.ts's `reclaimStaleJobs`, recovering a job whose original
 * message may have been dropped) from that retry case: without it, the
 * reclaim's publish would carry the exact same idempotency key as the
 * original send and could be silently deduplicated away by Vercel Queues
 * for as long as the original message's retention window lasts — exactly
 * defeating the point of reclaiming it. Pass a value unique to this
 * *attempt* (e.g. a timestamp) whenever this is not the first time a
 * message is being published for this job.
 */
export async function enqueueConversionJob(jobId: string, reason?: string): Promise<void> {
  await queueSend(CONVERSION_JOBS_TOPIC, { jobId } satisfies ConversionJobMessage, {
    idempotencyKey: reason ? `${jobId}:${reason}` : jobId,
  });
}

export { handleCallback };
