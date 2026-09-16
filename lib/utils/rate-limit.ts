export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

/**
 * عنوان الـ IP من رؤوس الوكيل. ليس مصدر ثقة بمفرده — يُستخدم فقط كمفتاح
 * ثانوي يعززه معرف الجهاز/الجلسة في مفتاح الـ rate limit.
 */
export function getClientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}