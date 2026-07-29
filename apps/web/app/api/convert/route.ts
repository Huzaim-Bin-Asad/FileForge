import { NextRequest, NextResponse } from "next/server";
import { convertFile, ConversionError } from "@/lib/converters";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const conversionType = formData.get("conversionType") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!conversionType) {
    return NextResponse.json({ error: "No conversion type selected." }, { status: 400 });
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
        await db.insert(conversions).values({
          userId: user.id,
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
