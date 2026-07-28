import { NextRequest, NextResponse } from "next/server";
import { convertFile, ConversionError } from "@/lib/converters";

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
    const { buffer, filename, mimeType } = await convertFile(
      conversionType,
      inputBuffer,
      file.name
    );

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
