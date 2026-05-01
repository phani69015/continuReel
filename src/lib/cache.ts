import { Redis } from "@upstash/redis";

// Initialize Redis client (lazy — only connects if env vars are set)
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || url === "your_redis_url_here") {
    return null; // Cache disabled — no credentials configured
  }

  redis = new Redis({ url, token });
  return redis;
}

const CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Get cached result for a reel ID + window size combo.
 */
export async function getCachedResult(
  reelId: string,
  windowSize: number
): Promise<unknown | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const key = `reel:${reelId}:${windowSize}`;
    const cached = await client.get(key);
    return cached || null;
  } catch {
    // Cache failure should not break the app
    return null;
  }
}

/**
 * Store result in cache with TTL.
 */
export async function setCachedResult(
  reelId: string,
  windowSize: number,
  data: unknown
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `reel:${reelId}:${windowSize}`;
    await client.set(key, JSON.stringify(data), { ex: CACHE_TTL });
  } catch {
    // Cache failure should not break the app
  }
}
