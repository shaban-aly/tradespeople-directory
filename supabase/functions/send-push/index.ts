// @ts-nocheck — هذا الملف يعمل في بيئة Deno (Edge Function) وليس Node.js.
// أخطاء IDE المتعلقة بـ Deno أو npm: imports هي وهمية ولا تؤثر على النشر.
// send-push — Edge Function لتوزيع إشعارات FCM.
//
// التدفق الأساسي (مسجلون) — عبر صندوق الصادر (outbox):
//   trigger enqueue_push_notification → صف في notification_push_outbox داخل
//   نفس المعاملة + صف لكل device في notification_push_deliveries → pg_net →
//   هذا الـ HTTP handler (outbox_id + lease_id) → claim_push_outbox →
//   FCM HTTP v1 → record_push_delivery_result لكل جهاز على حدة →
//   finish_push_outbox. معيار اكتمال الصف في القاعدة: لا delivery معلّقة.
//
// حارس الـlease (migration 20261004082118):
//   كل صف في processing يحمل lease_id؛ claim_push_outbox والإرسال الفوري
//   يولّدان lease جديداً، وكل UPDATE في finish/record يشترط مطابقته. فمحاولة
//   متأخرة (سقط worker ثم استُعيد صفه بعد 10 دقائق) تُتجاهل ولا تكتب شيئاً.
//   لذلك هذا المسار يرفض الطلب بلا lease_id بدل العمل بلا حارس.
//
// لكل جهاز على حدة (migration 20261004082139):
//   فشل جهاز لا يعيد إرسال جهاز نجح، وbackoff مستقل لكل device delivery،
//   ولا يُحذف توكن من هنا (القاعدة تحسم invalid وتحذفه داخل نفس الـlease).
//
// التدفق الثاني (زوار مجهولون):
//   trigger notify_category_subscribers_on_publish (migration 0017) → pg_net →
//   هذا الـ HTTP handler (anonymous_outbox_id) → يقرأ anonymous_push_outbox →
//   يجلب التوكنات المهتمة بالتصنيف من anonymous_push_subscriptions → FCM.
//
// وضع العامل (worker mode): استدعاء بدون body مع x-push-secret صحيح
//   → claim_push_outbox يعالج دفعة من الصفوف المعلّقة ويعيد جدولة ما لم يُحال إليه.
//
// المتغيرات المطلوبة (function secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (تُحقن تلقائياً)
//   PUSH_FUNCTION_SECRET                     (مطابق لـ push_secret في push_settings)
//   FCM_SERVICE_ACCOUNT                      (JSON ملف خدمة Firebase Messaging)

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  assertServiceAccount,
  buildFcmMessage,
  defaultLinkResolver,
  fcmSendEndpoint,
  isSafeInternalLink,
  isUnregisteredStatus,
  signJwt,
} from "./lib.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PUSH_FUNCTION_SECRET = Deno.env.get("PUSH_FUNCTION_SECRET") ?? "";
const FCM_SERVICE_ACCOUNT = Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "";

interface FcmAccessToken {
  token: string;
  expiresAt: number;
}

