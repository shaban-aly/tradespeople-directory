import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { RateLimitResult } from "@/lib/utils/rate-limit";

/**
 * استهلاك نافذة معدل عبر المخزن المشترك (rate_limits + RPC SECURITY DEFINER)
 * بدل Map ذاكرة العملية — يُستدعى من الراوات العامة (sign-upload/stats).
 * عند فشل القاعدة يفشل الطلب مفتوحاً (allow) — rate limit طبقة throttle لا
 * حماية حاسمة، ولا تُكشف بيانات من الـ RPC.
 */
export async function consumeRateLimit(
  supabase: Pick<SupabaseClient<Database>, "rpc">,
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc("rate_limit_consume", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
  });
  if (error || !data || typeof data !== "object") {
    return { allowed: true, remaining: 0, retryAfter: 0 };
  }
  const result = data as { allowed?: unknown; remaining?: unknown; retry_after?: unknown };
  return {
    allowed: result.allowed !== false,
    remaining: Math.max(0, Number(result.remaining ?? 0)),
    retryAfter: Math.max(0, Number(result.retry_after ?? 0)),
  };
}