import Link from "next/link";
import type { LegalDoc } from "@/lib/data/legal";
import { siteContact } from "@/lib/data/site";
import { mailtoHref, whatsappHref } from "@/lib/utils/url";
import {
  IconCheckCircle,
  IconClock,
  IconExternalLink,
  IconMail,
  IconMessageSquare,
  IconShieldCheck,
  IconWhatsApp,
} from "@/components/shared/icons";

interface LegalPageProps {
  doc: LegalDoc;
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const isPrivacy = doc.slug === "privacy";
  const companionLink = isPrivacy
    ? { href: "/terms", label: "الشروط والأحكام" }
    : { href: "/privacy", label: "سياسة الخصوصية" };

  return (
    <div className="min-h-screen">
      {/* رأس الصفحة مع شارات التوثيق ومسار التنقل */}
      <header className="relative overflow-hidden border-b border-border/80 bg-card/50 backdrop-blur-xs py-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(59,95,227,0.1),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(91,127,255,0.12),transparent)]"
        />

        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="مسار التصفح" className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-muted">
            <Link href="/" className="transition-colors hover:text-accent">
              الرئيسية
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-foreground">{doc.title}</span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
              {doc.title}
            </h1>

            <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted">
              {doc.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-semibold text-foreground shadow-2xs">
                <IconClock className="h-4 w-4 text-accent shrink-0" />
                <span>آخر تحديث: {doc.lastUpdated}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-semibold text-foreground shadow-2xs">
                <IconShieldCheck className="h-4 w-4 text-action shrink-0" />
                <span>وثيقة معتمدة لأهالي السويس</span>
              </span>

              <Link
                href={companionLink.href}
                className="inline-flex items-center gap-1 text-accent font-bold transition-colors hover:underline"
              >
                <span>الانتقال إلى {companionLink.label}</span>
                <IconExternalLink className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* محتوى البنود مع الفهرس الجانبي على الشاشات الكبيرة */}
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* العمود الأساسي: عرض بنود الوثيقة */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            {doc.sections.map((section, index) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-card transition-colors hover:border-accent/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent font-heading text-xs font-black">
                      {index + 1}
                    </span>
                    <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                      {section.title}
                    </h2>
                  </div>

                  {section.badge && (
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                      {section.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {section.blocks.map((block, i) =>
                    block.type === "list" ? (
                      <ul
                        key={i}
                        className="space-y-2.5 text-base leading-relaxed text-muted"
                      >
                        {block.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2.5">
                            <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-action/15 text-action">
                              <IconCheckCircle className="h-3.5 w-3.5" />
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        key={i}
                        className="text-base leading-relaxed text-muted"
                      >
                        {block.text}
                      </p>
                    ),
                  )}
                </div>
              </article>
            ))}

            {/* سكشن الختام والتواصل */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 text-center sm:text-start flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  هل لديك استفسار أو طلب بخصوص هذه الوثيقة؟
                </h3>
                <p className="mt-1 text-sm text-muted">
                  فريقنا متاح دائماً للرد على أسئلة أهالي وحرفيي السويس بكل شفافية.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href={whatsappHref(siteContact.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-action px-4 py-2.5 text-sm font-bold text-on-action transition-all hover:bg-action/90 active:scale-[0.98]"
                >
                  <IconWhatsApp className="h-4.5 w-4.5" />
                  <span>مراسلة واتساب</span>
                </a>

                <a
                  href={mailtoHref(siteContact.email)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  <IconMail className="h-4.5 w-4.5" />
                  <span>راسلنا عبر الإيميل</span>
                </a>
              </div>
            </div>
          </div>

          {/* العمود الجانبي: فهرس المواد السريع (Sticky Sidebar) على الشاشات الكبيرة */}
          <aside className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs">
              <h3 className="font-heading text-base font-bold text-foreground mb-4">
                فهرس بنود الوثيقة
              </h3>

              <nav aria-label="فهرس بنود الوثيقة" className="space-y-1.5 text-sm">
                {doc.sections.map((section, idx) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-muted transition-colors hover:bg-accent/5 hover:text-accent font-medium"
                  >
                    <span className="truncate">{section.title}</span>
                    <span className="text-xs text-muted/70 shrink-0 font-heading">
                      #{idx + 1}
                    </span>
                  </a>
                ))}
              </nav>

              <div className="mt-5 pt-4 border-t border-border/80">
                <Link
                  href="/about"
                  className="flex items-center justify-between text-xs font-bold text-accent transition-colors hover:underline"
                >
                  <span>تعرف أكثر على قصة ومبادئ الدليل</span>
                  <span aria-hidden="true">←</span>
                </Link>
              </div>
            </div>

            {/* بطاقة الثقة المحلية */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xs text-xs text-muted space-y-2">
              <div className="flex items-center gap-2 font-heading font-bold text-foreground">
                <IconShieldCheck className="h-4.5 w-4.5 text-accent" />
                <span>التزام مجتمعي لأهل السويس</span>
              </div>
              <p className="leading-relaxed">
                هذه الوثيقة ملزمة لإدارة الدليل ومصممة خصيصاً لحفظ حقوق وكرامة أهالي وحرفيي محافظة السويس، مع التعهد بعدم فرض أي عمولات وسيطة.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}