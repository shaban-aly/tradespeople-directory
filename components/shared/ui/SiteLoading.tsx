import Image from "next/image";
import { siteName, siteTagline } from "@/lib/data/site";

export function SiteLoading() {
  return (
    <div
      role="status"
      aria-label="جاري التحميل"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-card px-4"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-4 border-accent/20 border-t-accent motion-reduce:hidden"
        />
        <Image
          src="/favicon.svg"
          alt={siteName}
          width={192}
          height={192}
          priority
          className="h-16 w-16 object-contain"
        />
      </div>
      <div className="text-center">
        <p className="font-heading text-2xl font-extrabold text-foreground">
          {siteName}
        </p>
        <p className="mt-1 text-base text-muted">
          {siteTagline.replace(`${siteName} — `, "")}
        </p>
      </div>
    </div>
  );
}
