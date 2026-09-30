/**
 * A tiny external store for conversions started from this browser tab that
 * the server can't show yet — ones still running, or ones rejected before a
 * job was recorded (e.g. a 413).
 *
 * The durable record of a session's attempts is its `jobs` rows (see
 * lib/convertSessions.ts), rendered server-side by /convert/[sessionId].
 * This store only bridges the gap while a request is in flight, keyed by
 * session so each /convert tab/URL sees just its own work.
 *
 * It's a module-level singleton read via useSyncExternalStore rather than
 * component state, so a conversion keeps its entry if the user navigates
 * away from the page (or to another session) and back before it finishes —
 * the fetch keeps running across a client-side route change, and whichever
 * ConvertPanel mounts next picks the result up. Nothing is persisted: after
 * a reload the server's rows are the whole story.
 */

export interface Attempt {
  /** Client-side id (Date.now()), doubling as the start time. */
  id: number;
  filename: string;
  targetLabel: string;
  status: "processing" | "completed" | "failed";
  message?: string;
  /** The server job for this attempt, once known — used to dedupe against the server's list. */
  jobId?: string | null;
  /** Set when the result was saved to history. */
  conversionId?: string | null;
}

const EMPTY: Attempt[] = [];
const MAX_ATTEMPTS = 20;

let bySession: Record<string, Attempt[]> = {};
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable per session between changes, as useSyncExternalStore requires. */
export function getSessionSnapshot(sessionId: string): Attempt[] {
  return bySession[sessionId] ?? EMPTY;
}

/** SSR has no in-flight conversions — an empty list is the correct render. */
export function getServerSnapshot(): Attempt[] {
  return EMPTY;
}

export function addAttempt(sessionId: string, attempt: Attempt) {
  const list = bySession[sessionId] ?? EMPTY;
  bySession = { ...bySession, [sessionId]: [attempt, ...list].slice(0, MAX_ATTEMPTS) };
  emit();
}

export function patchAttempt(sessionId: string, id: number, patch: Partial<Attempt>) {
  const list = bySession[sessionId];
  if (!list) return;
  bySession = {
    ...bySession,
    [sessionId]: list.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  };
  emit();
}
