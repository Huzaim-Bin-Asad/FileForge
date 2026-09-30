import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { emailChangeTokens, users } from "@/lib/db/schema";
import { requestEmailChangeSchema } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import { getSessionUser } from "@/lib/auth/session";
import { generateNumericCode, hashCode } from "@/lib/auth/otpCode";
import { sendEmailChangeCode } from "@/lib/auth/email";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const CODE_TTL_MS = 15 * 60 * 1000;

/**
 * Step 1 of changing your email: send a code to the *new* address. The
 * `users.email` column is untouched until that code is confirmed — see
 * .../confirm/route.ts. Unlike signup/login, this doesn't need to hide
 * whether an email is taken: the caller is already authenticated, so
 * telling them "that email is in use" leaks nothing they couldn't already
 * infer by trying to sign up with it.
 */
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const rate = await checkRateLimit(req, "email-change-request", { limit: 5, windowSeconds: 600 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = requestEmailChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { newEmail, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (newEmail === user.email) {
    return NextResponse.json({ error: "That's already your email." }, { status: 400 });
  }

  // Re-auth gate, same posture as DeleteAccountForm: a hijacked session
  // alone shouldn't be enough to move an account to an attacker-controlled
  // inbox. Google-only accounts have no password to check.
  if (user.passwordHash) {
    if (!password) {
      return NextResponse.json({ error: "Enter your password to continue." }, { status: 400 });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Password is incorrect." }, { status: 400 });
    }
  }

  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, newEmail)).limit(1);
  if (taken) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 400 });
  }

  const code = generateNumericCode();
  await db.insert(emailChangeTokens).values({
    userId: user.id,
    newEmail,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  try {
    await sendEmailChangeCode(newEmail, code);
  } catch (e) {
    console.error("sendEmailChangeCode failed", e);
    return NextResponse.json(
      { error: "Couldn't send the verification code. Try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
