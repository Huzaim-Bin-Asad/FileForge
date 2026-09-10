import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { generateOpaqueToken, hashToken } from "@/lib/auth/refreshToken";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const rate = await checkRateLimit(req, "forgot-password", { limit: 5, windowSeconds: 300 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Only email/password accounts can reset a password. Google-only accounts skip silently.
  if (user?.passwordHash) {
    const token = generateOpaqueToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = new URL(`/reset-password?token=${token}`, req.nextUrl.origin).toString();
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (e) {
      // Swallowed: a send failure must not turn into a response that differs
      // from the "account doesn't exist" path below and leak which emails
      // are registered.
      console.error("sendPasswordResetEmail failed", e);
    }
  }

  // Always 200, regardless of whether the account exists — avoids leaking which emails are registered.
  return NextResponse.json({ ok: true });
}
