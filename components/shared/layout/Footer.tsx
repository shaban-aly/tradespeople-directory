import Link from "next/link";
import { siteContact, siteNavLinks } from "@/lib/data/site";
import { toArabicDigits } from "@/lib/utils/format";
import { mailtoHref, telHref, whatsappHref } from "@/lib/utils/url";
import {
  IconFacebook,
  IconMail,
  IconPhone,
  IconShieldCheck,
  IconWhatsApp,
} from "@/components/shared/icons";
import { PwaInstallTrigger } from "@/components/shared/PwaInstallTrigger";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const year = toArabicDigits(currentYear);

  return (
    <footer className="border-t border-border/80 bg-card/60 backdrop-blur-xs transition-colors">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* العمود الأول: الهوية والرسالة */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="group flex w-fit items-center gap-2.5 transition-transform active:scale-[0.98]"
              aria-label="دليل الصنايعية — الصفحة الرئيسية"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon-96x96.png"
                alt="دليل الصنايعية"
                width={96}
                height={96}
                loading="lazy"
                decoding="async"
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-heading text-xl sm:text-2xl font-black text-foreground tracking-tight">
                دليل الصنايعية
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-muted">
              منصة مجانية ومفتوحة لأهل السويس، نهدف لتسهيل الوصول المباشر لأفضل الفنيين وأصحاب المهن مع التحقق الدوري من أرقام الاتصال.
            </p>

            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-accent/90">
              <IconShieldCheck className="h-4 w-4 shrink-0 text-accent" />
              <span>مراجعة وتحديث يدوي للبيانات</span>
            </div>
          </div>

          {/* العمود الثاني: روابط سريعة */}
          <nav aria-label="روابط سريعة" className="flex flex-col gap-3">
            <h3 className="font-heading text-sm font-bold tracking-wide text-foreground">
              روابط سريعة
            </h3>
            <ul className="space-y-2.5 text-sm">
              {siteNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex text-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/join"
                  className="inline-flex text-muted transition-colors hover:text-accent font-semibold"
                >
                  انضم كصنايعي
                </Link>
              </li>
              <li>
                <Link
                  href="/request/new"
                  className="inline-flex text-accent font-bold transition-colors hover:text-accent/80"
                >
                  اطلب صنايعي الآن
                </Link>
              </li>
              <PwaInstallTrigger />
            </ul>
          </nav>

          {/* العمود الثالث: قانوني ومعلومات */}
          <nav aria-label="روابط قانونية" className="flex flex-col gap-3">
            <h3 className="font-heading text-sm font-bold tracking-wide text-foreground">
              قانوني ومعلومات
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="inline-flex text-muted transition-colors hover:text-accent"
                >
                  عن دليل الصنايعية
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="inline-flex text-muted transition-colors hover:text-accent"
                >
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="inline-flex text-muted transition-colors hover:text-accent"
                >
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  className="inline-flex text-muted transition-colors hover:text-accent"
                >
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </nav>

          {/* العمود الرابع: تواصل مباشر وقنوات الدعم */}
          <div className="flex flex-col gap-3">
            <h3 className="font-heading text-sm font-bold tracking-wide text-foreground">
              تواصل معنا
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={telHref(siteContact.phone)}
                  className="flex items-center gap-2.5 text-muted transition-colors hover:text-accent"
                  title="اتصال هاتفي مباشر"
                >
                  <IconPhone className="h-4.5 w-4.5 shrink-0 text-accent" />
                  <bdi dir="ltr" className="font-medium">0101 997 9315</bdi>
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref(siteContact.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-muted transition-colors hover:text-action"
                  title="مراسلة عبر واتساب"
                >
                  <IconWhatsApp className="h-4.5 w-4.5 shrink-0 text-action" />
                  <span className="font-medium">واتساب مباشر</span>
                </a>
              </li>
              <li>
                <a
                  href={siteContact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-muted transition-colors hover:text-accent"
                  title="صفحة فيسبوك الرسمية"
                >
                  <IconFacebook className="h-4.5 w-4.5 shrink-0 text-accent" />
                  <span className="font-medium">صفحة فيسبوك</span>
                </a>
              </li>
              <li>
                <a
                  href={mailtoHref(siteContact.email)}
                  className="flex items-center gap-2.5 text-muted transition-colors hover:text-accent"
                  title="مراسلة عبر البريد الإلكتروني"
                >
                  <IconMail className="h-4.5 w-4.5 shrink-0 text-accent" />
                  <bdi dir="ltr" className="font-medium">{siteContact.email}</bdi>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* سطر حقوق النشر والتطوير */}
        <div className="mt-10 border-t border-border/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start text-xs text-muted">
          <p>
            دليل الصنايعية — منصة خدمية غير هادفة للربح لخدمة محافظة السويس. جميع الحقوق محفوظة © {year}.
          </p>
          <p>
            تم التطوير بواسطة{" "}
            <a
              className="font-bold text-accent transition-colors hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              href="https://shabanaly.vercel.app/"
            >
              Shaban Aly
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
