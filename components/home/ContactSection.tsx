import { siteContact } from "@/lib/data/site";
import { ActionButtons } from "@/components/shared/ui/ActionButtons";
import { ButtonAnchor } from "@/components/shared/ui/Button";
import { ContactForm } from "@/components/home/ContactForm";
import { IconFacebook, IconMessageSquare } from "@/components/shared/icons";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";

export function ContactSection() {
  return (
    <section className="border-t border-border bg-card/40 py-16">
      <div className="mx-auto w-full max-w-2xl px-4">
        <Reveal>
          <SectionHeader
            icon={<IconMessageSquare className="h-4 w-4" />}
            eyebrow="خدمة العملاء"
            title={
              <>
                محتاج مساعدة؟{" "}
                <span className="text-accent">تواصل معنا</span>
              </>
            }
            description="فريق دليل الصنايعية جاهز للرد على استفساراتك أو تلقي اقتراحاتك."
          />
        </Reveal>

        <Reveal delay={80}>
          <div
            id="contact"
            className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
          >
            <h3 className="mb-4 text-center font-heading text-xl font-bold">
              تواصل معنا مباشرة
            </h3>
            <div className="flex flex-col gap-2">
              <ActionButtons
                phone={siteContact.phone}
                whatsapp={siteContact.whatsapp}
              />
              <ButtonAnchor
                href={siteContact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                size="md"
                className="w-full"
              >
                <IconFacebook className="h-5 w-5" />
                صفحتنا على فيسبوك
              </ButtonAnchor>
            </div>
            <div className="my-5 flex items-center gap-3 text-sm text-muted">
              <span className="h-px flex-1 bg-border" />
              أو ابعت رسالة
              <span className="h-px flex-1 bg-border" />
            </div>
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
