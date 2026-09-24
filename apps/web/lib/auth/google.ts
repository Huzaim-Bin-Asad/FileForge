import { createHash, randomBytes } from "crypto";

export const GOOGLE_OAUTH_STATE_COOKIE = "ff_google_oauth_state";
export const GOOGLE_OAUTH_NEXT_COOKIE = "ff_google_oauth_next";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export function getGoogleClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl.replace(/\/$/, "")}/api/auth/google/callback`,
    appUrl: appUrl.replace(/\/$/, ""),
  };
}

export function generateOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export function buildGoogleAuthUrl(state: string): string | null {
  const config = getGoogleClientConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo> {
  const config = getGoogleClientConfig();
  if (!config) {
    throw new Error("Google OAuth is not configured.");
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    // Logged server-side only, never in the thrown message (which the
    // callback route's catch surfaces, generically, to the client) — but
    // this is exactly what distinguishes "GOOGLE_CLIENT_SECRET is wrong/
    // stale" (Google returns invalid_client) from "redirect_uri isn't
    // registered for this exact URL" (redirect_uri_mismatch) from a dozen
    // other causes, none of which are visible without it.
    const body = await tokenResponse.text().catch(() => "<unreadable>");
    console.error(
      `Google token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
      `redirect_uri=${config.redirectUri}`,
      body
    );
    throw new Error("Failed to exchange Google authorization code.");
  }

  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new Error("Google token response missing access_token.");
  }

  const userResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) {
    const body = await userResponse.text().catch(() => "<unreadable>");
    console.error(`Google userinfo fetch failed: ${userResponse.status} ${userResponse.statusText}`, body);
    throw new Error("Failed to fetch Google user info.");
  }

  const user = (await userResponse.json()) as GoogleUserInfo;
  if (!user.sub || !user.email) {
    throw new Error("Google user info incomplete.");
  }

  return user;
}

/** Hash used only for comparing opaque state cookies if needed later. */
export function hashState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}
