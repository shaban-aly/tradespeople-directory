const VIEWS_STORAGE_KEY = "sanay:viewed_craftsmen";
export const VIEW_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 ساعة

/**
 * يفحص هل تمت مشاهدة الفني عبر هذا المتصفح خلال آخر 24 ساعة.
 * إذا كانت المشاهدة فريدة (لم يشاهده أو مر أكثر من 24 ساعة):
 *  - يُسجّل وقت المشاهدة للـ slug في التخزين المحلي
 *  - يُرجع true
 * إذا كان قد شاهده بالفعل خلال آخر 24 ساعة:
 *  - يُرجع false لمنع احتساب مشاهدة مكررة
 */
export function recordUniqueCraftsmanView(
  slug: string,
  now = Date.now(),
): boolean {
  if (typeof window === "undefined" || !slug) return false;

  try {
    const raw = window.localStorage.getItem(VIEWS_STORAGE_KEY);
    const viewed: Record<string, number> = raw ? JSON.parse(raw) : {};

    const lastViewed = viewed[slug];
    if (typeof lastViewed === "number" && now - lastViewed < VIEW_DEDUP_WINDOW_MS) {
      return false;
    }

    // تنظيف السجلات الأقدم من 48 ساعة للحفاظ على مساحة التخزين
    const cutoff = now - 2 * VIEW_DEDUP_WINDOW_MS;
    const cleaned: Record<string, number> = {};
    for (const [s, ts] of Object.entries(viewed)) {
      if (typeof ts === "number" && ts > cutoff) {
        cleaned[s] = ts;
      }
    }

    cleaned[slug] = now;
    window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(cleaned));
    return true;
  } catch {
    return true;
  }
}
