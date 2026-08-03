import { Footer } from "@/components/shared/layout/Footer";
import { Header } from "@/components/shared/layout/Header";
import { JsonLd } from "@/components/shared/seo/JsonLd";
import { Hero } from "@/components/home/Hero";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedCraftsmen } from "@/components/home/FeaturedCraftsmen";
import { ContactSection } from "@/components/home/ContactSection";
import { FaqSection } from "@/components/home/FaqSection";
import { EncouragementSection } from "@/components/home/EncouragementSection";
import { faqSchema, homeSchema } from "@/lib/seo/schema";

export const revalidate = 3600;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <JsonLd data={homeSchema()} />
        <JsonLd data={faqSchema()} />
        <Hero />
        <CategoriesSection />
        <FeaturedCraftsmen />
        <ContactSection />
        <FaqSection />
        <EncouragementSection />
      </main>
      <Footer />
    </div>
  );
}
