import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, extractApiKey } from "@/lib/apiKeys";
import { ConversionError, resolveConversionHandler } from "@/lib/converters";
import { createAsyncJob } from "@/lib/jobs";
import { buildJobInputBlobPath, deleteBlobsBestEffort, isBlobConfigured, safeExtension, uploadBlob } from "@/lib/blobStorage";
import { enqueueConversionJob } from "@/lib/queue";
import { checkRateLimit } from "@/lib/rateLimit";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";
import { recordUsageEvent } from "@/lib/usage";

export const runtime = "nodejs";
// This request no longer runs a conversion — it validates, uploads the
// input, and hands off to Vercel Queues, all well under a minute even for
// the largest accepted upload (MAX_UPLOAD_BYTES). A generous ceiling in
// case Blob or Queues is briefly slow, not because conversion work happens
// here — that runs in app/api/queues/process-conversion/route.ts.
export const maxDuration = 30;

/**
 * Phase 4: asynchronous. This route validates the request, durably stores
 * its input, and schedules a job — it no longer performs the conversion
 * itself. See lib/jobProcessor.ts for that, lib/queue.ts for how the job
 * reaches it, and the Phase 4 report for why (Vercel Queues, not a
 * fire-and-forget promise or an in-memory queue).
 *
 * `/api/convert` (the session-authenticated web UI) is unaffected — it
 * still runs synchronously, as it did before this phase. See the Phase 4
 * report's UI section for why that route wasn't migrated too.
 */
export async function POST(req: NextRequest) {
  const key = extractApiKey(req.headers);
  if (!key) {
    return NextResponse.json(
      { error: "Missing API key. Pass it as 'Authorization: Bearer <key>' or 'x-api-key'." },
      { status: 401 }
    );
  }

  const auth = await authenticateApiKey(key);
  if (!auth) {
    return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
  }

  const rate = await checkRateLimit(req, "api-convert", { limit: 30, windowSeconds: 60 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  // The asynchronous contract requires a durable place to put the input
  // before this request returns. Blob is that place (see lib/blobStorage.ts)
  // — there is no bytea fallback for it, unlike Phase 3's *output* storage:
  // storing the input in the jobs table isn't an option (Postgres row size,
  // and it's exactly what Phase 4 was asked not to do), and silently running
  // the conversion inline would defeat the point of this phase. So without
  // Blob configured, this endpoint can't honor its contract at all.
  if (!isBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Asynchronous conversion isn't available: Vercel Blob storage isn't configured on this deployment.",
      },
      { status: 503 }
    );
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.` },
      { status: 413 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  const conversionType = formData?.get("conversionType") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!conversionType) {
    return NextResponse.json({ error: "No conversion type selected." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.` },
      { status: 413 }
    );
  }

  // Validated without running anything: an unknown/unsupported/mismatched
  // request must not create a job (or a job's-worth of Blob storage) at
  // all — see lib/converters/registry.ts.
  try {
    resolveConversionHandler(conversionType, file.name);
  } catch (err) {
    if (err instanceof ConversionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  // Recorded once, right before this handler's last exit point, whichever
  // one that turns out to be — see recordApiRequest below. This is the
  // request-level counterpart to the job's own usage (file_processed,
  // processing_time, bandwidth), which lib/jobProcessor.ts records
  // separately, once, when that job first completes.
  //
  // usage_events.job_id has a foreign key to jobs.id, so this can only be
  // attached to a real jobId once the row underneath it is confirmed to
  // exist — recordApiRequest is passed jobId only from the success path
  // below, and null from every failure path that precedes (or itself
  // fails) the job insert.
  async function recordApiRequest(jobIdForUsage: string | null) {
    try {
      await recordUsageEvent({ userId: auth!.userId, jobId: jobIdForUsage, type: "api_request", amount: 1 });
    } catch (e) {
      console.error("Usage: recording api_request failed", e);
    }
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const jobId = randomUUID();
  const inputBlobPath = buildJobInputBlobPath({
    userId: auth.userId,
    jobId,
    extension: safeExtension(file.name),
  });

  try {
    await uploadBlob(inputBlobPath, inputBuffer, file.type);
  } catch (e) {
    console.error(`Failed to upload input for job ${jobId}`, e);
    await recordApiRequest(null);
    return NextResponse.json(
      { error: "Couldn't accept the upload right now. Try again shortly." },
      { status: 502 }
    );
  }

  try {
    await enqueueConversionJob(jobId);
  } catch (e) {
    // The input landed, but nothing will ever process it — clean it up so
    // no row is created and no Blob object is left behind for a job that
    // will never exist.
    console.error(`Failed to schedule job ${jobId}`, e);
    await deleteBlobsBestEffort([inputBlobPath], `failed enqueue ${jobId}`);
    await recordApiRequest(null);
    return NextResponse.json(
      { error: "Couldn't schedule the conversion right now. Try again shortly." },
      { status: 502 }
    );
  }

  try {
    await createAsyncJob({
      id: jobId,
      userId: auth.userId,
      type: conversionType,
      originalFilename: file.name,
      inputBlobPath,
      inputFileSize: inputBuffer.length,
      inputMimeType: file.type || null,
    });
  } catch (e) {
    // The job is already durably scheduled in Queues at this point — it
    // will be delivered to app/api/queues/process-conversion/route.ts,
    // which will find no row for it and safely do nothing (claimJobForProcessing
    // matches no row). That's a job that can never complete, but not a
    // duplicate or a security issue, and it's surfaced as a clear 500 here
    // rather than a false 202.
    console.error(`Failed to record job ${jobId} after scheduling it`, e);
    await recordApiRequest(null);
    return NextResponse.json({ error: "Couldn't record the conversion job." }, { status: 500 });
  }

  await recordApiRequest(jobId);

  return NextResponse.json(
    { job_id: jobId, status: "queued" },
    { status: 202, headers: { "Cache-Control": "no-store" } }
  );
}
