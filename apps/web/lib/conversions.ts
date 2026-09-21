import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { collections, conversions } from "@/lib/db/schema";
import { convertFile, ConversionError } from "@/lib/converters";
import type { ConvertedFile } from "@/lib/converters/types";
import {
  buildConversionBlobPath,
  deleteBlobsBestEffort,
  isBlobConfigured,
  safeExtension,
  uploadBlob,
} from "@/lib/blobStorage";
import { completeJob, createJob, failJob, rememberJobForError, startJob } from "@/lib/jobs";
import { recordUsageEvent } from "@/lib/usage";

export { ConversionError } from "@/lib/converters";

interface RunConversionInput {
  userId: string | null;
  collectionId?: string | null;
  conversionType: string;
  buffer: Buffer;
  filename: string;
  /** The upload's MIME type as reported by the client; often empty, so optional. */
  inputMimeType?: string | null;
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
 * Stores a successful conversion for `userId` and returns its id.
 *
 * With Blob configured, the input and output go to Vercel Blob and the row
 * keeps only their pathnames, sizes and MIME types (`file_data` stays NULL).
 * Without it, the output falls back to the legacy `file_data` bytea column.
 *
 * Neon and Blob can't be committed together, so the order is chosen to make
 * every partial failure recoverable:
 *  1. Upload both files. If either upload fails, remove whichever landed and
 *     throw — no row exists yet, so nothing references the files.
 *  2. Insert the row. If that fails, remove the just-uploaded files (unless
 *     the row turns out to have committed, or that can't be determined — then
 *     they're left for the orphan sweep in lib/conversionStorage.ts).
 * Callers treat a throw as "the conversion succeeded but wasn't saved".
 */
async function storeConversion({
  userId,
  collectionId,
  filename,
  inputBuffer,
  inputMimeType,
  result,
}: {
  userId: string;
  collectionId: string | null;
  filename: string;
  inputBuffer: Buffer;
  inputMimeType: string | null;
  result: ConvertedFile;
}): Promise<string> {
  let validCollectionId: string | null = null;
  if (collectionId) {
    const [owned] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)))
      .limit(1);
    validCollectionId = owned?.id ?? null;
  }

  const conversionId = randomUUID();
  const base = {
    id: conversionId,
    userId,
    collectionId: validCollectionId,
    sourceFormat: result.sourceFormat,
    targetFormat: result.targetFormat,
    originalFilename: filename,
    mimeType: result.mimeType,
    fileSize: result.buffer.length,
  };

  if (!isBlobConfigured()) {
    await db.insert(conversions).values({ ...base, fileData: result.buffer });
    return conversionId;
  }

  const inputBlobPath = buildConversionBlobPath({
    userId,
    conversionId,
    role: "input",
    extension: safeExtension(filename),
  });
  const outputBlobPath = buildConversionBlobPath({
    userId,
    conversionId,
    role: "output",
    extension: result.targetFormat,
  });

  const uploads = await Promise.allSettled([
    uploadBlob(inputBlobPath, inputBuffer, inputMimeType),
    uploadBlob(outputBlobPath, result.buffer, result.mimeType),
  ]);
  const failed = uploads.find((u): u is PromiseRejectedResult => u.status === "rejected");
  if (failed) {
    await deleteBlobsBestEffort([inputBlobPath, outputBlobPath], `failed upload ${conversionId}`);
    throw failed.reason;
  }

  try {
    await db.insert(conversions).values({
      ...base,
      fileData: null,
      inputBlobPath,
      outputBlobPath,
      inputFileSize: inputBuffer.length,
      inputMimeType,
    });
  } catch (e) {
    // The insert may have committed even though we saw an error (e.g. a
    // dropped response). Only delete the files when we can confirm it didn't.
    const committed = await db
      .select({ id: conversions.id })
      .from(conversions)
      .where(eq(conversions.id, conversionId))
      .limit(1)
      .then((rows) => rows.length > 0)
      .catch(() => null);
    if (committed === false) {
      await deleteBlobsBestEffort([inputBlobPath, outputBlobPath], `failed insert ${conversionId}`);
    } else {
      console.error(
        `Conversion ${conversionId}: insert failed and row state is ${committed === null ? "unknown" : "committed"}; leaving Blob objects in place.`
      );
    }
    throw e;
  }
  return conversionId;
}

/**
 * Converts a file and, when the caller is identified (session or API key),
 * persists the input's history row plus the input and converted files so the
 * result can be re-downloaded later. Anonymous conversions still work, they
 * just aren't saved.
 */
export async function runConversion({
  userId,
  collectionId = null,
  conversionType,
  buffer,
  filename,
  inputMimeType = null,
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
      conversionId = await storeConversion({
        userId,
        collectionId,
        filename,
        inputBuffer: buffer,
        inputMimeType: inputMimeType || null,
        result,
      });
    } catch (e) {
      // The caller still gets the converted file; it just isn't in history
      // (no X-Conversion-Id is returned) and the job completes without one.
      console.error("Failed to store conversion", e);
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
