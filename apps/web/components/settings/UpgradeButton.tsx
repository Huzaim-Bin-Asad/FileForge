"use client";

import { Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";

/**
 * There's no billing processor wired up yet — this card is a deliberate
 * placeholder, built ahead of the real thing at the user's explicit
 * request (see the surrounding page). It must never claim a purchase
 * succeeded: clicking it says plainly that billing isn't live, rather than
 * silently doing nothing or pretending to upgrade the account.
 */
export default function UpgradeButton() {
  return (
    <button
      type="button"
      onClick={() => toast.info("Billing isn't live yet — check back soon.")}
      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ember px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ember-deep"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Upgrade
    </button>
  );
}
