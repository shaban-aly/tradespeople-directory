import { IconShieldCheck, IconUsers, IconHeartHandshake } from "@/components/shared/icons";

export function JoinBenefits() {
  return (
    <section className="rounded-2xl border border-border/80 bg-linear-to-b from-card to-background/50 p-5 shadow-xs sm:p-6">
      <h3 className="font-heading text-base font-bold text-foreground">
        لماذا تنضم إلى دليل السويس؟
      </h3>
      <p className="mt-1 text-xs text-muted leading-relaxed">
        منصة محلية مصممة لمساعدة أصحاب المهن على تنمية أعمالهم وتسهيل تواصل العملاء معهم.
      </p>

      <ul className="mt-4 space-y-3.5 text-xs sm:text-sm text-muted">
        <li className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent ring-4 ring-accent/5">
            <IconUsers className="h-4 w-4" />
          </div>
          <div>
            <strong className="block font-bold text-foreground">
              وصول مباشر لزبائن منطقتك
            </strong>
            <span className="text-muted leading-relaxed">
              أهالي السويس يبحثون يومياً عن فنيين وصنايعية ثقة في مختلف المناطق للتواصل الفوري.
            </span>
          </div>
        </li>

        <li className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-action/15 text-action ring-4 ring-action/5">
            <IconHeartHandshake className="h-4 w-4" />
          </div>
          <div>
            <strong className="block font-bold text-foreground">
              الاتفاق مع العميل يخصك انت بالكامل
            </strong>
            <span className="text-muted leading-relaxed">
              لا وساطة ولا تدخل في تفاصيل شغلك — الاتفاق والأسعار وشروط العمل تحددها بنفسك مع العميل.
            </span>
          </div>
        </li>

        <li className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent ring-4 ring-accent/5">
            <IconShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <strong className="block font-bold text-foreground">
              صفحة مهنية وتوثيق معتمد
            </strong>
            <span className="text-muted leading-relaxed">
              ملف شخصي يعرض تخصصك وصور أعمالك، مع إمكانية تحديث أرقامك وبياناتك في أي وقت.
            </span>
          </div>
        </li>
      </ul>
    </section>
  );
}
