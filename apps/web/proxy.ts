import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { refreshTokens, users } from "@/lib/db/schema";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  signAccessToken,
  verifyAccessToken,
} from "@/lib/auth/accessToken";
import { REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_MAX_AGE_SECONDS } from "@/lib/auth/tokenConstants";
import { generateOpaqueTokenEdge, hashTokenEdge } from "@/lib/auth/edgeCrypto";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/history/:path*",
    "/collections/:path*",
    "/convert/:path*",
    "/profile/:path*",
    "/api-keys/:path*",
    "/api/history/:path*",
    "/api/account/:path*",
  ],
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

/**
 * The access token cookie expires after 15 minutes; the refresh cookie lasts
 * 30 days. Before this, an expired access token meant an immediate bounce to
 * /login on the next page load even though the refresh cookie was still
 * good — this rotates it silently first. Can't reuse rotateSession() from
 * lib/auth/session.ts here since it needs next/headers' cookies(), which
 * isn't available in the proxy/middleware runtime.
 */
async function tryRefresh(request: NextRequest): Promise<NextRequest | null> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const pepper = process.env.TOKEN_PEPPER;
  if (!refreshToken || !pepper) return null;

  const tokenHash = await hashTokenEdge(refreshToken, pepper);
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  if (!row) return null;

  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  if (!user) return null;

  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, row.id));

  const newAccessToken = await signAccessToken({ sub: user.id, email: user.email });
  const newRefreshToken = generateOpaqueTokenEdge();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: await hashTokenEdge(newRefreshToken, pepper),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000),
  });

  // Stash the new tokens on the request so the caller can both forward them
  // to this request's render and set them on the response for the browser.
  request.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken);
  return request;
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  if (payload) {
    return NextResponse.next();
  }

  const refreshed = await tryRefresh(request);
  if (refreshed) {
    const res = NextResponse.next({ request: refreshed });
    res.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.cookies.get(ACCESS_TOKEN_COOKIE)!.value, {
      ...cookieOptions,
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
    res.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.cookies.get(REFRESH_TOKEN_COOKIE)!.value, {
      ...cookieOptions,
      // Must match lib/auth/session.ts's createSession — see its comment.
      // A "/api/auth"-scoped cookie is never sent back to this same
      // middleware on the next protected-page request, which is what made
      // this silent refresh a one-time fluke instead of the persistent
      // session it's meant to be.
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
    return res;
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
