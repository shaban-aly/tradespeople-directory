import { toArabicDigits } from "@/lib/utils/format";
import { IconClock } from "@/components/shared/icons";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li className="relative flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-5 text-center shadow-card transition-all duration-300 hover:border-accent/60 hover:shadow-md">
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 font-heading text-xl font-extrabold text-accent ring-4 ring-accent/5">
        {toArabicDigits(n)}
      </span>
      <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
      <p className="text-center text-sm text-muted leading-relaxed">{text}</p>
    </li>
  );
}

export function HowItWorksSection() {
  return (
    <section className="border-t border-border py-12 sm:py-16">
      <div className="mx-auto w-full max-w-3xl px-4">
        <Reveal>
          <SectionHeader
            icon={<IconClock className="h-4 w-4" />}
            eyebrow="إزاي بيشتغل الموقع"
            title={
              <>
                اوصل للصنايعي في{" "}
                <span className="text-accent">3 خطوات</span>
              </>
            }
            description="صممناه يبقى أسرع وأقرب حاجة للتواصل مع الصنايعي."
          />
        </Reveal>

        <Reveal delay={80}>
          <ol
            id="how-it-works"
            className="steps-connector grid gap-4 sm:grid-cols-3"
          >
            <Step
              n={1}
              title="اختار التخصص"
              text="من تصنيفات الصفحة الرئيسية"
            />
            <Step n={2} title="اختار الصنايعي" text="كلم اللي قريب من منطقتك" />
            <Step
              n={3}
              title="اتصل أو واتساب"
              text="بضغطة واحدة من غير تسجيل"
            />
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
