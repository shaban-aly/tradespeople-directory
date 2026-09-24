/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.6"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseHost = "";
    if (supabaseUrl) {
      try {
        supabaseHost = new URL(supabaseUrl).hostname;
      } catch {
        // تجاهل إن كان الرابط غير صالح
      }
    }

    const isDev = process.env.NODE_ENV === "development";

    const gaHost = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
      ? "https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com"
      : "";

    // دومينات سكريبتات الإعلانات — تشمل كل subdomains مطلوبة لـ Google Ads
    const adsenseScriptHosts =
      "https://pagead2.googlesyndication.com https://*.adtrafficquality.google";

    // دومينات موارد الإعلانات (صور، connect، frames)
    const adsenseHosts =
      "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.adtrafficquality.google https://*.googlesyndication.com";

    // دومينات الـ frames — Google Ads بتفتح iframes لـ google.com و doubleclick.net
    const adsenseFrameHosts =
      "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.adtrafficquality.google https://*.googlesyndication.com https://www.google.com https://*.doubleclick.net";

    // دومينات Google Analytics للـ connect-src (تشمل POST requests)
    const gaConnectHosts = gaHost
      ? `${gaHost} https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net`
      : "";

    const csp = [
      "default-src 'self'",
      // script-src: جميع مصادر السكريبتات بما فيها Google Identity Services
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com/gsi/client https://www.gstatic.com${gaHost ? ` ${gaHost}` : ""} ${adsenseScriptHosts}`,
      // script-src-elem صريح لتجنب أخطاء الـ fallback من المتصفح
      `script-src-elem 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com/gsi/client https://www.gstatic.com${gaHost ? ` ${gaHost}` : ""} ${adsenseScriptHosts}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      `img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://*.googleusercontent.com${supabaseHost ? ` https://${supabaseHost}` : ""}${gaHost ? ` ${gaHost}` : ""} ${adsenseHosts}`,
      "media-src 'self' blob:",
      // connect-src: تشمل GA POST requests وكل دومينات Ads و Google Auth
      // + wss:// لنفس host الـ Supabase — إلزامي لاتصال Realtime WebSocket
      // + fcm + installations + registrations — إلزاميان لإشعارات Firebase (SW/token)
      // + gstatic — إلزامي لتحميل أكواد Firebase Messaging
      `connect-src 'self' https://accounts.google.com https://fcm.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://www.gstatic.com${supabaseUrl ? ` ${supabaseUrl}` : ""}${supabaseHost ? ` wss://${supabaseHost}` : ""} ${gaConnectHosts} ${adsenseHosts}`,
      "worker-src 'self' blob:",
      `frame-src 'self' https://accounts.google.com ${adsenseFrameHosts}`,
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // same-origin-allow-popups مطلوب لـ OAuth popup (Google / Facebook)
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl);
    nextConfig.images.remotePatterns.push({
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    });
  } catch {
    // تجاهل إن كان الرابط غير صالح
  }
}

export default nextConfig;
