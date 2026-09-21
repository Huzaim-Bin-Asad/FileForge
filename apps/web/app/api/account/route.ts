import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { deleteAccountSchema } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookies, getSessionUser } from "@/lib/auth/session";
import { listUserBlobPaths, purgeUserBlobs } from "@/lib/conversionStorage";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (user.passwordHash) {
    if (!parsed.data.password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }
    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Password is incorrect." }, { status: 400 });
    }
  } else if (parsed.data.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: 'Type DELETE to confirm account deletion.' },
      { status: 400 }
    );
  }

  // The cascade below drops the conversion rows, and with them the only
  // record of their Blob pathnames, so read those first. The rows go first
  // and the files after: a Blob failure then just leaves unreferenced files
  // for the orphan sweep, never a row pointing at a missing one.
  const blobPaths = await listUserBlobPaths(user.id);

  // refreshTokens/passwordResetTokens/conversions all cascade on user delete.
  await db.delete(users).where(eq(users.id, user.id));
  await purgeUserBlobs(user.id, blobPaths);
  await clearSessionCookies();

  return NextResponse.json({ ok: true });
}
