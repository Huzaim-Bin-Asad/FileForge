/**
 * Web Crypto equivalents of refreshToken.ts's node:crypto helpers, for use in
 * middleware.ts (Edge runtime, no node:crypto). Both must produce identical
 * output since they hash/compare against the same refresh_tokens rows.
 */

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateOpaqueTokenEdge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashTokenEdge(token: string, pepper: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(token));
  return toHex(signature);
}
