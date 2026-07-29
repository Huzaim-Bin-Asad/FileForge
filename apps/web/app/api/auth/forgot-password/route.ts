import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { generateOpaqueToken, hashToken } from "@/lib/auth/refreshToken";
import { sendPasswordResetEmail } from "@/lib/auth/email";

export const runtime = "nodejs";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = generateOpaqueToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = new URL(`/reset-password?token=${token}`, req.nextUrl.origin).toString();
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  // Always 200, regardless of whether the account exists — avoids leaking which emails are registered.
  return NextResponse.json({ ok: true });
}
