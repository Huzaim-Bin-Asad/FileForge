import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";
import {
  deleteBlobs,
  deleteBlobsBestEffort,
  isBlobConfigured,
  isConversionBlobPathFor,
  listBlobs,
  parseConversionBlobPath,
  userBlobPrefix,
} from "@/lib/blobStorage";

/**
 * Ownership-aware deletion and orphan detection for Blob-backed conversion
 * files. There is no transaction spanning Neon and Blob, so the rules are:
 *
 *  - The database is the source of truth. When a row and its files are both
 *    going away, the row is deleted first: a failure afterwards leaves an
 *    unreferenced Blob (recoverable by the orphan sweep below), never a row
 *    pointing at a file that's gone.
 *  - When only a file is going away (deleteInputBlob / deleteOutputBlob), the
 *    Blob is deleted first and the row's reference cleared after, so a failed
 *    delete leaves the reference intact and the call can simply be retried.
 *  - Legacy `file_data` bytes are never touched here.
 */

type BlobColumn = "input" | "output";

/** Owner-scoped read of one conversion's Blob references. Null if not the caller's. */
async function getOwnedBlobRefs(userId: string, conversionId: string) {
  const [row] = await db
    .select({
      id: conversions.id,
      inputBlobPath: conversions.inputBlobPath,
      outputBlobPath: conversions.outputBlobPath,
    })
    .from(conversions)
    .where(and(eq(conversions.id, conversionId), eq(conversions.userId, userId)))
    .limit(1);
  return row ?? null;
}

async function deleteOneBlob(
  userId: string,
  conversionId: string,
  which: BlobColumn
): Promise<"deleted" | "no_blob" | "not_found"> {
  const row = await getOwnedBlobRefs(userId, conversionId);
  if (!row) return "not_found";

  const path = which === "input" ? row.inputBlobPath : row.outputBlobPath;
  if (!path) return "no_blob";
  // The row is the caller's, but never delete whatever path it holds unless
  // it is exactly this conversion's own path.
  if (!isConversionBlobPathFor(path, { userId, conversionId })) {
    throw new Error(`Refusing to delete Blob outside conversion ${conversionId}: ${path}`);
  }

  await deleteBlobs([path]);
  await db
    .update(conversions)
    .set(which === "input" ? { inputBlobPath: null } : { outputBlobPath: null })
    .where(and(eq(conversions.id, conversionId), eq(conversions.userId, userId)));
  return "deleted";
}

/** Deletes the stored input file. Throws if the Blob service fails; safe to retry. */
export function deleteInputBlob(userId: string, conversionId: string) {
  return deleteOneBlob(userId, conversionId, "input");
}

/** Deletes the stored output file. Throws if the Blob service fails; safe to retry. */
export function deleteOutputBlob(userId: string, conversionId: string) {
  return deleteOneBlob(userId, conversionId, "output");
}

/**
 * Deletes both Blob objects of one of the caller's conversions and clears the
 * references. The row and any legacy `file_data` are left alone.
 */
export async function deleteConversionBlobs(
  userId: string,
  conversionId: string
): Promise<"deleted" | "no_blob" | "not_found"> {
  const input = await deleteOneBlob(userId, conversionId, "input");
  if (input === "not_found") return "not_found";
  const output = await deleteOneBlob(userId, conversionId, "output");
  return input === "deleted" || output === "deleted" ? "deleted" : "no_blob";
}

/**
 * Deletes one of the caller's conversions: the row (and with it any legacy
 * bytea) and then its Blob objects. A Blob failure is logged and reported but
 * does not undo the row deletion — see the rules above.
 */
export async function deleteConversionForUser(
  userId: string,
  conversionId: string
): Promise<{ deleted: false } | { deleted: true; blobsRemoved: boolean }> {
  const row = await getOwnedBlobRefs(userId, conversionId);
  if (!row) return { deleted: false };

  const deleted = await db
    .delete(conversions)
    .where(and(eq(conversions.id, conversionId), eq(conversions.userId, userId)))
    .returning({ id: conversions.id });
  if (deleted.length === 0) return { deleted: false };

  const paths = [row.inputBlobPath, row.outputBlobPath].filter((p): p is string =>
    isConversionBlobPathFor(p, { userId, conversionId })
  );
  const blobsRemoved = await deleteBlobsBestEffort(paths, `conversion ${conversionId}`);
  return { deleted: true, blobsRemoved };
}

/** Every Blob pathname the database holds for this user. Call before deleting the account. */
export async function listUserBlobPaths(userId: string): Promise<string[]> {
  const rows = await db
    .select({ input: conversions.inputBlobPath, output: conversions.outputBlobPath })
    .from(conversions)
    .where(eq(conversions.userId, userId));
  return rows.flatMap((r) => [r.input, r.output]).filter((p): p is string => Boolean(p));
}

/**
 * Removes a user's Blob objects after their account (and, by cascade, every
 * conversion row) is already deleted: the pathnames the database held plus
 * whatever else is stored under the user's own prefix (e.g. leftovers from a
 * failed upload cleanup). Never throws — the account is gone either way —
 * and reports whether everything was removed.
 */
