import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { emailChangeTokens, users } from "@/lib/db/schema";
import { confirmEmailChangeSchema } from "@/lib/auth/validation";
import { getSessionUser } from "@/lib/auth/session";
import { hashCode } from "@/lib/auth/otpCode";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** Step 2: the code just sent to the new address, typed back in here. */
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // A tighter window than the request endpoint — this is the guess-the-code step.
  const rate = await checkRateLimit(req, "email-change-confirm", { limit: 10, windowSeconds: 600 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = confirmEmailChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const codeHash = hashCode(parsed.data.code);
  const [pending] = await db
    .select()
    .from(emailChangeTokens)
    .where(
      and(
        eq(emailChangeTokens.userId, sessionUser.id),
        eq(emailChangeTokens.codeHash, codeHash),
        isNull(emailChangeTokens.usedAt),
        gt(emailChangeTokens.expiresAt, new Date())
      )
    )
    .orderBy(desc(emailChangeTokens.createdAt))
    .limit(1);

  if (!pending) {
    return NextResponse.json({ error: "That code is invalid or has expired." }, { status: 400 });
  }

  // Re-checked here, not just at request time: someone else could have
  // claimed this address in the 15-minute window between the two steps.
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, pending.newEmail))
    .limit(1);
  if (taken) {
    return NextResponse.json(
      { error: "That email was claimed by another account in the meantime." },
      { status: 409 }
    );
  }

  await db
    .update(users)
    .set({ email: pending.newEmail, updatedAt: new Date() })
    .where(eq(users.id, sessionUser.id));
  await db
    .update(emailChangeTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailChangeTokens.id, pending.id));

  return NextResponse.json({ ok: true, email: pending.newEmail });
}
