import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { appearanceSchema } from "@/lib/auth/validation";
import { getSessionUser } from "@/lib/auth/session";
import { isValidHex } from "@/lib/appearance";

export const runtime = "nodejs";

/**
 * Saves (or clears) the three-color override. Per-user, unlike the pasted
 * reference design's per-company model — see lib/appearance.ts. Theme mode
 * (Light/Dark) itself never reaches here: it's a per-browser choice, stored
 * only in localStorage by the client.
 */
export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = appearanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { background, accent, text } = parsed.data;

  const values = [background, accent, text];
  const allNull = values.every((v) => v === null);
  const allSet = values.every((v) => v !== null);
  if (!allNull && !allSet) {
    return NextResponse.json({ error: "Set all three colors, or none." }, { status: 400 });
  }
  if (allSet && !values.every((v) => isValidHex(v!))) {
    return NextResponse.json({ error: "Enter valid hex colors, e.g. #E4572E." }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      themeBackground: background,
      themeAccent: accent,
      themeText: text,
      updatedAt: new Date(),
    })
    .where(eq(users.id, sessionUser.id));

  return NextResponse.json({ ok: true });
}
