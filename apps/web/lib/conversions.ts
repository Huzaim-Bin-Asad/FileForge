import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { collections, conversions } from "@/lib/db/schema";
import { convertFile, ConversionError } from "@/lib/converters";
import { completeJob, createJob, failJob, rememberJobForError, startJob } from "@/lib/jobs";
import { recordUsageEvent } from "@/lib/usage";

export { ConversionError } from "@/lib/converters";

interface RunConversionInput {
  userId: string | null;
  collectionId?: string | null;
  conversionType: string;
  buffer: Buffer;
  filename: string;
}

interface RunConversionOutput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  conversionId: string | null;
  /** Null for anonymous conversions, which have no owner to attach a job to. */
  jobId: string | null;
}

/**
 * Job bookkeeping must never break a conversion, so failures here are
 * logged and swallowed — the same stance as recording history below.
 */
async function bestEffort<T>(step: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    console.error(`Job lifecycle: ${step} failed`, e);
    return null;
  }
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

/**
 * Converts a file and, when the caller is identified (session or API key),
 * persists the input's history row plus the converted bytes so it can be
 * re-downloaded later. Anonymous conversions still work, they just aren't saved.
 */
export async function runConversion({
  userId,
  collectionId = null,
  conversionType,
  buffer,
  filename,
}: RunConversionInput): Promise<RunConversionOutput> {
  const jobId = userId
    ? await bestEffort("create", () => createJob({ userId, type: conversionType }))
    : null;
  if (jobId) await bestEffort("start", () => startJob(jobId));
  const startedAt = Date.now();

  let result;
  try {
    result = await convertFile(conversionType, buffer, filename);
  } catch (err) {
    if (jobId) {
      await bestEffort("fail", () =>
        failJob(jobId, { ...describeFailure(err), processingTimeMs: Date.now() - startedAt })
      );
      rememberJobForError(err, jobId);
    }
    throw err;
  }

  let conversionId: string | null = null;
  if (userId) {
    try {
      let validCollectionId: string | null = null;
      if (collectionId) {
        const [owned] = await db
          .select({ id: collections.id })
          .from(collections)
          .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)))
          .limit(1);
        validCollectionId = owned?.id ?? null;
      }
      const [row] = await db
        .insert(conversions)
        .values({
          userId,
          collectionId: validCollectionId,
          sourceFormat: result.sourceFormat,
          targetFormat: result.targetFormat,
          originalFilename: filename,
          fileData: result.buffer,
          mimeType: result.mimeType,
          fileSize: result.buffer.length,
        })
        .returning({ id: conversions.id });
      conversionId = row?.id ?? null;
    } catch (e) {
      console.error("Failed to record conversion history", e);
    }
  }

  if (jobId) {
    const processingTimeMs = Date.now() - startedAt;
    await bestEffort("complete", () => completeJob(jobId, { conversionId, processingTimeMs }));

    // Usage is keyed by (job_id, type), so recording it more than once for
    // this job (e.g. this whole function re-running for the same job,
    // which can't happen today, or a future retry path) is a no-op rather
    // than a double count — see lib/usage.ts. A conversion only reaches
    // here on success, so failed jobs never get a file_processed event.
    await bestEffort("usage:file_processed", () =>
      recordUsageEvent({ userId: userId!, jobId, type: "file_processed", amount: 1 })
    );
    await bestEffort("usage:processing_time", () =>
      recordUsageEvent({
        userId: userId!,
        jobId,
        type: "processing_time",
        amount: processingTimeMs,
      })
    );
    // Total bytes moved for this conversion: the uploaded input plus the
    // converted output. Both are already in memory for this request, so no
    // new storage or measurement was introduced to record this.
    await bestEffort("usage:bandwidth", () =>
      recordUsageEvent({
        userId: userId!,
        jobId,
        type: "bandwidth",
        amount: buffer.length + result.buffer.length,
        metadata: { input_bytes: buffer.length, output_bytes: result.buffer.length },
      })
    );
  }

  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
    conversionId,
    jobId,
  };
}
