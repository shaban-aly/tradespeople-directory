"use client";

import { siteContact } from "@/lib/data/site";
import { toArabicDigits } from "@/lib/utils/format";
import { ActionButtons } from "@/components/shared/ui/ActionButtons";
import { ButtonAnchor } from "@/components/shared/ui/Button";
import { ContactForm } from "@/components/home/ContactForm";
import { IconFacebook } from "@/components/shared/icons";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li className="relative flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5">
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 font-heading text-xl font-extrabold text-accent">
        {toArabicDigits(n)}
      </span>
      <h3 className="font-heading text-lg font-bold">{title}</h3>
      <p className="text-center text-sm text-muted">{text}</p>
    </li>
  );
}

export function ContactSection() {
  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto w-full max-w-2xl px-4">
        <Reveal>
          <SectionHeader
            eyebrow="إزاي بيشتغل الموقع"
            title="اوصل للصنايعي في 3 خطوات"
            description="صممناه يبقى أسرع وأقرب حاجة للتواصل مع الصنايعي."
          />
        </Reveal>

        <Reveal delay={80}>
          <ol className="steps-connector mb-8 grid gap-3 sm:grid-cols-3">
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

        <Reveal delay={160}>
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
