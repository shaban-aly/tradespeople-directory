// معالج تسجيل الخروج الموحد (Unified SignOut Handler)
// يضمن:
// 1. فك تسجيل توكن الإشعارات للجهاز الحالي فقط عبر RPC قبل إنهاء الجلسة.
// 2. تفريغ كاش المفضلة المحلي للمستخدم وفق قواعد AGENTS.md.
// 3. إنهاء جلسة Supabase بشكل نظيف وسريع دون تعليق.

import { createSupabase } from "@/lib/db/client";
import { unregisterPushToken } from "@/lib/push/tokens";
import { writeFavorites } from "@/lib/recommendations";

export interface SignOutOptions {
  skipPushUnregister?: boolean;
  timeoutMs?: number;
}

/**
 * تنفيذ تسجيل الخروج الشامل مع تنظيف توكن الإشعارات للجهاز والكاش المحلي
 */
export async function performSignOut(options?: SignOutOptions): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 2000;

  // 1. فك تسجيل توكن الإشعارات لهذا الجهاز تحديداً (قبل مسح الجلسة لضمان صلاحية auth.uid())
  if (!options?.skipPushUnregister) {
    try {
      await Promise.race([
        unregisterPushToken(),
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    } catch {
      // استمرار الخروج حتى في حال فشل الاتصال أو حدوث استثناء
    }
  }

  // 2. تفريغ كاش المفضلة المحلي للمستخدم منعاً لتسرب بيانات الحساب
  try {
    writeFavorites([]);
  } catch {
    // تجاهل
  }

  // 3. إنهاء الجلسة من Supabase
  try {
    const supabase = createSupabase();
    await supabase.auth.signOut();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Auth] signOut failed:", err);
    }
  }
}
