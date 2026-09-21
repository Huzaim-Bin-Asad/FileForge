import { randomBytes, createHmac } from "crypto";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { apiKeys } from "@/lib/db/schema";

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

/** Reads the raw key from `Authorization: Bearer <key>` or `x-api-key`. */
export function extractApiKey(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return headers.get("x-api-key");
}

/** Resolves a raw `ff_live_...` key from a request into its owning user, if valid. */
export async function authenticateApiKey(key: string): Promise<{ userId: string } | null> {
  if (!key.startsWith(PREFIX)) return null;

  const [row] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hashApiKey(key)), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) return null;

  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id));

  return { userId: row.userId };
}
