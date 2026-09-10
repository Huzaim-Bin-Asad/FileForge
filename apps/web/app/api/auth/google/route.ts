import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  generateOAuthState,
  getGoogleClientConfig,
} from "@/lib/auth/google";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!getGoogleClientConfig()) {
    return NextResponse.json(
      { error: "Google sign-in is not configured." },
      { status: 503 }
    );
  }

  const state = generateOAuthState();
  const authUrl = buildGoogleAuthUrl(state);
  if (!authUrl) {
    return NextResponse.json(
      { error: "Google sign-in is not configured." },
      { status: 503 }
    );
  }

  const next = req.nextUrl.searchParams.get("next");
  const safeNext = next && next.startsWith("/") ? next : "/convert";

  const response = NextResponse.redirect(authUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE, safeNext, cookieOptions);
  return response;
}
