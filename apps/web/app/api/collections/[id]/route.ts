import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { collections } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Give the collection a name.").max(60, "Keep the name under 60 characters."),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;

  const parsed = nameSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [updated] = await db
    .update(collections)
    .set({ name: parsed.data.name })
    .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }
  return NextResponse.json({ collection: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;

  const [deleted] = await db
    .delete(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
    .returning({ id: collections.id });

  if (!deleted) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
