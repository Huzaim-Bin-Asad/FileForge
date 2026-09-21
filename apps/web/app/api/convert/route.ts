import { NextRequest, NextResponse } from "next/server";
import { runConversion, ConversionError } from "@/lib/conversions";
import { getJobIdForError } from "@/lib/jobs";
import { getSessionUser } from "@/lib/auth/session";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `That file is too large. FileForge accepts files up to ${MAX_UPLOAD_LABEL}.` },
      { status: 413 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const conversionType = formData.get("conversionType") as string | null;
  const collectionId = (formData.get("collectionId") as string | null) || null;

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

  try {
    const user = await getSessionUser();
    const { buffer, filename, mimeType, conversionId, jobId } = await runConversion({
      userId: user?.id ?? null,
      collectionId,
      conversionType,
      buffer: inputBuffer,
      filename: file.name,
      inputMimeType: file.type,
    });

    const headers: Record<string, string> = {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    };
    if (conversionId) headers["X-Conversion-Id"] = conversionId;
    if (jobId) headers["X-Job-Id"] = jobId;

    return new Response(new Uint8Array(buffer), { headers });
  } catch (err) {
    const jobId = getJobIdForError(err);
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
