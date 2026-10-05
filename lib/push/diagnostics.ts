import { createSupabase } from "@/lib/db/client";
import type { PushFailureReason } from "./client";

/**
 * تقرير تشخيصي عن فشل تسجيل الإشعارات في المتصفح.
 *
 * لماذا يوجد: حتى الآن كانت كل أخطاء العميل تُبتلع بـ`catch { return null }`،
 * وقاعدة البيانات لا تسجّل إلا موافقة FCM على الإرسال. النتيجة أن الفشل بعد
 * الموافقة (permission/SW/token) كان **غير مرئي تماماً** — لا سجل ولا رقم.
 * هذه الدالة تجعله مرئياً، فتصبح القاعدة هي مصدر الحقيقة الوحيد.
 *
 * ضوابط مهمة:
 *   - التوكن لا يُرسل ولا يُخزَّن إطلاقاً (القاعدة تخزّن hash فقط).
 *   - الإرسال `fire-and-forget`: فشل التقرير لا يؤثر على تجربة المستخدم.
 *   - سعة الحجز في القاعدة محدودة، فلا يمكن تحويله إلى مخزن بريد.
 */
export interface PushDiagnosticReport {
  /** سبب الفشل كما صنّفه `lib/push/client.ts` */
  reason: PushFailureReason;
  /** المرحلة التي فشلت: self_heal | manual_enable | retry ... */
  stage: string;
  /** رسالة الخطأ (نصية، مقصوصة عند الخادم) — لا تُرسل مع register_failed */
  detail?: string;
}

const MAX_DETAIL_LENGTH = 300;
const MAX_STAGE_LENGTH = 60;
const DEVICE_ID_KEY = "push:install_id";

/**
 * مُعرّف تثبيت عشوائي يُولَّد مرة واحدة ويُخزن محلياً.
 * غرضه الوحيد: إعطاء الزائر المجهول مفتاح حدّ معدّل مستقر، إذ لا يملك `auth.uid()`.
 * لا يُرسل أي بيانات تعريفية — الخادم يقتطعه بالـ sha256 ولا يخزّنه كما هو.
 */
function readInstallId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const random =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, random);
    return random;
  } catch {
    return "";
  }
}

export async function reportPushDiagnostic(report: PushDiagnosticReport): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const supabase = createSupabase();
    const { error } = await supabase.rpc("report_push_diagnostic", {
      p_reason: report.reason,
      p_stage: report.stage.slice(0, MAX_STAGE_LENGTH),
      p_detail: (report.detail ?? "").slice(0, MAX_DETAIL_LENGTH),
      p_user_agent: navigator.userAgent ?? "",
      p_device_id: readInstallId(),
    });
    return !error;
  } catch {
    // التشخيص لا يجب أن يُفشل شيئاً — ابتلاع مقصود هنا.
    return false;
  }
}