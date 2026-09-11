import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { convertFile, ConversionError } from "@/lib/converters";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { collections, conversions } from "@/lib/db/schema";
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
    const { buffer, filename, mimeType, sourceFormat, targetFormat } = await convertFile(
      conversionType,
      inputBuffer,
      file.name
    );

    const user = await getSessionUser();
    if (user) {
      try {
        let validCollectionId: string | null = null;
        if (collectionId) {
          const [owned] = await db
            .select({ id: collections.id })
            .from(collections)
            .where(and(eq(collections.id, collectionId), eq(collections.userId, user.id)))
            .limit(1);
          validCollectionId = owned?.id ?? null;
        }
        await db.insert(conversions).values({
          userId: user.id,
          collectionId: validCollectionId,
          sourceFormat,
          targetFormat,
          originalFilename: file.name,
        });
      } catch (e) {
        console.error("Failed to record conversion history", e);
      }
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof ConversionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Conversion failed." }, { status: 500 });
  }
}
