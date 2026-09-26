import type { Category } from "@/lib/data/craftsmen";

// التخصصات الافتراضية الاحتياطية لضمان عمل الصفحة حتى لو تعذر جلب البيانات
export const FALLBACK_CATEGORIES = [
  { slug: "plumbing", name: "سباكة", icon: "plumbing", count: 0 },
  { slug: "electrical", name: "كهرباء", icon: "electrical", count: 0 },
  { slug: "hvac", name: "تكييف", icon: "hvac", count: 0 },
  { slug: "carpentry", name: "نجارة", icon: "carpentry", count: 0 },
  { slug: "painting", name: "نقاشة", icon: "painting", count: 0 },
  { slug: "aluminum", name: "ألوميتال", icon: "aluminum", count: 0 },
];

export function getHeroSearchTags(allCategories: (Category & { count: number })[]) {
  const activeCategories = allCategories.filter((c) => c.count > 0);
  return (
    activeCategories.length >= 4
      ? activeCategories
      : allCategories.length > 0
      ? allCategories
      : FALLBACK_CATEGORIES
  ).slice(0, 6);
}
