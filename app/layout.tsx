import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { PwaInstallBanner } from "@/components/shared/PwaInstallBanner";
import { ProgressBarProvider } from "@/components/shared/ProgressBarProvider";
import { ExternalBrowserBanner } from "@/components/shared/auth/ExternalBrowserBanner";
import { PwaRegister } from "@/components/shared/layout/PwaRegister";
import { OfflineBanner } from "@/components/shared/ui/OfflineBanner";
import { SessionProvider } from "@/hooks/auth/SessionProvider";
import { PushAutoEnabler } from "@/components/notifications/PushAutoEnabler";
import {
  siteName,
  siteTagline,
  siteUrl,
  siteDescription,
} from "@/lib/data/site";
import { siteKeywords } from "@/lib/seo/metadata";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["600", "700", "800"],
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTagline,
    template: "%s | دليل الصنايعية",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: siteKeywords,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: siteUrl,
    siteName,
    title: siteTagline,
    description: siteDescription,
    images: [
      {
        url: "/og.png",
        secureUrl: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: siteTagline,
      },
      {
        url: "/og.jpg",
        secureUrl: `${siteUrl}/og.jpg`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: siteTagline,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTagline,
    description: siteDescription,
    images: [`${siteUrl}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "دليل الصنايعية",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b5fe3",
};

const themeInitScript = `
try {
  var stored = localStorage.getItem("tradespeople-theme");
  var isDark = stored === "dark" || (!stored && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
} catch (e) {}
`;

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const adsenseClientId = "ca-pub-5152627364584775";

const gaInitScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { anonymize_ip: true });
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {process.env.NODE_ENV === "production" && (
          <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
        {gaId ? (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{ __html: gaInitScript }}
            />
          </>
        ) : null}
      </head>
      <body
        className={`${cairo.variable} ${tajawal.variable} bg-background font-body text-foreground antialiased`}
      >
        <SessionProvider>
          <PushAutoEnabler />
          <PwaRegister />
          <OfflineBanner />
          <PwaInstallBanner />
          <ExternalBrowserBanner delayMs={10_000} />
          <ProgressBarProvider>{children}</ProgressBarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
