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
  { href: "/#featured", label: "الصنايعية المميزين" },
  { href: "/#contact", label: "تواصل معنا" },
];

// فيديوهات خلفية الهيرو حسب مقاس الشاشة (الملفات في public/).
export type HeroVideoSource = { src: string; media: string };

export const heroVideos: HeroVideoSource[] = [
  { src: "/hero-mobile.mp4", media: "(max-width: 767px)" },
  { src: "/hero-decktop.mp4", media: "(min-width: 768px)" },
];

// عدد التصنيفات المعروضة في قسم التصنيفات بالصفحة الرئيسية (الباقي في /categories).
export const homeCategoriesLimit = 6;
