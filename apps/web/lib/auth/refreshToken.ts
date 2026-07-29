import { randomBytes, createHmac } from "crypto";

export const REFRESH_TOKEN_COOKIE = "ff_refresh";
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

function getPepper() {
  const pepper = process.env.TOKEN_PEPPER;
  if (!pepper) throw new Error("TOKEN_PEPPER is not set.");
  return pepper;
}

export function hashToken(token: string): string {
  return createHmac("sha256", getPepper()).update(token).digest("hex");
}
