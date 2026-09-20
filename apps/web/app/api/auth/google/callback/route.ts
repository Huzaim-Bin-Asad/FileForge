import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  getGoogleClientConfig,
} from "@/lib/auth/google";
import { createSession } from "@/lib/auth/session";

export const runtime = "nodejs";

function redirectWithError(appUrl: string, message: string) {
  const url = new URL("/login", appUrl);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const config = getGoogleClientConfig();
  if (!config) {
    return redirectWithError(
      process.env.APP_URL ?? "http://localhost:3000",
      "Google sign-in is not configured."
    );
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");

  const storedState = req.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const nextPath = req.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value ?? "/dashboard";

  const clearCookies = (response: NextResponse) => {
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    response.cookies.delete(GOOGLE_OAUTH_NEXT_COOKIE);
    return response;
  };

  if (oauthError) {
    return clearCookies(
      redirectWithError(config.appUrl, "Google sign-in was cancelled.")
    );
  }

  if (!code || !state || !storedState || state !== storedState) {
    return clearCookies(
      redirectWithError(config.appUrl, "Invalid Google sign-in state. Try again.")
    );
  }

  try {
    const googleUser = await exchangeGoogleCode(code);

    if (!googleUser.email_verified) {
      return clearCookies(
        redirectWithError(config.appUrl, "Google email is not verified.")
      );
    }

    const email = googleUser.email.toLowerCase();

    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleUser.sub))
      .limit(1);

    if (!user) {
      const [byEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (byEmail) {
        const [linked] = await db
          .update(users)
          .set({
            googleId: googleUser.sub,
            name: byEmail.name ?? googleUser.name ?? null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, byEmail.id))
          .returning();
        user = linked;
      } else {
        const [created] = await db
          .insert(users)
          .values({
            email,
            googleId: googleUser.sub,
            name: googleUser.name ?? null,
            passwordHash: null,
          })
          .returning();
        user = created;
      }
    }

    await createSession({ id: user.id, email: user.email });

    const destination = nextPath.startsWith("/") ? nextPath : "/dashboard";
    const response = NextResponse.redirect(new URL(destination, config.appUrl));
    return clearCookies(response);
  } catch (err) {
    console.error("Google sign-in callback failed:", err);
    return clearCookies(
      redirectWithError(config.appUrl, "Google sign-in failed. Try again.")
    );
  }
}
