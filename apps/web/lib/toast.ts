/**
 * A tiny external store for toast notifications, same shape as
 * lib/convert/attemptsStore.ts — a module-level singleton read via
 * useSyncExternalStore, so any client component can call `toast.success(...)`
 * without needing a provider or being inside a particular tree. <Toaster />
 * (components/ui/Toaster.tsx) is the one place that renders whatever's here;
 * mount it once, high up (currently app/(app)/layout.tsx).
 */

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

const DEFAULT_DURATION_MS = 2000;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): ToastItem[] {
  return toasts;
}

/** SSR renders no toasts — there's nothing to show before the client hydrates. */
export function getServerSnapshot(): ToastItem[] {
  return [];
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(variant: ToastVariant, message: string, durationMs: number): number {
  const id = nextId++;
  toasts = [...toasts, { id, variant, message }];
  emit();
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), durationMs);
  }
  return id;
}

export const toast = {
  success: (message: string, durationMs = DEFAULT_DURATION_MS) => push("success", message, durationMs),
  error: (message: string, durationMs = DEFAULT_DURATION_MS) => push("error", message, durationMs),
  info: (message: string, durationMs = DEFAULT_DURATION_MS) => push("info", message, durationMs),
};
