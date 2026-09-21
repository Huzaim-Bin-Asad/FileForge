import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT)
  );
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  // Explicit columns: a bare select() would pull every row's file_data bytea.
  const items = await db
    .select({
      id: conversions.id,
      userId: conversions.userId,
      collectionId: conversions.collectionId,
      sourceFormat: conversions.sourceFormat,
      targetFormat: conversions.targetFormat,
      originalFilename: conversions.originalFilename,
      mimeType: conversions.mimeType,
      fileSize: conversions.fileSize,
      createdAt: conversions.createdAt,
    })
    .from(conversions)
    .where(eq(conversions.userId, user.id))
    .orderBy(desc(conversions.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ items });
}
