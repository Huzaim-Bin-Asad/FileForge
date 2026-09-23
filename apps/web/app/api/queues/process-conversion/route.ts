import { handleCallback, type ConversionJobMessage } from "@/lib/queue";
import { processJob, type ProcessJobResult } from "@/lib/jobProcessor";

export const runtime = "nodejs";
/**
 * A single conversion's ceiling. Matched by `handleCallback`'s own
 * visibility-timeout auto-extension (it re-extends while the handler is
 * still running, so this — not a fixed lease — is the real bound). 300s is
 * the maximum on Hobby; see the Phase 4 report's converter table for which
 * conversions can actually approach it and what raising this on Pro/
 * Enterprise would buy.
 */
export const maxDuration = 300;

/**
 * The consumer for the asynchronous conversion workflow (Phase 4). Configured
 * as a private `queue/v2beta` trigger in vercel.json — Vercel Queues is the
 * only thing that can invoke this route; it has no public URL and needs no
 * authentication of its own (ownership was already checked when the job was
 * created, in app/api/v1/convert/route.ts). Do not call it directly.
 *
 * All the actual work — claiming, converting, storing, completing/failing,
 * usage — lives in lib/jobProcessor.ts so it stays independently testable
 * without any of this queue plumbing. This handler's only job is translating
 * between the SDK's message contract and that function's contract.
 */
const handler = handleCallback<ConversionJobMessage>(
  async (message, metadata) => {
    const result: ProcessJobResult = await processJob(message.jobId, {
      deliveryCount: metadata.deliveryCount,
    });
    // "skipped" and "failed" are both legitimate, final outcomes for this
    // delivery — returning normally acknowledges the message either way.
    // A retryable failure never reaches here: processJob throws instead
    // (see lib/jobProcessor.ts's retryOrGiveUp), which is what tells
    // handleCallback to schedule a redelivery.
    void result;
  },
  {
    // Exponential backoff, capped, matching the quickstart's own example.
    // This only governs *when* Vercel Queues redelivers; lib/jobProcessor.ts
    // independently decides, from metadata.deliveryCount, when to stop
    // treating a failure as retryable and mark the job permanently failed
    // (MAX_DELIVERY_ATTEMPTS). maxDeliveries below is a hard backstop in
    // case that in-handler logic is ever wrong.
    retry: (_error, metadata) => ({
      afterSeconds: Math.min(300, 2 ** metadata.deliveryCount * 5),
    }),
  }
);

// handleCallback's returned handler accepts `Request | { request: Request }`
// — wider than the `NextRequest | Request` Next's own route-export type
// checking (`next build`) requires. A plain function with that exact
// signature, delegating straight through, satisfies both: `Request` is
// still a valid `CallbackRequestInput`.
export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
