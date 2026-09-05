import { ButtonLink } from "@/components/shared/ui/Button";
import { Reveal } from "@/components/shared/ui/Reveal";

const dotPattern = `url("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.14'%3E%3Ccircle cx='2' cy='2' r='1.6'/%3E%3C/g%3E%3C/svg%3E")`;

export function CtaSection() {
  return (
    <section className="border-t border-border px-4 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl bg-accent px-6 py-10 text-center shadow-card"
            style={{ backgroundImage: dotPattern }}
          >
            <div className="relative">
              <h2 className="font-heading text-2xl font-extrabold text-on-accent sm:text-3xl">
                مش لاقي الصنايعي اللي عايزه؟
              </h2>
              <p className="mt-3 text-base text-on-accent/85">
                كلّمنا على واتساب وهنساعدك — بنراجع الأرقام يدوياً وبنضيف
                صنايعية جدد كل أسبوع.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink
                  href="/join"
                  variant="onAccent"
                  className="w-full sm:w-auto"
                >
                  أضف صنايعي
                </ButtonLink>
                <ButtonLink
                  href="/#contact"
                  variant="onAccentGhost"
                  className="w-full sm:w-auto"
                >
                  تواصل معنا
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
