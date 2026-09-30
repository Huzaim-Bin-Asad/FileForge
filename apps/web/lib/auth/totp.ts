import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";

/**
 * A self-contained TOTP (RFC 6238) implementation over HOTP (RFC 4226), plus
 * at-rest encryption for the secret. No dependency added for this — the
 * algorithm is short and stable, and pulling in a package just to HMAC a
 * counter isn't worth the extra supply-chain surface for a security-
 * sensitive path.
 *
 * Deliberately does NOT render a QR code: an otpauth:// URI embeds the raw
 * secret, and every third-party "paste a URL, get a QR image" service would
 * mean handing that secret to somewhere else's server. Instead, setup shows
 * the base32 secret as text for manual entry into an authenticator app —
 * slightly less convenient than scanning, never leaves this server.
 */

const DIGITS = 6;
const PERIOD_SECONDS = 30;
/** Accept the previous, current, and next 30s window, tolerating minor clock drift. */
const WINDOW_STEPS = 1;

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder > 0) {
    const chunk = bits.slice(bits.length - remainder).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** A fresh 20-byte (160-bit) secret, base32-encoded for both storage and manual entry. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function hotp(secret: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const code =
    (((hmac[offset]! & 0x7f) << 24) |
      ((hmac[offset + 1]! & 0xff) << 16) |
      ((hmac[offset + 2]! & 0xff) << 8) |
      (hmac[offset + 3]! & 0xff)) %
    10 ** DIGITS;
  return code.toString().padStart(DIGITS, "0");
}

/** True if `token` (as typed by the user) matches the secret at the current time, within the tolerance window. */
export function verifyTotp(base32Secret: string, token: string): boolean {
  const cleanToken = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const secret = base32Decode(base32Secret);
  const counter = Math.floor(Date.now() / 1000 / PERIOD_SECONDS);
  for (let delta = -WINDOW_STEPS; delta <= WINDOW_STEPS; delta++) {
    if (hotp(secret, counter + delta) === cleanToken) return true;
  }
  return false;
}

/** For display under "Can't scan? Enter this code" — grouped for readability, e.g. "ABCD EFGH ...". */
export function formatSecretForDisplay(base32Secret: string): string {
  return base32Secret.match(/.{1,4}/g)?.join(" ") ?? base32Secret;
}

export function buildOtpAuthUri(base32Secret: string, email: string): string {
  const label = encodeURIComponent(`FileForge:${email}`);
  const params = new URLSearchParams({
    secret: base32Secret,
    issuer: "FileForge",
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// --- At-rest encryption for the stored secret ---------------------------
// A password is one-way hashed because it never needs to be recovered; a
// TOTP secret must be, to compute the expected code against a login
// attempt. AES-256-GCM keyed off TOKEN_PEPPER is the same "one app secret,
// many derived uses" approach the rest of lib/auth already takes.

function getEncryptionKey(): Buffer {
  const pepper = process.env.TOKEN_PEPPER;
  if (!pepper) throw new Error("TOKEN_PEPPER is not set.");
  return createHash("sha256").update(pepper).update("totp-secret-v1").digest();
}

/** Returns base64 `iv:authTag:ciphertext`, colon-joined. */
export function encryptTotpSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((b) => b.toString("base64")).join(":");
}

export function decryptTotpSecret(encoded: string): string {
  const [ivB64, tagB64, dataB64] = encoded.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed encrypted TOTP secret.");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
