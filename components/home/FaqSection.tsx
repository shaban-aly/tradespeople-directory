import { faqItems } from "@/lib/data/faq";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-4 py-16">
      <Reveal>
        <SectionHeader
          eyebrow="الأسئلة الشائعة"
          title="عندك سؤال؟"
          description="أغلب اللي بيتسال عليه هنا، ولو عندك سؤال تاني كلمنا."
        />
      </Reveal>
      <Reveal delay={80}>
        <FaqAccordion items={faqItems} />
      </Reveal>
    </section>
  );
}
