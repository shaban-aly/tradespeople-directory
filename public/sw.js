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