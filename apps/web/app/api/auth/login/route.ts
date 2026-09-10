import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const INVALID_CREDENTIALS = "Invalid email or password.";

export async function POST(req: NextRequest) {
  const rate = await checkRateLimit(req, "login", { limit: 10, windowSeconds: 60 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.passwordHash) {
    return NextResponse.json(
      {
        error: user && !user.passwordHash
          ? "This account uses Google sign-in. Continue with Google instead."
          : INVALID_CREDENTIALS,
      },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  await createSession({ id: user.id, email: user.email });

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
