// ---------------------------------------------------------------------------
// 1. Firebase Background Messaging Module
// ---------------------------------------------------------------------------
// يُستورد أولاً حتى يبقى Firebase Messaging (الإشعارات الخلفية) يعمل عبر نفس
// الـ Service Worker الموحد — لا يوجد SW ثانٍ ولا duplicate notifications.
try {
  importScripts("/firebase-messaging-sw.js");
} catch (err) {
  console.error("[SW] Failed to import Firebase messaging module:", err);
}

// ---------------------------------------------------------------------------
// 3. إشعارات الخلفية والنقر عليها
// ---------------------------------------------------------------------------
// Firebase يستدعي onBackgroundMessage عبر وحدة firebase-messaging-sw.js المستوردة
// أعلاه، فنعرض الإشعار بأنفسنا (payload data-only لمنع عرض مزدوج).
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    console.error("[SW] push payload is not JSON:", err);
    return;
  }

  const title = (payload && payload.title) || "إشعار جديد";
  const body = payload.body || "";
  // رابط غير صالح أو خارجي ⇒ لا نمرره إطلاقاً (لا نافذة خارجية ولا javascript:)
  const link = normalizeInternalLink(payload.link) || "";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png",
      tag: payload.notification_id || "tradespeople-push",
      renotify: false,
      data: { link, notificationId: payload.notification_id || null },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = (event.notification && event.notification.data) || {};

  event.waitUntil(
    (async () => {
      // 1) رابط داخلي صالح فقط
      const href = resolveInternalLink(data.link);
      if (href) {
        await self.clients.openWindow(href);
        return;
      }

      // 2) لا رابط صالح: نركّز نافذة مفتوحة، وإلا نفتح الصفحة الرئيسية
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow("/");
    })(),
  );
});

// ---------------------------------------------------------------------------
// 2. سياسة الكاش: لا Offline App إطلاقاً
// ---------------------------------------------------------------------------
//   - صفحات الموقع والت navigation: NETWORK ONLY. عند تعذّر الاتصال فقط نعرض
//     صفحة /offline الثابتة — لا نسخة قديمة من الصفحة المطلوبة أبداً.
//   - طلبات `/api/*`: NETWORK ONLY — لا cache ولا fallback على بيانات قديمة.
//   - بقية الموارد (_next/*, صور, خطوط...): NETWORK ONLY — لا runtime cache
//     لصفحات الموقع أو بياناته إطلاقاً.
//   - الوحيد المسموح به في Cache Storage هو صفحة /offline (ملف HTML مكتفٍ
//     بذاته)، وتُخزَّن دون أي parsing لروابط أو قطع Next.js.
const CACHE_VERSION = "v8"; // Migration: تجاوز shell-*/runtime-*/offline-v7 القديمة
const OFFLINE_CACHE_NAME = `offline-${CACHE_VERSION}`;

const isDev =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

// بادئات الكاش الخاصة بهذا التطبيق فقط (كل الإصدارات، قديمة وحديثة).
// نستخدمها عند activate لمسح ما أنشأه أي Service Worker سابق (shell-v*/runtime-v*/offline-v*)
// دون لمس أي cache لا يخص التطبيق.
const APP_CACHE_PREFIXES = ["shell-v", "runtime-v", "offline-v"];

