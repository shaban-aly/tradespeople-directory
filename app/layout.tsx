import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import { siteDescription, siteName, siteTagline, siteUrl } from "@/lib/data/site";
import "./globals.css";

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
  keywords: [
    "دليل الصنايعية",
    "صنايعية السويس",
    "سباك في السويس",
    "كهربائي في السويس",
    "نجار في السويس",
    "دليل حرف ومهن السويس",
    "أصحاب حرف ومهن",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: siteUrl,
    siteName,
    title: siteTagline,
    description: siteDescription,
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: siteTagline },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTagline,
    description: siteDescription,
    images: ["/og.png"],
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
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/site.webmanifest",
};

const themeInitScript = `
try {
  if (localStorage.getItem("tradespeople-theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`;

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {gaId ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <script dangerouslySetInnerHTML={{ __html: gaInitScript }} />
          </>
        ) : null}
      </head>
      <body
        className={`${cairo.variable} ${tajawal.variable} bg-background font-body text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
