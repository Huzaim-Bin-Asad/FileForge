import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { updateProfileSchema } from "@/lib/auth/validation";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * Updates the signed-in user's own display name. Deliberately narrow: name
 * is the only self-service profile field there's a column for (see
 * lib/db/schema.ts's `users` table — no avatar, bio, or company yet).
 * Email is intentionally not editable here: it's the sign-in identifier and
 * changing it needs its own re-verification flow, not a plain field edit.
 */
export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(users.id, sessionUser.id))
    .returning({ name: users.name });

  return NextResponse.json({ user: { name: updated?.name ?? parsed.data.name } });
}
