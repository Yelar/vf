import { NextRequest } from 'next/server';

interface RateLimitStore {
  timestamp: number;
  count: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitStore>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > 60000) { // Remove entries older than 1 minute
      rateLimitStore.delete(key);
    }
  }
}, 300000); // 5 minutes

export interface RateLimitConfig {
  limit: number;        // Number of requests allowed
  windowMs: number;     // Time window in milliseconds
  trustProxy?: boolean; // Whether to trust the X-Forwarded-For header
}

export function getRateLimitMiddleware(config: RateLimitConfig) {
  return async function rateLimitMiddleware(req: NextRequest) {
    // Get IP address
    let ip = config.trustProxy
      ? (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip'))
      : req.headers.get('x-real-ip');

    if (!ip) {
      ip = 'unknown';
    }

    // Get the route-specific key
    const pathname = req.nextUrl.pathname;
    const key = `${ip}-${pathname}`;

    // Get or create rate limit info
    const now = Date.now();
    const rateLimit = rateLimitStore.get(key) || { timestamp: now, count: 0 };

    // Reset count if outside window
    if (now - rateLimit.timestamp > config.windowMs) {
      rateLimit.timestamp = now;
      rateLimit.count = 0;
    }

    // Increment count
    rateLimit.count++;

    // Update store
    rateLimitStore.set(key, rateLimit);

    // Check if over limit
    const remaining = Math.max(0, config.limit - rateLimit.count);
    if (rateLimit.count > config.limit) {
      return {
        blocked: true,
        remaining,
        reset: rateLimit.timestamp + config.windowMs
      };
    }

    return {
      blocked: false,
      remaining,
      reset: rateLimit.timestamp + config.windowMs
    };
  };
} 