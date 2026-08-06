import { JsonLd } from "@/components/shared/seo/JsonLd";
import { Hero } from "@/components/home/Hero";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { CraftsmenSections } from "@/components/home/CraftsmenSections";
import { ContactSection } from "@/components/home/ContactSection";
import { FaqSection } from "@/components/home/FaqSection";
import { EncouragementSection } from "@/components/home/EncouragementSection";
import { faqSchema, homeSchema } from "@/lib/seo/schema";

export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <JsonLd data={homeSchema()} />
      <JsonLd data={faqSchema()} />
      <Hero />
      <CategoriesSection />
      <CraftsmenSections />
      <ContactSection />
      <FaqSection />
      <EncouragementSection />
    </>
  );
}
