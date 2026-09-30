import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { twoFactorEnableSchema } from "@/lib/auth/validation";
import { getSessionUser } from "@/lib/auth/session";
import { decryptTotpSecret, verifyTotp } from "@/lib/auth/totp";
import { issueBackupCodes } from "@/lib/auth/backupCodes";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** Confirms setup with a real code from the authenticator app, then turns 2FA on and issues backup codes. */
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const rate = await checkRateLimit(req, "2fa-enable", { limit: 10, windowSeconds: 300 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = twoFactorEnableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (user.totpEnabledAt) {
    return NextResponse.json({ error: "Two-factor authentication is already on." }, { status: 400 });
  }
  if (!user.totpSecretEnc) {
    return NextResponse.json({ error: "Start setup again before confirming." }, { status: 400 });
  }

  const secret = decryptTotpSecret(user.totpSecretEnc);
  if (!verifyTotp(secret, parsed.data.code)) {
    return NextResponse.json({ error: "That code didn't match. Try again." }, { status: 400 });
  }

  await db.update(users).set({ totpEnabledAt: new Date() }).where(eq(users.id, user.id));
  const backupCodes = await issueBackupCodes(user.id);

  return NextResponse.json({ ok: true, backupCodes });
}
