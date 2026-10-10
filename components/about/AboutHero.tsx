import Link from "next/link";
import {
  IconCheckCircle,
  IconMapPin,
  IconPhone,
  IconShieldCheck,
  IconSparkles,
} from "@/components/shared/icons";
import { ButtonLink } from "@/components/shared/ui/Button";

export function AboutHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/80 bg-card/40 backdrop-blur-xs py-12 sm:py-16 lg:py-20">
      {/* خلفية جمالية خفيفة متناسقة مع الثيمين */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,95,227,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(91,127,255,0.15),transparent)]"
      />

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* مسار التنقل البسيط (Breadcrumb) */}
        <nav aria-label="مسار التصفح" className="mb-6 flex items-center gap-2 text-xs sm:text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-accent">
            الرئيسية
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-foreground">عن دليل الصنايعية</span>
        </nav>

        <div className="max-w-3xl">
          <h1 className="font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
            دليل الصنايعية — منصة صُنعت بأيدي وفكر شباب السويس
          </h1>

          <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted">
            مبادرة محلية مستقلة انطلقت من قلب محافظة السويس، بهدف توفير دليل حديث، مجاني، وموثوق يربط كل بيت بأمهر وأشطر الفنيين والحرفيين بدون وسيط وبدون أي عمولات.
          </p>

          {/* شارات الثقة السريعة */}
          <div className="mt-8 flex flex-wrap gap-2.5 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs sm:text-sm font-bold text-foreground shadow-2xs">
              <IconMapPin className="h-4 w-4 text-accent shrink-0" />
              <span>بأيدي شباب السويس</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs sm:text-sm font-bold text-foreground shadow-2xs">
              <IconShieldCheck className="h-4 w-4 text-action shrink-0" />
              <span>١٠٠٪ مجاني وبلا وسطاء</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs sm:text-sm font-bold text-foreground shadow-2xs">
              <IconCheckCircle className="h-4 w-4 text-accent shrink-0" />
              <span>مراجعة وتوثيق يدوي للبيانات</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs sm:text-sm font-bold text-foreground shadow-2xs">
              <IconPhone className="h-4 w-4 text-action shrink-0" />
              <span>اتصال وواتساب مباشر</span>
            </span>
          </div>

          {/* أزرار الإجراء السريع */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/request/new" variant="primary" size="lg">
              <IconSparkles className="h-5 w-5 shrink-0" />
              <span>اطلب صنايعي الآن</span>
            </ButtonLink>

            <ButtonLink href="/join" variant="outline" size="lg">
              <span>انضم كفني في الدليل</span>
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
