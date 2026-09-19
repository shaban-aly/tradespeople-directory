/**
 * صفحة /offline — تُعرض من الـ Service Worker عند تعذّر الاتصال فقط.
 *
 * تُقدَّم كـ HTML ثابت مكتفٍ بذاته (inline CSS + SVG داخل الملف) بدل صفحة App
 * Router كاملة، بحيث لا تعتمد على أجزاء التطبيق ولا على hydration ولا على أي
 * بيانات/API. الـ Service Worker يخزّن مثيلاً واحداً فقط من هذا الملف ولا يحتاج
 * أي parsing لروابط Next.js.
 */

const PAGE = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>لا يمكن الاتصال بالموقع حاليًا</title>
<style>
  :root {
    color-scheme: light;
    --bg: #f5f7ff;
    --fg: #14142b;
    --muted: #5d6674;
    --accent: #3b5fe3;
    --on-accent: #ffffff;
    --card: #ffffff;
    --border: #c9d0e4;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      --bg: #10131f;
      --fg: #f2f4ff;
      --muted: #9ca3c4;
      --accent: #5b7fff;
      --on-accent: #10131f;
      --card: #181c2c;
      --border: #262b45;
    }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    font-family: "Segoe UI", Tahoma, "Noto Kufi Arabic", "Cairo", system-ui, sans-serif;
    background: var(--bg);
    color: var(--fg);
    direction: rtl;
  }
  .card {
    width: 100%;
    max-width: 26rem;
    padding: 2rem;
    text-align: center;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 1.5rem;
    box-shadow: 0 8px 24px rgba(20, 20, 43, 0.12);
  }
  .icon {
    width: 5rem;
    height: 5rem;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 1.25rem;
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--accent);
  }
  h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; }
  p { font-size: 1rem; line-height: 1.7; color: var(--muted); }
  .retry {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 3rem;
    margin-top: 2rem;
    padding: 0 1.25rem;
    border-radius: 0.75rem;
    background: var(--accent);
    color: var(--on-accent);
    font: inherit;
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
  }
  .retry:active { transform: scale(0.98); }
</style>
</head>
<body>
  <main class="card">
    <div class="icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8.5 16.5a5 5 0 0 1 7 0" />
        <path d="M5 12.5a10 10 0 0 1 14.14-1.74" />
        <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
        <path d="M22 8.82a15 15 0 0 0-4.17-2.65" />
        <line x1="2" y1="4" x2="22" y2="20" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    </div>
    <h1>لا يمكن الاتصال بالموقع حاليًا</h1>
    <p>تحقق من اتصالك بالإنترنت وحاول مرة أخرى.</p>
    <a class="retry" href="/">إعادة المحاولة</a>
  </main>
</body>
</html>`;

export const dynamic = "force-static";

export function GET() {
  return new Response(PAGE, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}