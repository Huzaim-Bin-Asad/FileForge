import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiKey, extractApiKey } from "@/lib/apiKeys";
import { getJobForUser, serializeJob } from "@/lib/jobs";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const idSchema = z.string().uuid();

// Job state changes as a conversion runs, so it must never be cached.
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest, { params }: Params) {
  const key = extractApiKey(req.headers);
  if (!key) {
    return NextResponse.json(
      { error: "Missing API key. Pass it as 'Authorization: Bearer <key>' or 'x-api-key'." },
      { status: 401, headers: NO_STORE }
    );
  }

  const auth = await authenticateApiKey(key);
  if (!auth) {
    return NextResponse.json(
      { error: "Invalid or revoked API key." },
      { status: 401, headers: NO_STORE }
    );
  }

  const rate = await checkRateLimit(req, "api-jobs", { limit: 120, windowSeconds: 60 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const { id } = await params;

  // A malformed id and someone else's id get the exact same response as a
  // job that doesn't exist, so the endpoint can't be used to probe for jobs.
  const notFound = () =>
    NextResponse.json({ error: "Job not found." }, { status: 404, headers: NO_STORE });

  if (!idSchema.safeParse(id).success) return notFound();

  // Ownership comes from the authenticated key, never from the request.
  const job = await getJobForUser(id, auth.userId);
  if (!job) return notFound();

  return NextResponse.json(serializeJob(job), { headers: NO_STORE });
}
