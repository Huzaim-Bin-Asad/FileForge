import { SignJWT, jwtVerify } from "jose";

/**
 * The token handed to the client between "password (or Google) verified"
 * and "TOTP/backup code verified" — proof that the first factor already
 * passed, without yet creating a real session. Stateless (no DB row, unlike
 * refresh tokens) since it's short-lived and only ever used once, right
 * back at this same server: a JWT is enough, the same way the access token
 * itself is one.
 */

const CHALLENGE_MAX_AGE_SECONDS = 5 * 60;
const TYPE = "2fa_challenge";

function getSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not set.");
  return new TextEncoder().encode(secret);
}

export async function signTwoFactorChallenge(userId: string): Promise<string> {
  return new SignJWT({ typ: TYPE })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Returns the challenged user's id, or null if the token is missing, expired, or not a 2FA challenge. */
export async function verifyTwoFactorChallenge(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.typ !== TYPE || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}
