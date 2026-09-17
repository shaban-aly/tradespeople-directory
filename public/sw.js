// ---------------------------------------------------------------------------
// 1. Firebase Background Messaging Module
// ---------------------------------------------------------------------------
try {
  importScripts("/firebase-messaging-sw.js");
} catch (err) {
  console.error("[SW] Failed to import Firebase messaging module:", err);
}

// ---------------------------------------------------------------------------
// 2. PWA Caching & Lifecycle
// ---------------------------------------------------------------------------
const CACHE_VERSION = "v6"; // رُفع الإصدار لتحديث Service Worker وتجاوز كاش البرودكشن القديم
const PRECACHE_NAME = `shell-${CACHE_VERSION}`;
const RUNTIME_NAME = `runtime-${CACHE_VERSION}`;

const isDev =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

const PRECACHE_URLS = [
  "/",
  "/categories",
  "/site.webmanifest",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/favicon.svg",
];

// دومينات Google التي يجب تركها تذهب للشبكة مباشرة (بدون cache أو تدخل)
const BYPASS_HOSTS = [
  "www.google-analytics.com",
  "analytics.google.com",
  "stats.g.doubleclick.net",
  "www.googletagmanager.com",
  "googletagmanager.com",
  "pagead2.googlesyndication.com",
  "googleads.g.doubleclick.net",
  "tpc.googlesyndication.com",
  "ep1.adtrafficquality.google",
  "ep2.adtrafficquality.google",
];

function shouldBypass(url) {
  return BYPASS_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

self.addEventListener("install", (event) => {
  if (isDev) {
    // في وضع التطوير: تفعيل فوري بدون precaching لتجنب أي stale cache يعطل HMR
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches
      .open(PRECACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE_NAME && key !== RUNTIME_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // تجاوز ملف تكوين Firebase حتى لا يُحفظ في الكاش ويبقى دائماً متجدداً
  if (url.pathname === "/firebase-messaging-sw.js") return;

  // تجاوز API routes دائماً
  if (url.pathname.startsWith("/api/")) return;

  // في وضع التطوير: اترك كل طلبات fetch تذهب للشبكة مباشرة لمنع أي تعارض مع HMR
  if (isDev) return;

  // تجاوز كل دومينات Google (Analytics, Ads, TagManager) — اتركها للشبكة مباشرة
  if (shouldBypass(url)) return;

  // تجاوز أي طلب غير GET (مثل POST)
  if (request.method !== "GET") return;

  // تجاوز ملفات الوسائط الكبيرة — Chrome يطبع log لكل respondWith لذا نتجنب الفيديو والصوت
  const MEDIA_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mp3", ".wav"];
  if (MEDIA_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))) return;

  // تنقل بين الصفحات: شبكة أولاً ثم cache كاحتياطي
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/")),
        ),
    );
    return;
  }

  // باقي الموارد من نفس الأصل: cache أولاً ثم شبكة
  if (url.origin !== self.location.origin) return;

  // موارد Next.js (_next/static/chunks): شبكة أولاً ثم كاش كاحتياطي
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
