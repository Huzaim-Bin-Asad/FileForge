import { BlobNotFoundError, del, get, list, put } from "@vercel/blob";

/**
 * Thin, server-only wrapper over Vercel Blob for conversion files. Nothing
 * here is imported by client code and the read/write token
 * (BLOB_READ_WRITE_TOKEN, read by the SDK from the environment) never
 * leaves the server.
 *
 * Every object is stored with `access: "private"`, so there is no public URL
 * to leak: the only way to read a file is `readBlob`, which needs the
 * server's token, and the only caller is the authenticated download route.
 * The Blob store itself must be created as a *private* store in the Vercel
 * dashboard — the SDK rejects a private upload to a public store.
 *
 * Only pathnames are persisted (never URLs). A pathname is a locator, not
 * proof of ownership: callers must look the conversion up by its owner
 * first, then use `isConversionBlobPathFor` as a second check before
 * touching whatever path the row holds.
 */

const ACCESS = "private" as const;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const CONVERSION_BLOB_PATH = new RegExp(
  `^users/(${UUID})/conversions/(${UUID})/(input|output)\\.[a-z0-9]{1,10}$`
);
const UUID_RE = new RegExp(`^${UUID}$`);

export type BlobRole = "input" | "output";

/** Prefix under which every one of a user's Blob objects lives. */
export function userBlobPrefix(userId: string): string {
  assertUuid(userId, "userId");
  return `users/${userId}/`;
}

function assertUuid(value: string, label: string) {
  if (!UUID_RE.test(value)) throw new Error(`Invalid ${label} for Blob path.`);
}

/**
 * Lowercased extension of `name` limited to a short [a-z0-9] token, or
 * `fallback`. Filenames are user-supplied, so nothing else from them may
 * reach a storage path.
 */
export function safeExtension(name: string, fallback = "bin"): string {
  const match = /\.([A-Za-z0-9]{1,10})$/.exec(name);
  return match ? match[1].toLowerCase() : fallback;
}

/**
 * `users/{userId}/conversions/{conversionId}/{input|output}.{ext}`. Built
 * only from validated UUIDs and a sanitised extension: no email, filename
 * or other user-controlled text appears in the path.
 */
export function buildConversionBlobPath({
  userId,
  conversionId,
  role,
  extension,
}: {
  userId: string;
  conversionId: string;
  role: BlobRole;
  extension: string;
}): string {
  assertUuid(userId, "userId");
  assertUuid(conversionId, "conversionId");
  const ext = safeExtension(`x.${extension}`);
  return `users/${userId}/conversions/${conversionId}/${role}.${ext}`;
}

export function parseConversionBlobPath(
  pathname: string
): { userId: string; conversionId: string; role: BlobRole } | null {
  const m = CONVERSION_BLOB_PATH.exec(pathname);
  return m ? { userId: m[1], conversionId: m[2], role: m[3] as BlobRole } : null;
}

/** True only when `pathname` is exactly a Blob path for this user's conversion. */
export function isConversionBlobPathFor(
  pathname: string | null | undefined,
  { userId, conversionId }: { userId: string; conversionId: string }
): pathname is string {
  if (!pathname) return false;
  const parsed = parseConversionBlobPath(pathname);
  return parsed?.userId === userId && parsed.conversionId === conversionId;
}

let warnedUnconfigured = false;

/**
 * Blob storage is used whenever BLOB_READ_WRITE_TOKEN is set. Without it
 * (typically local dev) new conversions fall back to the legacy bytea
 * column, exactly as before Phase 3 — with a one-time warning so a
 * production deploy missing the token is visible in the logs.
 */
export function isBlobConfigured(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  if (!warnedUnconfigured) {
    warnedUnconfigured = true;
    console.warn(
      "BLOB_READ_WRITE_TOKEN is not set; new conversions are being stored in Postgres (legacy bytea)."
    );
  }
  return false;
}

export async function uploadBlob(
  pathname: string,
  body: Buffer,
  contentType: string | null | undefined
): Promise<void> {
  await put(pathname, body, {
    access: ACCESS,
    contentType: contentType || "application/octet-stream",
    // Paths are unique per conversion id; a collision is a bug, not something to overwrite.
    addRandomSuffix: false,
    allowOverwrite: false,
  });
}

/** Streams a private object, or returns null when it doesn't exist. */
export async function readBlob(
  pathname: string
): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null> {
  // useCache: false so a just-deleted object can't still be served from the CDN.
  const result = await get(pathname, { access: ACCESS, useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return { stream: result.stream, size: result.blob.size };
}

/**
 * Idempotent: deleting something that's already gone is not an error.
 * Throws on any other failure so callers can decide what that means.
 */
export async function deleteBlobs(pathnames: string[]): Promise<void> {
  const unique = [...new Set(pathnames)];
  if (unique.length === 0) return;
  try {
    await del(unique);
  } catch (e) {
    if (e instanceof BlobNotFoundError) return;
    throw e;
  }
}

/**
 * For cleanup that must never fail the request that triggered it. Failures
 * are logged with the pathnames, so the leftover objects can be found (and
 * are picked up by the orphan sweep in lib/conversionStorage.ts).
 * Returns whether every object was removed.
 */
export async function deleteBlobsBestEffort(
  pathnames: string[],
  context: string
): Promise<boolean> {
  try {
    await deleteBlobs(pathnames);
    return true;
  } catch (e) {
    console.error(`Blob cleanup failed (${context}); leaving for orphan sweep:`, pathnames, e);
    return false;
  }
}

export interface ListedBlob {
  pathname: string;
  size: number;
  uploadedAt: Date;
}

/** Async-iterates every object under `prefix`, page by page. */
export async function* listBlobs(prefix: string): AsyncGenerator<ListedBlob> {
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const b of page.blobs) {
      yield { pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt };
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
