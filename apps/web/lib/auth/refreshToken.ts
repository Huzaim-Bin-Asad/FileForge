import { randomBytes, createHmac } from "crypto";

export { REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_MAX_AGE_SECONDS } from "./tokenConstants";

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
