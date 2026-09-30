import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { backupCodes as backupCodesTable, users } from "@/lib/db/schema";
import { twoFactorDisableSchema } from "@/lib/auth/validation";
import { getSessionUser } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { decryptTotpSecret, verifyTotp } from "@/lib/auth/totp";
import { consumeBackupCode } from "@/lib/auth/backupCodes";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * Turning 2FA off needs proof of *something* beyond the session cookie —
 * either the account password, or a still-valid TOTP/backup code. A
 * Google-only account (no password) must use the latter.
 */
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const rate = await checkRateLimit(req, "2fa-disable", { limit: 10, windowSeconds: 300 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = twoFactorDisableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!user.totpEnabledAt || !user.totpSecretEnc) {
    return NextResponse.json({ error: "Two-factor authentication isn't on." }, { status: 400 });
  }

  let verified = false;
  if (parsed.data.password && user.passwordHash) {
    verified = await verifyPassword(parsed.data.password, user.passwordHash);
  }
  if (!verified && parsed.data.code) {
    const secret = decryptTotpSecret(user.totpSecretEnc);
    verified = verifyTotp(secret, parsed.data.code) || (await consumeBackupCode(user.id, parsed.data.code));
  }

  if (!verified) {
    return NextResponse.json(
      { error: "Enter your password or a valid code to turn this off." },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({ totpSecretEnc: null, totpEnabledAt: null })
    .where(eq(users.id, user.id));
  await db.delete(backupCodesTable).where(eq(backupCodesTable.userId, user.id));

  return NextResponse.json({ ok: true });
}
