import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { apiKeys } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { generateApiKey, maskApiKey } from "@/lib/apiKeys";

export const runtime = "nodejs";

const MAX_KEYS = 20;

const nameSchema = z.object({
  name: z.string().trim().min(1, "Give the key a name.").max(60, "Keep the name under 60 characters."),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json({
    keys: rows.map((r) => ({ ...r, masked: maskApiKey(r.keyPrefix) })),
  });
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
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id));
  if (existing >= MAX_KEYS) {
    return NextResponse.json({ error: "You've reached the API key limit." }, { status: 400 });
  }

  const { key, keyHash, keyPrefix } = generateApiKey();
  const [created] = await db
    .insert(apiKeys)
    .values({ userId: user.id, name: parsed.data.name, keyHash, keyPrefix })
    .returning({ id: apiKeys.id, name: apiKeys.name, createdAt: apiKeys.createdAt });

  // `key` is returned exactly once — it is not stored in plaintext.
  return NextResponse.json({ key: { ...created, keyPrefix }, secret: key }, { status: 201 });
}
