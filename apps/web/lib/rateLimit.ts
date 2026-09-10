import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "UPSTASH_REDIS_REST_URL/TOKEN not set — auth endpoints are running without rate limiting."
  );
}

const limiters = new Map<string, Ratelimit>();

/**
 * Sliding-window rate limit keyed by client IP + `bucket`. Returns
 * `{ success: true }` (no-op) when Upstash isn't configured, so this is
 * safe to call in every environment, including local dev, without setup.
 */
export async function checkRateLimit(
  req: NextRequest,
  bucket: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): Promise<{ success: boolean; retryAfterSeconds?: number }> {
  if (!redis) return { success: true };

  let limiter = limiters.get(bucket);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `fileforge/${bucket}`,
    });
    limiters.set(bucket, limiter);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const result = await limiter.limit(ip);
  if (result.success) return { success: true };

  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return { success: false, retryAfterSeconds };
}
