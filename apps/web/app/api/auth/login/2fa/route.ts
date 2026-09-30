import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { twoFactorLoginVerifySchema } from "@/lib/auth/validation";
import { verifyTwoFactorChallenge } from "@/lib/auth/twoFactorChallenge";
import { decryptTotpSecret, verifyTotp } from "@/lib/auth/totp";
import { consumeBackupCode } from "@/lib/auth/backupCodes";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * The second step of a 2FA-gated login (password or Google already
 * verified — see login/route.ts and google/callback/route.ts). Rate
 * limited on top of the code's own tolerance window: a 6-digit TOTP code
 * has only 10^6 values, and the ±30s window in verifyTotp accepts 3 of them
 * at once, so guessing needs to stay expensive regardless.
 */
export async function POST(req: NextRequest) {
  const rate = await checkRateLimit(req, "login-2fa", { limit: 10, windowSeconds: 300 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = twoFactorLoginVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const userId = await verifyTwoFactorChallenge(parsed.data.challenge);
  if (!userId) {
    return NextResponse.json(
      { error: "This sign-in attempt expired. Start over." },
      { status: 400 }
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.totpEnabledAt || !user.totpSecretEnc) {
    return NextResponse.json(
      { error: "This sign-in attempt expired. Start over." },
      { status: 400 }
    );
  }

  const code = parsed.data.code.trim();
  const validTotp = /^\d{6}$/.test(code.replace(/\s+/g, ""))
    ? verifyTotp(decryptTotpSecret(user.totpSecretEnc), code)
    : false;
  const validBackup = validTotp ? false : await consumeBackupCode(user.id, code);

  if (!validTotp && !validBackup) {
    return NextResponse.json({ error: "That code didn't work. Try again." }, { status: 401 });
  }

  await createSession({ id: user.id, email: user.email });

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
