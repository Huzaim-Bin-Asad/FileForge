import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { buildOtpAuthUri, encryptTotpSecret, formatSecretForDisplay, generateTotpSecret } from "@/lib/auth/totp";

export const runtime = "nodejs";

/**
 * Starts 2FA setup: generates a new secret and stores it (encrypted), but
 * doesn't turn 2FA on yet — that happens in .../enable, once a real code
 * from the app proves it was scanned/entered correctly. Calling this again
 * before enabling just replaces the pending secret, so retrying setup is safe.
 */
export async function POST() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (user.totpEnabledAt) {
    return NextResponse.json(
      { error: "Two-factor authentication is already on. Turn it off before setting up a new device." },
      { status: 400 }
    );
  }

  const secret = generateTotpSecret();
  await db
    .update(users)
    .set({ totpSecretEnc: encryptTotpSecret(secret), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return NextResponse.json({
    secret: formatSecretForDisplay(secret),
    otpauthUri: buildOtpAuthUri(secret, user.email),
  });
}
