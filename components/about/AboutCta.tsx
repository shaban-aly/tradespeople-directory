import { IconArrow, IconSparkles, IconUserPlus, IconWrench } from "@/components/shared/icons";
import { ButtonLink } from "@/components/shared/ui/Button";

export function AboutCta() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-accent/30 bg-accent/5 p-8 sm:p-12 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              ابدأ تجربتك الآن في دليل الصنايعية
            </h2>
            <p className="mt-3 text-base text-muted leading-relaxed">
              سواء كنت تبحث عن فني موثوق لمنزلك، أو حرفياً تريد مضاعفة فرص عملك في السويس، مكانك معنا اليوم.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <ButtonLink href="/request/new" variant="primary" size="lg">
                <IconSparkles className="h-5 w-5 shrink-0" />
                <span>اطلب صنايعي الآن</span>
              </ButtonLink>

              <ButtonLink href="/join" variant="outline" size="lg">
                <IconUserPlus className="h-5 w-5 shrink-0" />
                <span>انضم كصنايعي في الدليل</span>
              </ButtonLink>

              <ButtonLink href="/categories" variant="ghost" size="lg">
                <IconWrench className="h-5 w-5 shrink-0" />
                <span>تصفح كل التخصصات</span>
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