export async function purgeUserBlobs(userId: string, knownPaths: string[]): Promise<boolean> {
  if (!isBlobConfigured()) return knownPaths.length === 0;
  const prefix = userBlobPrefix(userId);
  const paths = new Set(knownPaths.filter((p) => p.startsWith(prefix)));
  try {
    for await (const blob of listBlobs(prefix)) paths.add(blob.pathname);
  } catch (e) {
    console.error(`Blob listing failed while purging user ${userId}`, e);
  }
  return deleteBlobsBestEffort([...paths], `account ${userId}`);
}

// --- Orphan detection -------------------------------------------------------

/** A Blob newer than this is never treated as an orphan: its row may not be committed yet. */
export const DEFAULT_ORPHAN_MIN_AGE_MS = 60 * 60 * 1000;
const DEFAULT_MAX_BLOBS = 5000;
const LOOKUP_BATCH = 200;

export interface OrphanCandidate {
  pathname: string;
  size: number;
  uploadedAt: Date;
  userId: string;
  conversionId: string;
}

export interface OrphanReport {
  /** Objects examined (up to `maxBlobs`). */
  scanned: number;
  /** Skipped because younger than `minAgeMs`. */
  tooRecent: number;
  /** Objects that don't follow the conversion path layout. Reported, never deleted. */
  unrecognized: string[];
  orphans: OrphanCandidate[];
  /** True when the scan stopped at `maxBlobs` before listing everything. */
  truncated: boolean;
}

interface FindOrphansOptions {
  minAgeMs?: number;
  /** Upper bound on objects examined per run. */
  maxBlobs?: number;
  /** Restrict the scan to one user's objects. */
  userId?: string;
}

/**
 * Read-only. Lists Blob objects and returns those that no `conversions` row
 * references by exact pathname (as either its input or output). Conservative:
 * recent objects and anything not shaped like a conversion path are skipped,
 * and a database error aborts the scan rather than guessing.
 */
export async function findOrphanedBlobs({
  minAgeMs = DEFAULT_ORPHAN_MIN_AGE_MS,
  maxBlobs = DEFAULT_MAX_BLOBS,
  userId,
}: FindOrphansOptions = {}): Promise<OrphanReport> {
  const report: OrphanReport = {
    scanned: 0,
    tooRecent: 0,
    unrecognized: [],
    orphans: [],
    truncated: false,
  };
  const cutoff = Date.now() - minAgeMs;
  const candidates: OrphanCandidate[] = [];

  for await (const blob of listBlobs(userId ? userBlobPrefix(userId) : "users/")) {
    if (report.scanned >= maxBlobs) {
      report.truncated = true;
      break;
    }
    report.scanned++;

    const parsed = parseConversionBlobPath(blob.pathname);
    if (!parsed) {
      report.unrecognized.push(blob.pathname);
      continue;
    }
    if (blob.uploadedAt.getTime() > cutoff) {
      report.tooRecent++;
      continue;
    }
    candidates.push({ ...blob, userId: parsed.userId, conversionId: parsed.conversionId });
  }

  for (let i = 0; i < candidates.length; i += LOOKUP_BATCH) {
    const batch = candidates.slice(i, i + LOOKUP_BATCH);
    const paths = batch.map((c) => c.pathname);
    const referenced = await db
      .select({ input: conversions.inputBlobPath, output: conversions.outputBlobPath })
      .from(conversions)
      .where(or(inArray(conversions.inputBlobPath, paths), inArray(conversions.outputBlobPath, paths)));
    const live = new Set(referenced.flatMap((r) => [r.input, r.output]));
    for (const c of batch) if (!live.has(c.pathname)) report.orphans.push(c);
  }

  return report;
}

export interface OrphanCleanupResult {
  dryRun: boolean;
  report: OrphanReport;
  deleted: string[];
  failed: string[];
}

/**
 * Deletes what `findOrphanedBlobs` finds — but only when called with
 * `dryRun: false`. The default is a dry run that just reports candidates, so
 * a scheduled job has to opt in to deletion explicitly.
 */
export async function cleanupOrphanedBlobs({
  dryRun = true,
  ...options
}: FindOrphansOptions & { dryRun?: boolean } = {}): Promise<OrphanCleanupResult> {
  const report = await findOrphanedBlobs(options);
  const result: OrphanCleanupResult = { dryRun, report, deleted: [], failed: [] };

  if (report.orphans.length === 0) return result;
  if (dryRun) {
    console.info(
      `Orphan sweep (dry run): ${report.orphans.length} candidate(s)`,
      report.orphans.map((o) => o.pathname)
    );
    return result;
  }

  for (const orphan of report.orphans) {
    const ok = await deleteBlobsBestEffort([orphan.pathname], "orphan sweep");
    (ok ? result.deleted : result.failed).push(orphan.pathname);
  }
  return result;
}
