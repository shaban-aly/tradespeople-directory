export const siteContact = {
  phone: "+201019979315",
  whatsapp: "201019979315",
  email: "shabanaly1997@gmail.com",
  facebook: "https://www.facebook.com/sanay.suze/",
};

// ثوابت السيو
export const siteUrl = "https://sanay.daleel-al-suez.com";
export const siteName = "دليل الصنايعية";
export const siteTagline = "دليل الصنايعية — السويس";
export const siteDescription =
  "اعثر على صنايعي محترف في مدينة السويس (سباكة، كهرباء، نجارة...) واتصل به أو راسله واتساب مباشرة في ثوانٍ.";

export const siteNavLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/categories", label: "التصنيفات" },
  { href: "/favorites", label: "محفوظاتي" },
  { href: "/#contact", label: "تواصل معنا" },
];

// صورة لكل حجم شاشة (الصور في public/hero-images/).
export type HeroImage = { src: string; media: string };

// شريحة عرض الهيرو: صورة موبايل + صورة ديسكتوب.
export type HeroSlide = {
  alt: string;
  images: HeroImage[];
};

export const heroSlides: HeroSlide[] = [
  {
    alt: "مجموعة صنايعية أثناء العمل",
    images: [
      { src: "/hero-images/groub_mobile.webp", media: "(max-width: 767px)" },
      { src: "/hero-images/groub_desktop.webp", media: "(min-width: 768px)" },
    ],
  },
  {
    alt: "صنايعي سباك أثناء العمل",
    images: [
      { src: "/hero-images/pol_mobile.webp", media: "(max-width: 767px)" },
      { src: "/hero-images/pol_desktop.webp", media: "(min-width: 768px)" },
    ],
  },
  {
    alt: "صنايعي كهربائي أثناء العمل",
    images: [
      { src: "/hero-images/elc_mobile.webp", media: "(max-width: 767px)" },
      { src: "/hero-images/elc_desktop.webp", media: "(min-width: 768px)" },
    ],
  },
];

// عدد التصنيفات المعروضة في قسم التصنيفات بالصفحة الرئيسية (الباقي في /categories).
export const homeCategoriesLimit = 6;
