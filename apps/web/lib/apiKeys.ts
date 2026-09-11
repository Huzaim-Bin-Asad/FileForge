import { randomBytes, createHmac } from "crypto";

const PREFIX = "ff_live_";

function getPepper() {
  const pepper = process.env.TOKEN_PEPPER;
  if (!pepper) throw new Error("TOKEN_PEPPER is not set.");
  return pepper;
}

/** Returns the full key (shown to the user once), its hash, and a display prefix. */
export function generateApiKey() {
  const secret = randomBytes(24).toString("base64url");
  const key = `${PREFIX}${secret}`;
  return {
    key,
    keyHash: hashApiKey(key),
    keyPrefix: `${PREFIX}${secret.slice(0, 6)}`,
  };
}

export function hashApiKey(key: string): string {
  return createHmac("sha256", getPepper()).update(key).digest("hex");
}

/** "ff_live_a1b2c3••••••••" for list views. */
export function maskApiKey(keyPrefix: string): string {
  return `${keyPrefix}${"•".repeat(10)}`;
}
