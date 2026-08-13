import { ButtonLink } from "@/components/shared/ui/Button";
import { Reveal } from "@/components/shared/ui/Reveal";

export function CtaSection() {
  return (
    <section className="border-t border-border px-4 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal>
          <div className="rounded-3xl bg-accent px-6 py-10 text-center shadow-card">
            <h2 className="font-heading text-2xl font-extrabold text-on-accent sm:text-3xl">
              محتاج صنايعي مش موجود في الدليل؟
            </h2>
            <p className="mt-3 text-base text-on-accent/80">
              ابعتلنا بياناته وهنضيفه في أسرع وقت، ولو عندك استفسار أي وقت كلمنا
              مباشرة.
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
        </Reveal>
      </div>
    </section>
  );
}
