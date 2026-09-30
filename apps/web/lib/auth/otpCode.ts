import { createHmac, randomInt } from "crypto";

/** Shared by every "type this 6-digit code" flow (currently: email change). */

function getPepper(): string {
  const pepper = process.env.TOKEN_PEPPER;
  if (!pepper) throw new Error("TOKEN_PEPPER is not set.");
  return pepper;
}

export function generateNumericCode(digits = 6): string {
  return String(randomInt(0, 10 ** digits)).padStart(digits, "0");
}

export function hashCode(code: string): string {
  return createHmac("sha256", getPepper()).update(code).digest("hex");
}
