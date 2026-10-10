import { IconPhone, IconShieldCheck } from "@/components/shared/icons";

export function JoinHeader() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        انضم كصنايعي إلى دليل السويس
      </h1>
      <p className="text-base leading-relaxed text-muted sm:text-lg">
        سجّل بياناتك وتخصصك لتصل إلى العملاء في مختلف مناطق السويس — تواصل
        مباشر، وتوثيق رسمي، واتفاقك وشروط عملك مع الزبون مباشرة.
      </p>

      {/* شريط مزايا سريعة بترميز لوني دلالي */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent shadow-2xs">
          <IconPhone className="h-3.5 w-3.5" />
          <span>تواصل مباشر هاتف وواتساب</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent shadow-2xs">
          <IconShieldCheck className="h-3.5 w-3.5" />
          <span>توثيق رسمي لرفع ثقة الزبائن</span>
        </span>
      </div>
    </div>
  );
}
