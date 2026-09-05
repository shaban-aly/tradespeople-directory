import Link from "next/link";
import Image from "next/image";
import { siteContact, siteNavLinks } from "@/lib/data/site";
import { toArabicDigits } from "@/lib/utils/format";
import { mailtoHref, telHref, whatsappHref } from "@/lib/utils/url";
import {
  IconMail,
  IconPhone,
  IconWhatsApp,
} from "@/components/shared/icons";

export async function Footer() {
  const year = toArabicDigits(new Date().getFullYear());

  return (
    <footer className="border-t border-border bg-card/40">
      <div
        className="h-1 w-full bg-gradient-to-l from-accent via-action to-accent"
        aria-hidden
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2">
              <Image
                src="/favicon.svg"
                alt="دليل الصنايعية"
                width={192}
                height={192}
                className="h-10 w-10 shrink-0 object-contain"
              />
              <span className="font-heading text-xl font-extrabold text-foreground">
                دليل الصنايعية
              </span>
            </Link>
            <p className="mt-3 text-base leading-relaxed text-muted">
              صنعناه لأهل السويس، وراجعنا أرقام كل صنايعي فيه باليد قبل النشر.
            </p>
          </div>

          <nav aria-label="روابط سريعة">
            <h3 className="font-heading text-base font-bold text-foreground">
              روابط سريعة
            </h3>
            <ul className="mt-3 space-y-2">
              {siteNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-base text-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/join"
                  className="text-base text-muted transition-colors hover:text-accent"
                >
                  أضف صنايعي
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              تواصل معنا
            </h3>
            <ul className="mt-3 space-y-3">
              <li>
                <a
                  href={telHref(siteContact.phone)}
                  className="flex items-center gap-2 text-base text-muted transition-colors hover:text-accent"
                >
                  <IconPhone className="h-5 w-5 shrink-0" />
                  <bdi dir="ltr">+20101 997 9315</bdi>
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref(siteContact.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-base text-muted transition-colors hover:text-accent"
                >
                  <IconWhatsApp className="h-5 w-5 shrink-0" />
                  واتساب
                </a>
              </li>
              <li>
                <a
                  href={mailtoHref(siteContact.email)}
                  className="flex items-center gap-2 text-base text-muted transition-colors hover:text-accent"
                >
                  <IconMail className="h-5 w-5 shrink-0" />
                  <bdi dir="ltr">shabanaly@gmail.com</bdi>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-4">
          <p className="text-center text-sm text-muted">
            دليل الصنايعية — كل الأرقام تُراجع يدوياً قبل النشر ودورياً كل أسبوع.
            © {year} تم التطوير بواسطة{" "}
            <a
              className="font-semibold text-accent hover:underline"
              target="_blank"
              href="https://shabanaly.vercel.app/"
            >
              Shaban Aly
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
