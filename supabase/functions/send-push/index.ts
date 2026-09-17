// @ts-nocheck — هذا الملف يعمل في بيئة Deno (Edge Function) وليس Node.js.
// أخطاء IDE المتعلقة بـ Deno أو npm: imports هي وهمية ولا تؤثر على النشر.
// send-push — Edge Function لتوزيع إشعارات FCM عند كل إدراج notification جديد.
//
// التدفق الأساسي (مسجلون):
//   trigger دالة dispatch_push_notification (migration 0016) → pg_net →
//   هذا الـ HTTP handler → FCM HTTP v1 لأجهزة المستخدم.
//
// التدفق الثاني (زوار مجهولون):
//   trigger notify_category_subscribers_on_publish (migration 0017) → pg_net →
//   هذا الـ HTTP handler (anonymous_outbox_id) → يقرأ anonymous_push_outbox →
//   يجلب التوكنات المهتمة بالتصنيف من anonymous_push_subscriptions → FCM.
//
// المتغيرات المطلوبة (function secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (تُحقن تلقائياً)
//   PUSH_FUNCTION_SECRET                     (مطابق لـ push_secret في push_settings)
//   FCM_SERVICE_ACCOUNT                      (JSON ملف خدمة Firebase Messaging)
//   PUSH_SITE_URL                            (اختياري — أساس روابط النقر)

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  assertServiceAccount,
  buildFcmMessage,
  defaultLinkResolver,
  fcmSendEndpoint,
  isUnregisteredStatus,
  signJwt,
} from "./lib.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PUSH_FUNCTION_SECRET = Deno.env.get("PUSH_FUNCTION_SECRET") ?? "";
const FCM_SERVICE_ACCOUNT = Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "";
const PUSH_SITE_URL = Deno.env.get("PUSH_SITE_URL") ?? "";

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
}

// ---------------------------------------------------------------------------
// المسار الأول: مسجل — notification_id
// ---------------------------------------------------------------------------
async function handleRegisteredNotification(
  supabase: ReturnType<typeof createClient>,
  notificationId: string,
  accessToken: string,
  account: ReturnType<typeof assertServiceAccount>,
): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, removedTokens: 0, notifiedTokens: 0 };

  const { data: notification, error: notifError } = await supabase
    .from("notifications")
    .select("recipient_id, title, body, metadata")
    .eq("id", notificationId)
    .maybeSingle();
  if (notifError || !notification) {
    console.error("notifications select error", notifError?.message);
    return result;
  }

  const { data: tokens, error: tokensError } = await supabase
    .from("user_push_tokens")
    .select("id, token")
    .eq("user_id", notification.recipient_id);
  if (tokensError || !tokens || tokens.length === 0) return result;

  const endpoint = fcmSendEndpoint(account.project_id);
  const metadata = (notification.metadata ?? {}) as Record<string, unknown>;
  const link = defaultLinkResolver({ ...metadata, siteUrl: PUSH_SITE_URL });
  result.notifiedTokens = tokens.length;

  for (const row of tokens) {
    const message = buildFcmMessage(row.token, notification.title, notification.body, link, notificationId);
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
        result.sent += 1;
      } else if (isUnregisteredStatus(res.status)) {
        await supabase.from("user_push_tokens").delete().eq("id", row.id);
        result.removedTokens += 1;
      } else {
        result.failed += 1;
        console.warn("fcm send failed (registered)", res.status);
      }
    } catch (err) {
      result.failed += 1;
      console.error("fcm send exception (registered)", (err as Error).message);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// المسار الثاني: زوار مجهولون — anonymous_outbox_id
// ---------------------------------------------------------------------------
async function handleAnonymousOutbox(
  supabase: ReturnType<typeof createClient>,
  outboxId: string,
  accessToken: string,
  account: ReturnType<typeof assertServiceAccount>,
): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, removedTokens: 0, notifiedTokens: 0 };

  // قراءة سجل الـ outbox
  const { data: outbox, error: outboxErr } = await supabase
    .from("anonymous_push_outbox")
    .select("id, category_slug, title, body, url, status")
    .eq("id", outboxId)
    .maybeSingle();

  if (outboxErr || !outbox) {
    console.error("anonymous_push_outbox select error", outboxErr?.message);
    return result;
  }

  // لا نُعيد الإرسال إن أُرسل أو أُلغي مسبقاً
  if (outbox.status !== "pending") {
    return result;
  }

  // جلب جميع التوكنات المهتمة بالتصنيف والنشطة
  const { data: subscriptions, error: subsErr } = await supabase
    .from("anonymous_push_subscriptions")
    .select("id, token")
    .eq("status", "active")
    .contains("interests", [outbox.category_slug]);

  if (subsErr || !subscriptions || subscriptions.length === 0) {
    // لا يوجد مشتركون — نُعلِّم كـ skipped
    await supabase
      .from("anonymous_push_outbox")
      .update({ status: "skipped" })
      .eq("id", outboxId);
    return result;
  }

  const endpoint = fcmSendEndpoint(account.project_id);
  const link = outbox.url
    ? `${PUSH_SITE_URL.replace(/\/$/, "")}${outbox.url}`
    : PUSH_SITE_URL || undefined;

  result.notifiedTokens = subscriptions.length;
  const staleIds: string[] = [];

  for (const sub of subscriptions) {
    const message = buildFcmMessage(sub.token, outbox.title, outbox.body, link, outbox.id);
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
        result.sent += 1;
      } else if (isUnregisteredStatus(res.status)) {
        // توكن معطّل — نُحدّث حالته إلى revoked
        staleIds.push(sub.id);
        result.removedTokens += 1;
      } else {
        result.failed += 1;
        console.warn("fcm send failed (anonymous)", res.status);
      }
    } catch (err) {
      result.failed += 1;
      console.error("fcm send exception (anonymous)", (err as Error).message);
    }
  }

  // حذف التوكنات المعطّلة دفعةً واحدة
  if (staleIds.length > 0) {
    await supabase
      .from("anonymous_push_subscriptions")
      .update({ status: "revoked" })
      .in("id", staleIds);
  }

  // تحديث حالة سجل الـ outbox
  const finalStatus = result.failed > 0 && result.sent === 0 ? "failed" : "sent";
  await supabase
    .from("anonymous_push_outbox")
    .update({ status: finalStatus })
    .eq("id", outboxId);

  return result;
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

  let body: { notification_id?: string; anonymous_outbox_id?: string };
  try {
    body = (await req.json()) as { notification_id?: string; anonymous_outbox_id?: string };
  } catch (_e) {
    return new Response("invalid json", { status: 400 });
  }

  const notificationId = String(body.notification_id ?? "").trim();
  const anonOutboxId = String(body.anonymous_outbox_id ?? "").trim();

  if (!notificationId && !anonOutboxId) {
    return new Response("missing notification_id or anonymous_outbox_id", { status: 400 });
  }
  // التحقق من صيغة UUID (36 حرفاً)
  const targetId = notificationId || anonOutboxId;
  if (targetId.length !== 36) {
    return new Response("invalid id format", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const account = assertServiceAccount(FCM_SERVICE_ACCOUNT);
    const accessToken = await getFcmAccessToken(FCM_SERVICE_ACCOUNT);

    let result: SendResult;
    if (notificationId) {
      result = await handleRegisteredNotification(supabase, notificationId, accessToken, account);
    } else {
      result = await handleAnonymousOutbox(supabase, anonOutboxId, accessToken, account);
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