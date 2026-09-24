/**
 * نصوص وبيانات السيو والكلمات المفتاحية لمشروع «دليل الصنايعية - السويس»
 * ملف مركزي لإدارة وصيانة جميع الكلمات المفتاحية ونصوص العناوين والأوصاف وقوالب الميتا.
 */

// ==========================================
// 1. الكلمات المفتاحية العامة للموقع (Global Keywords)
// ==========================================
export const siteKeywords: string[] = [
  // الهوية والدليل
  "دليل الصنايعية",
  "صنايعية السويس",
  "أرقام صنايعية السويس",
  "حرفيين السويس",
  "دليل خدمات السويس",
  "صنايعي شاطر في السويس",
  "صيانة منزلية السويس",

  // المهن الأساسية في السويس
  "سباك في السويس",
  "كهربائي في السويس",
  "فني تكييف في السويس",
  "نجار في السويس",
  "نقاش في السويس",
  "تركيب سيراميك السويس",
  "فني ألوميتال السويس",
  "صيانة أجهزة منزلية السويس",
  "تركيب دش السويس",
  "كاميرات مراقبة السويس",
  "جبسمبورد السويس",
  "حدادة السويس",

  // أحياء ومناطق السويس
  "صنايعية الأربعين",
  "صنايعية فيصل السويس",
  "صنايعية الصباح",
  "صنايعية بورتوفيق",
  "صنايعية الجناين",
  "صنايعية السلام السويس",
  "صنايعية المستقبل",

  // الطوارئ والموثوقية
  "سباك طوارئ السويس",
  "كهربائي منازل شاطر",
  "صنايعية موثوقين بالسويس",
];

// ==========================================
// 2. سيو صفحة كل التصنيفات (/categories)
// ==========================================
export const categoriesSeo = {
  title: "كل تخصصات الصنايعية في السويس",
  description:
    "تصفح جميع تخصصات الحرفيين والصنايعية في محافظة السويس (سباكة، كهرباء، تكييف، نجارة، نقاشة...) وتواصل مع الفنيين مباشرة.",
  ogTitle: "كل تخصصات الصنايعية في السويس — دليل الصنايعية",
  ogDescription:
    "تصفح جميع تخصصات الحرفيين والصنايعية في محافظة السويس واختار الأنسب لك.",
  keywords: [
    "تصنيفات الصنايعية بالسويس",
    "تخصصات الحرفيين بالسويس",
    "صنايعية السويس",
    "دليل المهن بالسويس",
    "سباكين السويس",
    "كهربائية السويس",
    "فنيين تكييف السويس",
  ],
};

// ==========================================
// 3. سيو صفحات التخصصات (/category/[slug])
// ==========================================
export function getCategorySeo(categoryName: string, singularName: string, pluralName: string) {
  const title = `صنايعية ${categoryName} في السويس`;
  const description = `دليل أفضل أرقام ${pluralName} في محافظة السويس. اختر ${singularName} الأقرب لمنطقتك واتصل به أو راسله واتساب مباشرة بدون وسيط.`;
  const ogTitle = `${title} — دليل الصنايعية`;

  const keywords = [
    `صنايعية ${categoryName} بالسويس`,
    `${pluralName} السويس`,
    `${singularName} شاطر في السويس`,
    `أرقام ${pluralName} السويس`,
    `فني ${categoryName} السويس`,
    `${singularName} الأربعين`,
    `${singularName} فيصل السويس`,
    `${categoryName} السويس`,
    "صنايعية السويس",
    "دليل الصنايعية",
  ];

  return {
    title,
    description,
    ogTitle,
    keywords,
  };
}

// ==========================================
// 4. سيو صفحات الصنايعية (/craftsman/[slug])
// ==========================================
export interface CraftsmanSeoParams {
  name: string;
  categoryName: string;
  singularName: string;
  pluralName: string;
  area: string;
  customDescription?: string | null;
}

export function getCraftsmanSeo({
  name,
  categoryName,
  singularName,
  pluralName,
  area,
  customDescription,
}: CraftsmanSeoParams) {
  const safeArea = area || "السويس";
  const title = `${name} — ${singularName} في ${safeArea}`;
  const description =
    customDescription ||
    `${name}، ${singularName} شاطر في ${safeArea} بمحافظة السويس. اتصل مباشرة أو راسله واتساب بدون وسيط.`;
  const ogTitle = `${name} — ${singularName} في ${safeArea} | دليل الصنايعية`;
  const imageAlt = `صورة ${name} — ${singularName} في السويس`;

  const keywords = [
    name,
    `${singularName} في السويس`,
    `${singularName} في ${safeArea}`,
    `أفضل ${singularName} في ${safeArea}`,
    `رقم ${singularName} في السويس`,
    `${categoryName} بالسويس`,
    "صنايعية السويس",
    "دليل الصنايعية",
  ];

  return {
    title,
    description,
    ogTitle,
    imageAlt,
    keywords,
  };
}
