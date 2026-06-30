import type { IncomingMessage } from 'node:http';

type RateBucket = {
  count: number;
  resetAtMs: number;
};

const buckets = new Map<string, RateBucket>();

function readPositiveInt(name: string, fallback: number): number {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export const rateLimitConfig = {
  windowMs: readPositiveInt('NAMI_RATE_LIMIT_WINDOW_MS', 60_000),
  maxRequests: readPositiveInt('NAMI_RATE_LIMIT_MAX_REQUESTS', 60),
} as const;

export function readClientIp(request: IncomingMessage): string {
  const forwarded = request.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  const socketAddress = request.socket.remoteAddress;

  return typeof socketAddress === 'string' && socketAddress.trim() ? socketAddress : 'unknown';
}

export function assertRateLimit(
  request: IncomingMessage,
  routeKey: string,
  maxRequests = rateLimitConfig.maxRequests,
  windowMs = rateLimitConfig.windowMs
): void {
  const key = routeKey + ':' + readClientIp(request);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAtMs) {
    buckets.set(key, { count: 1, resetAtMs: now + windowMs });
    return;
  }

  if (existing.count >= maxRequests) {
    throw new Error('rate_limit_exceeded');
  }

  existing.count += 1;
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}