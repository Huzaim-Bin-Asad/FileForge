import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { isConversionBlobPathFor, readBlob } from "@/lib/blobStorage";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const idSchema = z.string().uuid();

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;

  // A malformed id is just a conversion that doesn't exist.
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Conversion not found." }, { status: 404 });
  }

  // Ownership comes from the session and is part of the query: someone
  // else's conversion is indistinguishable from a missing one, and nothing
  // below (Postgres bytes or a Blob) is read before this succeeds.
  const [row] = await db
    .select({
      id: conversions.id,
      fileData: conversions.fileData,
      outputBlobPath: conversions.outputBlobPath,
      mimeType: conversions.mimeType,
      originalFilename: conversions.originalFilename,
      targetFormat: conversions.targetFormat,
    })
    .from(conversions)
    .where(and(eq(conversions.id, id), eq(conversions.userId, user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Conversion not found." }, { status: 404 });
  }

  const base = row.originalFilename.replace(/\.[^.]+$/, "");
  const filename = `${base}.${row.targetFormat}`;

  // Blob-backed conversion.
  if (row.outputBlobPath) {
    // The stored pathname is only a locator. Serve it only if it is exactly
    // this user's own path for this conversion, whatever the column holds.
    if (
      !row.mimeType ||
      !isConversionBlobPathFor(row.outputBlobPath, { userId: user.id, conversionId: row.id })
    ) {
      console.error(`Conversion ${row.id} has an unusable Blob reference`);
      return NextResponse.json({ error: "This file is no longer available." }, { status: 410 });
    }

    let blob;
    try {
      blob = await readBlob(row.outputBlobPath);
    } catch (e) {
      console.error(`Blob read failed for conversion ${row.id}`, e);
      return NextResponse.json(
        { error: "Couldn't retrieve the file right now. Try again shortly." },
        { status: 502 }
      );
    }
    if (!blob) {
      console.error(`Blob missing for conversion ${row.id}`);
      return NextResponse.json({ error: "This file is no longer available." }, { status: 410 });
    }

    return new Response(blob.stream, {
      headers: {
        "Content-Type": row.mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(blob.size),
        "Cache-Control": "private, no-store",
      },
    });
  }

  // Legacy conversion stored as Postgres bytea — unchanged.
  if (!row.fileData || !row.mimeType) {
    return NextResponse.json(
      { error: "This conversion was recorded before file storage was added and can't be re-downloaded." },
      { status: 410 }
    );
  }

  return new Response(new Uint8Array(row.fileData), {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
