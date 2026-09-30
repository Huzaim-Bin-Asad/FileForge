import "server-only";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { conversions, convertSessions, jobs, type JobStatus } from "@/lib/db/schema";
import { getTargetLabel } from "@/lib/converters/catalog";

/**
 * /convert sessions: one per tab, addressed by URL (`/convert/{id}`). See
 * the `convertSessions` table in lib/db/schema.ts for the lifecycle.
 */

/**
 * /api/convert runs inside a single request capped at 60s (its maxDuration),
 * so a job still active well past that was cut off — most often by the tab
 * being reloaded or closed mid-conversion — and will never finish.
 */
const STALE_AFTER = sql.raw(`interval '2 minutes'`);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSessionId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Creates the session on first use, or bumps its `updated_at` when it's
 * already this user's. Returns false when the id belongs to someone else —
 * the conflict update is guarded by owner, so it matches no row and
 * RETURNING comes back empty.
 */
export async function claimSession(userId: string, sessionId: string): Promise<boolean> {
  const rows = await db
    .insert(convertSessions)
    .values({ id: sessionId, userId })
    .onConflictDoUpdate({
      target: convertSessions.id,
      set: { updatedAt: new Date() },
      setWhere: eq(convertSessions.userId, userId),
    })
    .returning({ id: convertSessions.id });
  return rows.length > 0;
}

/** Null when the session hasn't been created yet (no conversion has named it). */
export async function getSessionOwner(sessionId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: convertSessions.userId })
    .from(convertSessions)
    .where(eq(convertSessions.id, sessionId))
    .limit(1);
  return row?.userId ?? null;
}

export interface SessionAttempt {
  jobId: string;
  filename: string;
  targetLabel: string;
  status: JobStatus;
  /** Still queued/processing, but past the point it could ever finish. */
  stale: boolean;
  errorMessage: string | null;
  /** Set only when the result was stored and is still downloadable. */
  conversionId: string | null;
  createdAt: Date;
}

/** Newest first. Scoped by owner as well as session, so a guessed id reads nothing. */
export async function getSessionAttempts(
  userId: string,
  sessionId: string
): Promise<SessionAttempt[]> {
  const rows = await db
    .select({
      jobId: jobs.id,
      filename: jobs.originalFilename,
      type: jobs.type,
      status: jobs.status,
      stale: sql<boolean>`${jobs.status} in ('queued', 'processing') and ${jobs.createdAt} < now() - ${STALE_AFTER}`,
      errorMessage: jobs.errorMessage,
      conversionId: conversions.id,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .leftJoin(conversions, eq(conversions.id, jobs.conversionId))
    .where(and(eq(jobs.sessionId, sessionId), eq(jobs.userId, userId)))
    .orderBy(desc(jobs.createdAt));

  return rows.map((r) => ({
    jobId: r.jobId,
    filename: r.filename ?? "Untitled file",
    targetLabel: getTargetLabel(r.type, r.filename),
    status: r.status,
    stale: r.stale,
    errorMessage: r.errorMessage,
    conversionId: r.conversionId,
    createdAt: r.createdAt,
  }));
}

export interface SessionSummary {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  attempts: number;
  completed: number;
  /** The session's first file — the closest thing it has to a title. */
  firstFilename: string | null;
}

/** Most recently active first. Sessions that were opened but never used don't exist as rows. */
export async function listSessions(
  userId: string,
  { limit, excludeId }: { limit?: number; excludeId?: string } = {}
): Promise<SessionSummary[]> {
  const query = db
    .select({
      id: convertSessions.id,
      createdAt: convertSessions.createdAt,
      updatedAt: convertSessions.updatedAt,
      attempts: sql<number>`count(${jobs.id})::int`,
      completed: sql<number>`count(${jobs.id}) filter (where ${jobs.status} = 'completed')::int`,
      firstFilename: sql<string | null>`(array_agg(${jobs.originalFilename} order by ${jobs.createdAt}))[1]`,
    })
    .from(convertSessions)
    .leftJoin(jobs, eq(jobs.sessionId, convertSessions.id))
    .where(
      excludeId
        ? and(eq(convertSessions.userId, userId), ne(convertSessions.id, excludeId))
        : eq(convertSessions.userId, userId)
    )
    .groupBy(convertSessions.id)
    .orderBy(desc(convertSessions.updatedAt));

  return limit ? query.limit(limit) : query;
}
