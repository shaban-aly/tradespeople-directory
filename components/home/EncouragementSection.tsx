import { Reveal } from "@/components/shared/ui/Reveal";
import { IconHeartHandshake } from "@/components/shared/icons";

export function EncouragementSection() {
  return (
    <section id="encourage" className="border-t border-border py-16">
      <div className="mx-auto w-full max-w-3xl px-4">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card sm:p-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
              <IconHeartHandshake className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
              عاجبك المشروع؟ شجعنا!
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted">
              «دليل الصنايعية» لسه في بدايته، ومستقبله بيحدده تفاعلكم معاه.
              جرّب الدليل، ابعته لأهلك وصحابك، واكتبلنا رأيك — لو شفنا إن
              الناس مستفيدة ومبسوطة، هنكمّل ونطوّره لشكل أكبر وأحسن.
            </p>
            <a
              href="#contact"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-8 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
            >
              قولنا رأيك
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
