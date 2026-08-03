export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

type WindowEntry = {
  timestamps: number[];
  windowMs: number;
  limit: number;
};

const store = new Map<string, WindowEntry>();

function prune(now: number) {
  if (store.size < 2000) return;
  for (const [key, entry] of store) {
    const recent = entry.timestamps.filter((t) => now - t < entry.windowMs);
    if (recent.length === 0) {
      store.delete(key);
    } else {
      entry.timestamps = recent;
    }
  }
}

/**
 * عدّاد نافذة منزلقة في الذاكرة. يكفي كطبقة حماية أولية في بيئة Vercel
 * (دالة واحدة)، ويُستبدل بطبقة Redis/Supabase عند التوسع.
 */
export async function rateLimitConsume(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const now = Date.now();
  prune(now);

  let entry = store.get(key);
  if (!entry || entry.windowMs !== windowMs || entry.limit !== limit) {
    entry = { timestamps: [], windowMs, limit };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    retryAfter: 0,
  };
}

export function getClientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
