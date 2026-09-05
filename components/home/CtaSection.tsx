import { ButtonLink } from "@/components/shared/ui/Button";
import { Reveal } from "@/components/shared/ui/Reveal";
import { IconWrench } from "@/components/shared/icons";

export function CtaSection() {
  return (
    <section className="border-t border-border px-4 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal>
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <IconWrench className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
              صاحب مهنة أو صنايعي شاطر في السويس؟
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted">
              انضم لأكبر دليل محلي مجاناً، واستقبل اتصالات وزبائن من منطقتك
              مباشرة على هاتفك وواتسابك بدون وسيط أو عمولات.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href="/join"
                variant="primary"
                className="w-full sm:w-auto"
              >
                سجّل بياناتك كصنايعي
              </ButtonLink>
              <ButtonLink
                href="/#contact"
                variant="outline"
                className="w-full sm:w-auto"
              >
                تواصل معنا للاستفسار
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
