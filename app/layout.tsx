import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
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
  title: {
    default: "دليل الصنايعية — السويس",
    template: "%s | دليل الصنايعية",
  },
  description:
    "اعثر على صنايعي محترف في مدينة السويس (سباكة، كهرباء، نجارة...) واتصل به أو راسله واتساب مباشرة في ثوانٍ.",
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
    <html lang="ar" dir="rtl">
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
