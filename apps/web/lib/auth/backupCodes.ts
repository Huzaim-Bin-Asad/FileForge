import { randomInt, createHmac } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { backupCodes } from "@/lib/db/schema";

const CODE_COUNT = 8;
/** "XXXX-XXXX", digits only — easy to read back off a printed sheet, no ambiguous letters. */
const GROUP_LENGTH = 4;

function getPepper(): string {
  const pepper = process.env.TOKEN_PEPPER;
  if (!pepper) throw new Error("TOKEN_PEPPER is not set.");
  return pepper;
}

function hashCode(code: string): string {
  return createHmac("sha256", getPepper()).update(code.replace(/-/g, "")).digest("hex");
}

function generateOneCode(): string {
  const part = () => String(randomInt(0, 10 ** GROUP_LENGTH)).padStart(GROUP_LENGTH, "0");
  return `${part()}-${part()}`;
}

/**
 * Replaces a user's backup codes with a fresh batch of `CODE_COUNT`,
 * returned in plaintext exactly once — the caller must show these to the
 * user immediately, since only their hashes are kept.
 */
export async function issueBackupCodes(userId: string): Promise<string[]> {
  const codes = Array.from({ length: CODE_COUNT }, generateOneCode);
  await db.delete(backupCodes).where(eq(backupCodes.userId, userId));
  await db.insert(backupCodes).values(
    codes.map((code) => ({ userId, codeHash: hashCode(code) }))
  );
  return codes;
}

/** Consumes one matching, unused backup code. Returns whether it succeeded — each code works exactly once. */
export async function consumeBackupCode(userId: string, code: string): Promise<boolean> {
  const cleaned = code.trim();
  if (!cleaned) return false;
  const codeHash = hashCode(cleaned);

  const [row] = await db
    .select({ id: backupCodes.id })
    .from(backupCodes)
    .where(
      and(
        eq(backupCodes.userId, userId),
        eq(backupCodes.codeHash, codeHash),
        isNull(backupCodes.usedAt)
      )
    )
    .limit(1);
  if (!row) return false;

  await db.update(backupCodes).set({ usedAt: new Date() }).where(eq(backupCodes.id, row.id));
  return true;
}

export async function countRemainingBackupCodes(userId: string): Promise<number> {
  const rows = await db
    .select({ id: backupCodes.id })
    .from(backupCodes)
    .where(and(eq(backupCodes.userId, userId), isNull(backupCodes.usedAt)));
  return rows.length;
}
