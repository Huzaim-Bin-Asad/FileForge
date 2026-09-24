/**
 * A tiny external store for "conversions attempted in this browser tab".
 *
 * ConvertPanel used to keep this in its own useState, so navigating away
 * from /convert while a conversion was still running (or right as it
 * finished) unmounted the component and threw the list away — the fetch
 * itself kept running (a client-side route change doesn't abort it), but
 * nothing was left mounted to receive the result. Coming back to /convert
 * mounted a fresh component with an empty list, so a job that had in fact
 * completed (or failed) never showed up.
 *
 * Moving the list here — a plain module-level singleton, subscribed to via
 * useSyncExternalStore — fixes that: it isn't tied to any component's
 * lifecycle, so ConvertPanel's handleConvert keeps writing into it
 * regardless of whether a ConvertPanel is currently mounted to see it, and
 * whichever one mounts next reads whatever's already there. Persisting to
 * localStorage extends that across a full page reload too, with one
 * caveat — see readStorage below.
 */

export interface Attempt {
  id: number;
  filename: string;
  targetLabel: string;
  status: "processing" | "completed" | "failed";
  message?: string;
  /** Set when the result was saved to history (signed-in users). */
  conversionId?: string | null;
}

const STORAGE_KEY = "fileforge:convert-attempts";
const MAX_ATTEMPTS = 10;

function readStorage(): Attempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // A page reload tears down the JS that was driving any "processing"
    // entry — its fetch is gone, so nothing will ever resolve it. Only
    // reachable here, at cold module load; a live client-side navigation
    // never re-runs this, so a conversion that's genuinely still running
    // is left untouched.
    return (parsed as Attempt[]).map((a) =>
      a.status === "processing"
        ? { ...a, status: "failed" as const, message: "Interrupted by a page reload." }
        : a
    );
  } catch {
    return [];
  }
}

function writeStorage(next: Attempt[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort — a full or blocked localStorage should never break a conversion.
  }
}

let attempts: Attempt[] = readStorage();
const listeners = new Set<() => void>();

function emit() {
  writeStorage(attempts);
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Attempt[] {
  return attempts;
}

/** SSR has no localStorage and no in-flight conversions — an empty list is the correct render. */
export function getServerSnapshot(): Attempt[] {
  return [];
}

export function addAttempt(attempt: Attempt) {
  attempts = [attempt, ...attempts].slice(0, MAX_ATTEMPTS);
  emit();
}

export function patchAttempt(id: number, patch: Partial<Attempt>) {
  attempts = attempts.map((a) => (a.id === id ? { ...a, ...patch } : a));
  emit();
}
