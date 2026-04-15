/**
 * Rate limiting via Upstash Redis.
 *
 * Token bucket per verified user ID. Prevents a single user from
 * burning the entire LLM API budget.
 *
 * Tiers:
 * - Free: 60 requests/hour
 * - Pro: 600 requests/hour (check user.plan in Supabase)
 *
 * Falls back to in-memory rate limiting if Upstash is not configured.
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimitFree: Ratelimit | null = null;
let ratelimitPro: Ratelimit | null = null;

// In-memory fallback (resets on deploy/restart)
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function getUpstashLimiters() {
    if (ratelimitFree) return { free: ratelimitFree, pro: ratelimitPro! };

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return null; // Upstash not configured — use memory fallback

    const redis = new Redis({ url, token });

    ratelimitFree = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 h'), // 60 req/hour
        prefix: 'rl:free',
    });

    ratelimitPro = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(600, '1 h'), // 600 req/hour
        prefix: 'rl:pro',
    });

    return { free: ratelimitFree, pro: ratelimitPro };
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

/**
 * Check rate limit for a user.
 * @param userId - Verified Privy user ID
 * @param tier - 'free' or 'pro' (default: 'free')
 */
export async function checkRateLimit(
    userId: string,
    tier: 'free' | 'pro' = 'free',
): Promise<RateLimitResult> {
    const limiters = getUpstashLimiters();

    if (limiters) {
        // Upstash rate limiting (persistent, distributed)
        const limiter = tier === 'pro' ? limiters.pro : limiters.free;
        const result = await limiter.limit(userId);
        return {
            allowed: result.success,
            remaining: result.remaining,
            retryAfterSeconds: result.success ? 0 : Math.ceil((result.reset - Date.now()) / 1000),
        };
    }

    // In-memory fallback
    const maxReqs = tier === 'pro' ? 600 : 60;
    const windowMs = 3600_000; // 1 hour
    const now = Date.now();
    const key = `${tier}:${userId}`;
    const entry = memoryBuckets.get(key);

    if (!entry || now > entry.resetAt) {
        memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxReqs - 1, retryAfterSeconds: 0 };
    }

    if (entry.count >= maxReqs) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
        };
    }

    entry.count++;
    return { allowed: true, remaining: maxReqs - entry.count, retryAfterSeconds: 0 };
}
