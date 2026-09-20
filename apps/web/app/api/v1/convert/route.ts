import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, extractApiKey } from "@/lib/apiKeys";
import { runConversion, ConversionError } from "@/lib/conversions";
import { getJobIdForError } from "@/lib/jobs";
import { checkRateLimit } from "@/lib/rateLimit";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";
import { recordUsageEvent } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const key = extractApiKey(req.headers);
  if (!key) {
    return NextResponse.json(
      { error: "Missing API key. Pass it as 'Authorization: Bearer <key>' or 'x-api-key'." },
      { status: 401 }
    );
  }

  const auth = await authenticateApiKey(key);
  if (!auth) {
    return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
  }

  const rate = await checkRateLimit(req, "api-convert", { limit: 30, windowSeconds: 60 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.` },
      { status: 413 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  const conversionType = formData?.get("conversionType") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!conversionType) {
    return NextResponse.json({ error: "No conversion type selected." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.` },
      { status: 413 }
    );
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  // Recorded once we're about to attempt a conversion with a well-formed,
  // authenticated request — i.e. exactly the calls that reach here, whether
  // the conversion itself then succeeds or fails. Requests rejected above
  // (bad/missing key, rate limited, no file/type, too large) never reach
  // this point and so record no api_request event. Tied to this call's job
  // id (once known) so a retry of *this same job* can't double-count it;
  // a client resending the request after a timeout runs a new conversion
  // with a new job id and is a separate real request, so it legitimately
  // records its own event — see lib/usage.ts.
  async function recordApiRequest(jobId: string | null) {
    try {
      await recordUsageEvent({ userId: auth!.userId, jobId, type: "api_request", amount: 1 });
    } catch (e) {
      console.error("Usage: recording api_request failed", e);
    }
  }

  try {
    const { buffer, filename, mimeType, conversionId, jobId } = await runConversion({
      userId: auth.userId,
      conversionType,
      buffer: inputBuffer,
      filename: file.name,
    });

    await recordApiRequest(jobId);

    const headers: Record<string, string> = {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    };
    if (conversionId) headers["X-Conversion-Id"] = conversionId;
    if (jobId) headers["X-Job-Id"] = jobId;

    return new Response(new Uint8Array(buffer), { headers });
  } catch (err) {
    const jobId = getJobIdForError(err);
    await recordApiRequest(jobId);

    const errorHeaders: Record<string, string> = jobId ? { "X-Job-Id": jobId } : {};
    if (err instanceof ConversionError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status, headers: errorHeaders }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Conversion failed." },
      { status: 500, headers: errorHeaders }
    );
  }
}
