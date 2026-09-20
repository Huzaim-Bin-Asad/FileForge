import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;

  const [row] = await db
    .select({
      fileData: conversions.fileData,
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
  if (!row.fileData || !row.mimeType) {
    return NextResponse.json(
      { error: "This conversion was recorded before file storage was added and can't be re-downloaded." },
      { status: 410 }
    );
  }

  const base = row.originalFilename.replace(/\.[^.]+$/, "");
  const filename = `${base}.${row.targetFormat}`;

  return new Response(new Uint8Array(row.fileData), {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
