/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.185.37.177"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
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

    const adsenseScriptHost = "https://pagead2.googlesyndication.com";
    const adsenseHosts =
      "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com";

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${gaHost ? ` ${gaHost}` : ""} ${adsenseScriptHost}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      `img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com${supabaseHost ? ` ${supabaseHost}` : ""}${gaHost ? ` ${gaHost}` : ""} ${adsenseHosts}`,
      "media-src 'self' blob:",
      `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl}` : ""}${gaHost ? ` ${gaHost}` : ""} ${adsenseHosts}`,
      `frame-src 'self' ${adsenseHosts}`,
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
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
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
