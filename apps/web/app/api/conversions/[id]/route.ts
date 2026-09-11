import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { collections, conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  collectionId: z.string().uuid().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { collectionId } = parsed.data;

  if (collectionId) {
    const [owned] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, user.id)))
      .limit(1);
    if (!owned) {
      return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    }
  }

  const [updated] = await db
    .update(conversions)
    .set({ collectionId })
    .where(and(eq(conversions.id, id), eq(conversions.userId, user.id)))
    .returning({ id: conversions.id });

  if (!updated) {
    return NextResponse.json({ error: "Conversion not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
