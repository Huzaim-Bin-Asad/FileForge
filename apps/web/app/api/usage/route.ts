import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getCurrentBillingPeriodUsage, type UsageTotal } from "@/lib/usage";
import type { UsageEventType } from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * The current user's own usage summary for the current calendar month
 * (there's no billing system yet, so that stands in for a "billing
 * period"). Session-authenticated only — internal to the app, not part of
 * the public /api/v1 surface, and exposes aggregates only, never raw
 * usage_events rows. The user comes from the session cookie, never from a
 * request parameter, so there's no way to ask for another user's usage.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { periodStart, periodEnd, usage } = await getCurrentBillingPeriodUsage(user.id);

  const pick = (type: UsageEventType): UsageTotal => usage[type];

  return NextResponse.json({
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    usage: {
      file_processed: pick("file_processed"),
      api_request: pick("api_request"),
      bandwidth: pick("bandwidth"),
      processing_time: pick("processing_time"),
    },
  });
}
