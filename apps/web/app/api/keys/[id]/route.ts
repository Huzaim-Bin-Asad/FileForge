import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { apiKeys } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;

  const [deleted] = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)))
    .returning({ id: apiKeys.id });

  if (!deleted) {
    return NextResponse.json({ error: "Key not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