let fcmTokenCache: FcmAccessToken | null = null;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** OAuth2 access token لـ FCM — مع كاش حتى انتهاء الصلاحية (ساعة) */
async function getFcmAccessToken(serviceAccountJson: string): Promise<string> {
  const cached = fcmTokenCache;
  if (cached && cached.expiresAt > nowSeconds() + 60) {
    return cached.token;
  }

  const account = assertServiceAccount(serviceAccountJson);
  const jwt = await signJwt({}, account.private_key, account.client_email, nowSeconds());
  const res = await fetch(account.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`FCM token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("FCM token exchange: no access_token");
  }
  fcmTokenCache = {
    token: data.access_token,
    expiresAt: nowSeconds() + (data.expires_in ?? 3600),
  };
  return fcmTokenCache.token;
}

interface SendResult {
  sent: number;
  failed: number;
  removedTokens: number;
  notifiedTokens: number;
  retried: number;
}

interface DueDelivery {
  token_id: string;
  attempts: number;
}

function emptySendResult(): SendResult {
  return { sent: 0, failed: 0, removedTokens: 0, notifiedTokens: 0, retried: 0 };
}

// ---------------------------------------------------------------------------
// المسار الأول: مسجل — صف واحد من notification_push_outbox
// ---------------------------------------------------------------------------

/**
 * يرسل لكل جهاز على حدة ويسجّل النتيجة في notification_push_deliveries.
 *
 * القاعدة (migration 20261004082139): كل device delivery مستقل له عدّاد
 * و backoff خاص؛ لأن فشل جهاز لا يعيد إرسال الأجهزة التي نجحت، ولا
 * يمنع جهازاً آخر من المحاولة. معيار اكتمال الصف يحسمه finish_push_outbox
 * في القاعدة، لا هذا الملف.
 */
async function deliverToDevices(
  supabase: ReturnType<typeof createClient>,
  outboxId: string,
  leaseId: string,
  title: string,
  body: string,
  metadata: Record<string, unknown>,
  notificationId: string,
  accessToken: string,
  account: ReturnType<typeof assertServiceAccount>,
): Promise<SendResult> {
  const result = emptySendResult();

  const { data: deliveries, error: delivErr } = await supabase
    .from("notification_push_deliveries")
    .select("token_id, attempts")
    .eq("outbox_id", outboxId)
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString());

  if (delivErr) {
    console.error("notification_push_deliveries select error", delivErr.message);
    return result;
  }
  if (!deliveries || deliveries.length === 0) return result;

  const tokenIds = deliveries.map((d: DueDelivery) => d.token_id);
  const { data: tokens, error: tokensErr } = await supabase
    .from("user_push_tokens")
    .select("id, token")
    .in("id", tokenIds);
  if (tokensErr) {
    console.error("user_push_tokens select error", tokensErr.message);
    return result;
  }

  const endpoint = fcmSendEndpoint(account.project_id);
  // مسار داخلي نسبي — بلا مضيف: المستضيف يبنيه جهاز المستخدم.
  const link = defaultLinkResolver(metadata);
  result.notifiedTokens = tokens?.length ?? 0;

  for (const row of tokens ?? []) {
    const delivery = deliveries.find((d: DueDelivery) => d.token_id === row.id);
    if (!delivery) continue;

    const message = buildFcmMessage(row.token, title, body, link, notificationId);
    let ok = false;
    let invalid = false;
    let errorText: string | null = null;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message),
      });

      if (res.ok) {
        ok = true;
        result.sent += 1;
      } else if (isUnregisteredStatus(res.status)) {
        // توكن معطّل ⇒ القاعدة تحسمه كـinvalid وتحذفه (لا حذف من هنا)
        invalid = true;
        result.removedTokens += 1;
      } else {
        errorText = `fcm status ${res.status}`;
        result.failed += 1;
      }
    } catch (err) {
      errorText = (err as Error).message.slice(0, 300);
      result.failed += 1;
    }

    // النتيجة تُسجَّل لكل جهاز على حدة — القاعدة تطبّق backoff على هذا
    // الجهاز وحده، وتشترط lease_id فأي محاولة أخرى تُتجاهل.
    const { error: recErr } = await supabase.rpc("record_push_delivery_result", {
      p_outbox_id: outboxId,
      p_lease_id: leaseId,
      p_token_id: row.id,
      p_ok: ok,
      p_invalid: invalid,
      p_error_text: errorText,
    });
    if (recErr) {
      console.error("record_push_delivery_result error", recErr.message);
      continue;
    }
    if (!ok && !invalid) result.retried += 1;
  }

  return result;
}

async function handleRegisteredOutboxRow(
  supabase: ReturnType<typeof createClient>,
  outboxId: string,
  leaseId: string,
  accessToken: string,
  account: ReturnType<typeof assertServiceAccount>,
): Promise<SendResult> {
  const result = emptySendResult();

  const { data: outbox, error: outboxErr } = await supabase
    .from("notification_push_outbox")
    .select("id, notification_id, recipient_id, status, lease_id")
    .eq("id", outboxId)
    .maybeSingle();

  if (outboxErr || !outbox) {
    console.error("notification_push_outbox select error", outboxErr?.message);
    return result;
  }

  // حارس الـlease: صف حجزته محاولة أحدث ⇒ تجاهُل صامت بلا أي كتابة.
  // هذا هو ما يمنع المحاولة المتأخرة من إنهاء صف أنهته محاولة أخرى.
  if (outbox.status !== "processing" || outbox.lease_id !== leaseId) {
    console.warn(
      `outbox ${outboxId}: stale lease (status=${outbox.status}, lease_match=${outbox.lease_id === leaseId}) — ignored`,
    );
    return result;
  }

  const { data: notification, error: notifError } = await supabase
    .from("notifications")
    .select("id, recipient_id, title, body, metadata")
    .eq("id", outbox.notification_id)
    .maybeSingle();

  if (notifError || !notification) {
    // الإشعار لم يعد موجوداً (حُذف) ⇒ لا معنى لإعادة المحاولة على أي جهاز.
    // نحسم الـdeliveries المعلّقة exhausted (لا invalid: توكنات الأجهزة سليمة،
    // الهدف فقط اختفى) فيُعتبر الصف مكتملاً بلا إعادة محاولة.
    await supabase
      .from("notification_push_deliveries")
      .update({
        status: "exhausted",
        last_error: "notification deleted",
      })
      .eq("outbox_id", outboxId)
      .eq("status", "pending");

    await supabase.rpc("finish_push_outbox", {
      p_outbox_id: outboxId,
      p_lease_id: leaseId,
      p_error_text: "notification deleted",
    });
    return result;
  }

  const metadata = (notification.metadata ?? {}) as Record<string, unknown>;
  const sendResult = await deliverToDevices(
    supabase,
    outboxId,
    leaseId,
    notification.title,
    notification.body,
    metadata,
    String(notification.id),
    accessToken,
    account,
  );

  // p_error_text تشخيصي فقط: القاعدة هي التي تقرر sent أو pending بناءً
  // على وجود deliveries معلّقة. نمرّر ملخّصاً لا قيمة p_sent.
  const summary =
    sendResult.failed > 0 || sendResult.retried > 0
      ? `devices: ${sendResult.sent} sent, ${sendResult.failed} failed, ${sendResult.retried} retrying, ${sendResult.removedTokens} invalid`
      : null;

  await supabase.rpc("finish_push_outbox", {
    p_outbox_id: outboxId,
    p_lease_id: leaseId,
    p_error_text: summary,
  });

  return sendResult;
}

/**
 * وضع العامل: يسترد الصفوف التي لم يحلّها pg_net (فشل شبكة، سقوط الدالة، أو
 * backoff بعد محاولات فاشلة) ويعالجها دفعةً دفعة.
 */
async function runOutboxWorker(
  supabase: ReturnType<typeof createClient>,
  accessToken: string,
  account: ReturnType<typeof assertServiceAccount>,
  limit: number,
): Promise<{ processed: number; sent: number; failed: number }> {
  const { data: rows, error } = await supabase.rpc("claim_push_outbox", {
    p_limit: limit,
  });

  if (error || !rows || rows.length === 0) {
    if (error) console.error("claim_push_outbox error", error.message);
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows as Array<{ id: string; lease_id: string }>) {
    // الحجز الذي أعادته claim_push_outbox هو ما يثبت ملكيتنا للصف
    if (!row.lease_id) {
      console.error(`outbox ${row.id}: claimed without lease_id — skipping`);
      continue;
    }
    try {
      const result = await handleRegisteredOutboxRow(
        supabase,
        row.id,
        row.lease_id,
        accessToken,
        account,
      );
      sent += result.sent;
      failed += result.failed;
    } catch (err) {
      // استثناء في معالجة صف واحد يُسجَّل كفشل صراحة بدل ابتلاعه
      await supabase.rpc("finish_push_outbox", {
        p_outbox_id: row.id,
        p_lease_id: row.lease_id,
        p_error_text: (err as Error).message.slice(0, 500),
      });
      failed += 1;
    }
  }

  return { processed: rows.length, sent, failed };
}

// ---------------------------------------------------------------------------
// المسار الثاني: زوار مجهولون — anonymous_outbox_id
// ---------------------------------------------------------------------------
// يستخدم نفس آلة الحجز (lease) لمسار المسجَّلين منذ 20261005085902. قبلها كان
// هذا المسار "trial and error": محاولة واحدة بمهلة 5 ثوانٍ ثم حالة نهائية
// `skipped`/`failed` بلا cron يلتقطها ⇒ أي فشل عابر كان ضياعاً نهائياً لـ 110
// مشتركاً. الفارق الدلالي الوحيد: لا يوجد جدول deliveries لكل جهاز، فالنجاح
// الجزئي حالة نهائية (إعادة الإرسال تكرّر إشعاراً وصل فعلاً).
/**
 * ينفّذ `worker` على كل عناصر `items` بترتيب، بعدد متزامن محدود بـ`limit`.
 *
 * السبب: يبلغ المسار المجهول 110 مشتركاً وقت الإرسال. بالتسلسل، 110 طلب
 * FCM بمهلة 5 ثوانٍ لكل واحد = 550 ثانية، أي أطول بكثير من مهلة cron (30s)
 * والدالة (net.http_post بـ5s) ⇒ تسقط المحاولة في منتصفها. المتوازي المحدود
 * يخفض الزمن إلى ~11 ثانية مع إبقاء الضغط على FCM معقولاً.
 */
async function forEachLimited<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const size = Math.max(1, Math.min(limit, items.length));
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (;;) {
        const index = cursor++;
        if (index >= items.length) return;
        // `worker` تبتلع أخطاءها بنفسها، فلا رفض هنا يوقف بقية العناصر.
        await worker(items[index]);
      }
    }),
  );
}

/** توازي الإرسال للمشتركين المجهولين: 10 طلبات FCM في آن واحد. */
const ANONYMOUS_SEND_CONCURRENCY = 10;

async function handleAnonymousOutbox(
  supabase: ReturnType<typeof createClient>,
  outboxId: string,
  leaseId: string,
  accessToken: string,
  account: ReturnType<typeof assertServiceAccount>,
): Promise<SendResult> {
  const result = emptySendResult();

  const { data: outbox, error: outboxErr } = await supabase
    .from("anonymous_push_outbox")
    .select("id, category_slug, title, body, url, status, lease_id")
    .eq("id", outboxId)
    .maybeSingle();

  if (outboxErr || !outbox) {
    console.error("anonymous_push_outbox select error", outboxErr?.message);
    // نعالج السطر عبر finish بدل العودة صامتة: finish يتحقق من الـlease داخلياً،
    // فإما يثبت أننا نحوز الصف ويعيده بتراجع، أو يتجاهل لغيرنا. بدونه يبقى الصف
    // processing عشر دقائق كاملة قبل أن يلتقطه cron.
    const { error: finErr } = await supabase.rpc("finish_anonymous_push_outbox", {
      p_outbox_id: outboxId,
      p_lease_id: leaseId,
      p_error_text: `outbox select error: ${outboxErr?.message ?? "row not found"}`,
    });
    if (finErr) {
      console.error("finish_anonymous_push_outbox failed", finErr.message);
    }
    return result;
  }

  // لا نُعيد الإرسال إن أُرسل أو أُلغي مسبقاً. أو تم التقاطه بواسطة Cron (Race condition).
  if (outbox.status !== "processing" || outbox.lease_id !== leaseId) {
    console.warn(
      `anonymous outbox ${outboxId}: stale lease (status=${outbox.status}, lease_match=${outbox.lease_id === leaseId}) — ignored`,
    );
    return result;
  }

  const { data: subscriptions, error: subsErr } = await supabase
    .from("anonymous_push_subscriptions")
    .select("id, token")
    .eq("status", "active")
    .contains("interests", [outbox.category_slug]);

  if (subsErr) {
    // خطأ قراءة عابر (شبكة أو قاعدة) ليس حالة نهائية، ولذلك نعيد الصف إلى
    // pending بتراجع أسّي عبر finish بلا p_terminal. كان هذا يسلك مسار "لا
    // مشتركين" فيضع skipped نهائياً، فيخسر 110 مشتركاً إلى الأبد بسبب تعطّل
    // لحظي في القاعدة.
    const { error: finErr } = await supabase.rpc("finish_anonymous_push_outbox", {
      p_outbox_id: outboxId,
      p_lease_id: leaseId,
      p_error_text: `subscriptions select error: ${subsErr.message}`,
    });
    if (finErr) {
      console.error("finish_anonymous_push_outbox failed", finErr.message);
    }
    return result;
  }

  // لا مشتركين مطابقين ⇒ حالة نهائية `skipped`: فلتر الاهتمامات لن يتغيّر
  // بإعادة المحاولة. هذا هو التمييز الحاسم بين "لا يوجد من يستقبل" (نهائي)
  // و"تعذّر معرفة من يستقبل" (إعادة محاولة) في السطر أعلاه.
  if (!subscriptions || subscriptions.length === 0) {
    await supabase.rpc("finish_anonymous_push_outbox", {
      p_outbox_id: outboxId,
      p_lease_id: leaseId,
      p_terminal: "skipped",
      p_error_text: "no matching active subscriptions",
    });
    return result;
  }

  const endpoint = fcmSendEndpoint(account.project_id);
  // مسار داخلي نسبي يعاد التحقق منه هنا أصلاً (طبقة دفاع ثانية: القاعدة
  // تمنع التخزين غير الآمن وهذا يمنع الإرسال) — بلا مضيف داخل الرسالة.
  const link = isSafeInternalLink(outbox.url) ? outbox.url : undefined;

  result.notifiedTokens = subscriptions.length;
  const staleIds: string[] = [];
  let lastError = "";

  await forEachLimited(subscriptions, ANONYMOUS_SEND_CONCURRENCY, async (sub) => {
    const message = buildFcmMessage(sub.token, outbox.title, outbox.body, link, outbox.id);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        result.sent += 1;
      } else if (isUnregisteredStatus(res.status)) {
        staleIds.push(sub.id);
        result.removedTokens += 1;
      } else {
        result.failed += 1;
        lastError = `fcm ${res.status}`;
      }
    } catch (err) {
      result.failed += 1;
      lastError = (err as Error).message.slice(0, 300);
    }
  });

  if (staleIds.length > 0) {
    await supabase
      .from("anonymous_push_subscriptions")
      .update({ status: "revoked" })
      .in("id", staleIds);
  }

  // كل التوكنات غير صالحة ولم يبقَ منها هدف ⇒ لا معنى لإعادة
  // محاولة القصة: finish كان سيعيدها إلى pending ما لم نخبره أنها نهائية، فتكرّر
  // التوليد عشر مرات ثم failed. نطلب `skipped` صراحةً في هذه الحالة وحدها.
  const allInvalid =
    result.sent === 0 && result.failed === 0 && result.removedTokens > 0;

  // `finish` يقرّر بنفسه: sent | partial-sent | requeue-with-backoff | failed.
  const { error: finishErr } = await supabase.rpc("finish_anonymous_push_outbox", {
    p_outbox_id: outboxId,
    p_lease_id: leaseId,
    p_sent: result.sent,
    p_failed: result.failed,
    p_terminal: allInvalid ? "skipped" : null,
    p_error_text: lastError,
  });
  if (finishErr) {
    // فشل الإنهاء ⇒ يبقى processing، وcron يستعيده بعد 10 دقائق
    // (نفس سلوك drain للمسار المسجّل).
    console.error("finish_anonymous_push_outbox failed", finishErr.message);
  }

  return result;
}

/**
 * وضع العامل لمسار المجهول: يلتقط القصص الجاهزة أو العالقة في processing
 * (فشل شبكة، سقوط الدالة، أو backoff) ويعالجها.
 */
async function runAnonymousOutboxWorker(
  supabase: ReturnType<typeof createClient>,
  accessToken: string,
  account: ReturnType<typeof assertServiceAccount>,
  limit: number,
): Promise<{ processed: number; sent: number; failed: number }> {
  const { data: rows, error } = await supabase.rpc("claim_anonymous_push_outbox", {
    p_limit: limit,
  });

  if (error || !rows || rows.length === 0) {
    if (error) console.error("claim_anonymous_push_outbox error", error.message);
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows as Array<{ id: string; lease_id: string }>) {
    // الحجز الذي أعادته claim_anonymous_push_outbox هو ما يثبت ملكيتنا للصف
    if (!row.lease_id) {
      console.error(`anonymous outbox ${row.id}: claimed without lease_id — skipping`);
      continue;
    }
    try {
      const result = await handleAnonymousOutbox(
        supabase,
        row.id,
        row.lease_id,
        accessToken,
        account,
      );
      sent += result.sent;
      failed += result.failed;
    } catch (err) {
      await supabase.rpc("finish_anonymous_push_outbox", {
        p_outbox_id: row.id,
        p_lease_id: row.lease_id,
        p_error_text: (err as Error).message.slice(0, 500),
      });
      failed += 1;
    }
  }

  return { processed: rows.length, sent, failed };
}

// ---------------------------------------------------------------------------
// Handler الرئيسي
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  // مصادقة المصدر: pg_net يمرر x-push-secret الموثوق
  if (!PUSH_FUNCTION_SECRET || req.headers.get("x-push-secret") !== PUSH_FUNCTION_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  if (!FCM_SERVICE_ACCOUNT) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "fcm not configured" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { outbox_id?: string; lease_id?: string; anonymous_outbox_id?: string } | null;
  try {
    const raw = await req.text();
    body = raw.trim() ? JSON.parse(raw) : null;
  } catch (_e) {
    return new Response("invalid json", { status: 400 });
  }

  // وضع العامل: بلا body ⇒ استرداد الصفوف المعلّقة وإعادة محاولةها
  if (!body || (body.outbox_id == null && body.anonymous_outbox_id == null)) {
    if (!FCM_SERVICE_ACCOUNT) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "fcm not configured" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    try {
      const account = assertServiceAccount(FCM_SERVICE_ACCOUNT);
      const accessToken = await getFcmAccessToken(FCM_SERVICE_ACCOUNT);
      const worker = await runOutboxWorker(supabase, accessToken, account, 20);
      // المسار المجهول يُلتقط في الوضع العامل نفسه: نفس أمر الـ HTTP
      // (body فارغ) يخدم jobّي `retry-notification-push-outbox`
      // و`retry-anonymous-push-outbox`، فلا يحتاج مهمة منفصلة.
      const anonWorker = await runAnonymousOutboxWorker(supabase, accessToken, account, 20);
      return new Response(
        JSON.stringify({
          ok: true,
          mode: "worker",
          ...worker,
          anonymous: anonWorker,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      console.error("send-push worker fatal", (err as Error).message);
      return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const outboxId = String(body.outbox_id ?? "").trim();
  const leaseId = String(body.lease_id ?? "").trim();
  const anonOutboxId = String(body.anonymous_outbox_id ?? "").trim();

  if (!outboxId && !anonOutboxId) {
    return new Response("missing outbox_id or anonymous_outbox_id", { status: 400 });
  }
  // التحقق من صيغة UUID (36 حرفاً)
  const targetId = outboxId || anonOutboxId;
  if (targetId.length !== 36) {
    return new Response("invalid id format", { status: 400 });
  }
  // المساران يتطلّبان lease: بدونه لا تستطيع الدالة إثبات أنها الحاجزة، فالسماح
  // بالمحاولة بلا lease يفتح تماماً سباق finish الذي وُجد لها هذا الحقل.
  // path المسجّل: `enqueue_push_notification` (trigger) يمرّره.
  // path المجهول: `claim_anonymous_push_outbox` يولّده قبل الاستدعاء.
  if (leaseId.length !== 36) {
    return new Response("missing or invalid lease_id", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const account = assertServiceAccount(FCM_SERVICE_ACCOUNT);
    const accessToken = await getFcmAccessToken(FCM_SERVICE_ACCOUNT);

    let result: SendResult;
    if (outboxId) {
      result = await handleRegisteredOutboxRow(supabase, outboxId, leaseId, accessToken, account);
    } else {
      result = await handleAnonymousOutbox(supabase, anonOutboxId, leaseId, accessToken, account);
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push fatal", (err as Error).message);
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});