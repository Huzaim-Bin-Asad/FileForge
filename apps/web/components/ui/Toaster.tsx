"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  dismissToast,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type ToastItem,
  type ToastVariant,
} from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-success/20 bg-success-soft text-success",
  error: "border-danger/20 bg-danger-soft text-danger",
  info: "border-line bg-surface-elevated text-ink",
};

/** Must match .toast-out's animation-duration in globals.css. */
const EXIT_MS = 180;

interface DisplayItem extends ToastItem {
  leaving?: boolean;
}

/**
 * Renders whatever's in lib/toast.ts's store. Mount once, high up — it's a
 * fixed-position portal, so where it's mounted in the tree doesn't matter,
 * only that it is (currently app/(app)/layout.tsx).
 *
 * The store drops a toast the instant it expires, with no "about to leave"
 * state of its own — animating that departure is purely a rendering concern,
 * so it's handled here: a toast id that disappears from the store is kept
 * around locally for one more animation frame, marked `leaving`, so
 * .toast-out gets a chance to actually play before the DOM node is removed.
 */
export default function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [display, setDisplay] = useState<DisplayItem[]>([]);
  const exitTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  // Derived state, computed during render rather than in an effect — the
  // "adjusting state when a value changes" pattern React itself recommends
  // over an effect for this, since it's plain synchronization with no real
  // side effect involved (unlike the timers below, which are one). `toasts`
  // is a new array only when the store's contents actually changed, so this
  // only runs on a real change, not every render.
  const [syncedToasts, setSyncedToasts] = useState(toasts);
  if (toasts !== syncedToasts) {
    setSyncedToasts(toasts);
    const liveIds = new Set(toasts.map((t) => t.id));
    setDisplay((prev) => {
      const prevIds = new Set(prev.map((t) => t.id));
      // New toasts join at the front — the stack lives at the top of the
      // screen, so the newest one entering should appear above the rest.
      const additions = toasts.filter((t) => !prevIds.has(t.id));
      return [...additions, ...prev].map((t) =>
        liveIds.has(t.id) ? t : { ...t, leaving: true }
      );
    });
  }

  useEffect(() => {
    for (const t of display) {
      if (t.leaving && !exitTimers.current.has(t.id)) {
        const timer = setTimeout(() => {
          setDisplay((prev) => prev.filter((x) => x.id !== t.id));
          exitTimers.current.delete(t.id);
        }, EXIT_MS);
        exitTimers.current.set(t.id, timer);
      }
    }
  }, [display]);

  // Clear any pending exit timers on unmount, so a delayed setDisplay never
  // fires against an unmounted Toaster.
  useEffect(() => {
    const timers = exitTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  // createPortal needs document, which doesn't exist during SSR. Both the
  // server and the client's first render show zero toasts regardless (see
  // getServerSnapshot), so this can't cause a hydration mismatch — same
  // guard components/ui/Modal.tsx uses.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-6 sm:items-end sm:px-6">
      {display.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg",
              t.leaving ? "toast-out" : "toast-in",
              STYLES[t.variant]
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <p className="min-w-0 flex-1">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
              className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
