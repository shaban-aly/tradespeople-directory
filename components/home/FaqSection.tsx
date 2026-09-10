import { faqItems } from "@/lib/data/faq";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";
import { IconHeartHandshake } from "@/components/shared/icons";

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-4 py-16">
      <Reveal>
        <SectionHeader
          icon={<IconHeartHandshake className="h-4 w-4" />}
          eyebrow="الأسئلة الشائعة"
          title={
            <>
              عندك أي{" "}
              <span className="text-accent">استفسار</span>؟
            </>
          }
          description="إجابات واضحة ومباشرة على أكثر الأسئلة اللي بتوصلنا عن كيفية استخدام الدليل والتواصل مع الصنايعية."
        />
      </Reveal>
      <Reveal delay={80}>
        <FaqAccordion items={faqItems} />
      </Reveal>
    </section>
  );
}
