import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { collections, conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Give the collection a name.").max(60, "Keep the name under 60 characters."),
});

const MAX_COLLECTIONS = 100;

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const rows = await db
    .select({
      id: collections.id,
      name: collections.name,
      createdAt: collections.createdAt,
      itemCount: count(conversions.id),
    })
    .from(collections)
    .leftJoin(conversions, eq(conversions.collectionId, collections.id))
    .where(eq(collections.userId, user.id))
    .groupBy(collections.id)
    .orderBy(desc(collections.createdAt));

  return NextResponse.json({ collections: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const parsed = nameSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [{ value: existing }] = await db
    .select({ value: count() })
    .from(collections)
    .where(eq(collections.userId, user.id));
  if (existing >= MAX_COLLECTIONS) {
    return NextResponse.json(
      { error: "You've reached the collection limit." },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(collections)
    .values({ userId: user.id, name: parsed.data.name })
    .returning();

  return NextResponse.json({ collection: created }, { status: 201 });
}
