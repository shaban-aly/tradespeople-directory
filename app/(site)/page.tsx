import { JsonLd } from "@/components/shared/seo/JsonLd";
import { Hero } from "@/components/home/Hero";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { CraftsmenSections } from "@/components/home/CraftsmenSections";
import { ContactSection } from "@/components/home/ContactSection";
import { FaqSection } from "@/components/home/FaqSection";
import { faqSchema, homeSchema } from "@/lib/seo/schema";
import { GoogleOneTap } from "@/components/shared/auth/GoogleOneTap";

// لا تحديث دوري — يُبطَّل الكاش عبر Supabase Webhook → /api/webhooks/supabase
export const revalidate = false;

export default function Home() {
  return (
    <>
      <GoogleOneTap />
      <JsonLd data={homeSchema()} />
      <JsonLd data={faqSchema()} />
      <Hero />
      <CategoriesSection />
      <CraftsmenSections />
      <ContactSection />
      <FaqSection />
    </>
  );
}
