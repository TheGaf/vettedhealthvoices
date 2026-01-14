type RateLimitOptions = { limit: number; windowMs: number };

const buckets = new Map<string, { count: number; resetAt: number }>();

function getKey(req: Request) {
  // Best-effort: in Next runtime, direct IP is not always available.
  // Use x-forwarded-for + user agent.
  const xf = req.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = req.headers.get('user-agent') ?? 'unknown';
  return `${xf}|${ua}`;
}

export function rateLimit(req: Request, opts: RateLimitOptions) {
  const now = Date.now();
  const key = getKey(req);
  const cur = buckets.get(key);

  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return;
  }

  cur.count += 1;
  if (cur.count > opts.limit) {
    throw new Response('Too Many Requests', { status: 429 });
  }
}
