const CACHE_VERSION = "v1";
const PRECACHE_NAME = `shell-${CACHE_VERSION}`;
const RUNTIME_NAME = `runtime-${CACHE_VERSION}`;

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

  // تجاوز API routes دائماً
  if (url.pathname.startsWith("/api/")) return;

  // تجاوز كل دومينات Google (Analytics, Ads, TagManager) — اتركها للشبكة مباشرة
  if (shouldBypass(url)) return;

  // تجاوز أي طلب غير GET (مثل POST)
  if (request.method !== "GET") return;

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