function isAppCache(key) {
  return APP_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// 2b. حارس الروابط الداخلية (Internal Link Guard)
// ---------------------------------------------------------------------------
// نفس قاعدة `public.is_safe_internal_link` في القاعدة و`lib/utils/internalLink.ts`
// و`supabase/functions/send-push/lib.ts` — أربع نسخ متطابقة عن قصد، كل واحدة
// تغلق باباً: القاعدة تمنع التخزين، والخادم يمنع الإرسال، الواجهة تمنع العرض،
// وهنا نمنع فتح أي نافذة من payload وصلنا.
// أي رابط خارجي أو javascript: في رسالة push لا يفتح شيئاً ولا يُمرَّر لـ clients.
function isSafeInternalPath(link) {
  if (typeof link !== "string" || link.length < 1 || link.length > 500) return false;
  if (!link.startsWith("/")) return false;
  if (link.startsWith("//")) return false;
  if (/[\u0000-\u001f\u007f\s\\]/.test(link)) return false;
  const path = link.split("?")[0].split("#")[0];
  if (path.includes(":")) return false;
  return true;
}

/**
 * يحوّل رابط payload إلى **مسار داخلي نسبي** أو null.
 *
 * المصدر الأمثل هو `payload.link` النسبي: `send-push` يرسل المسار الداخلي كما
 * هو (مثال `/craftsman/x`) فيُبنى الرابط النهائي من `self.location.origin`
 * محلياً، فلا يعتمد على `PUSH_SITE_URL` إطلاقاً ⇒ أصل الرابط صحيح بالبناء
 * مهما كان مضيف الجهاز.
 *
 * ما يبقى هنا للاستيعاب الأقدم: إشعارات قديمة كانت تُرسل رابطاً مطلقاً
 * (`PUSH_SITE_URL + metadata.link`). المطلق يُقبل فقط إن كان نفس الأصل ثم
 * يُختزل إلى pathname+search، وأي رابط خارجي أو مخطّط خطير يُسقط.
 */
function normalizeInternalLink(raw) {
  if (typeof raw !== "string" || raw.length < 1) return null;

  // مسار داخلي نسبي: يُتحقق منه كما هو
  if (raw.startsWith("/")) {
    return isSafeInternalPath(raw) ? raw : null;
  }

  // رابط مطلق قديم: يُقبل فقط لنفس الأصل ثم يُختزل لمسار نسبي
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.origin !== self.location.origin) return null;

  const relative = parsed.pathname + parsed.search;
  return isSafeInternalPath(relative) ? relative : null;
}

/** يحوّل رابط payload صالحاً إلى URL مطلق، أو null إن كان غير صالح */
function resolveInternalLink(link) {
  const safe = normalizeInternalLink(link);
  if (!safe) return null;
  try {
    const target = new URL(safe, self.location.origin);
    if (target.origin !== self.location.origin) return null;
    return target.href;
  } catch (err) {
    console.error("[SW] Failed to resolve internal link:", err);
    return null;
  }
}

// يجلب صفحة /offline (HTML مكتفٍ بذاته) ويخزّنها كمفتاح "/offline" فقط.
async function prepareOfflinePage() {
  const cache = await caches.open(OFFLINE_CACHE_NAME);
  const offlineUrl = new URL("/offline", self.location.origin).href;

  const response = await fetch(offlineUrl, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok || response.type === "error") {
    throw new Error(`/offline fetch failed: ${response.status}`);
  }

  await cache.put("/offline", response);
}

self.addEventListener("install", (event) => {
  if (isDev) {
    // في وضع التطوير: تفعيل فوري بدون أي precaching لمنع تعارض HMR.
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    prepareOfflinePage()
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error("[SW] Failed to precache offline page:", err);
        // حتى لو فشل التحضير نكمل: الشبكة-only يعمل، وfallback الـ offline
        // يتحول إلى صفحة خطأ المتصفح كأضعف حالة ممكنة.
        self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => isAppCache(key) && key !== OFFLINE_CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // لا نتدخل في ملف Firebase Messaging نفسه — يبقى Network-only دائماً.
  if (url.pathname === "/firebase-messaging-sw.js") return;

  // الموارد من جهات خارجية (Analytics, Ads, Firebase CDN, الخطوط البعيدة...)
  // تذهب للشبكة مباشرة بدون أي تدخل.
  if (url.origin !== self.location.origin) return;

  if (isDev) return;

  if (request.method !== "GET") return;

  // API routes: NETWORK ONLY — لا cache ولا fallback على بيانات قديمة أبداً.
  if (url.pathname.startsWith("/api/")) return;

  // التنقل بين الصفحات (HTML): NETWORK ONLY مع fallback وحيد إلى /offline.
  // لا نستخدم caches.match للصفحة المطلوبة إطلاقاً — فلا يمكن أن تظهر صفحة
  // قديمة؛ الوحيد المخزّن هو صفحة /offline الثابتة.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(OFFLINE_CACHE_NAME);
        return (await cache.match("/offline")) || Response.error();
      }),
    );
    return;
  }

  // باقي الموارد من نفس الأصل (_next/*, صور, ...): NETWORK ONLY.
  // لا نستجيب للحدث — الطلب يذهب للشبكة مباشرة ولا يُخزّن أي شيء.
  return;
});