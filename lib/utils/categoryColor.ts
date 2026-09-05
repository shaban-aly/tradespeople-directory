// تعيين لون مميّز لكل تخصص من متغيرات الـ CSS (cat-1 .. cat-12).
// يُستخدم في أيقونات التصنيفات (خلفية + لون) لتمييز كل تخصص بصرياً.

const CAT_INDEX: Record<string, number> = {
  plumbing: 1,
  electrical: 7,
  carpentry: 3,
  hvac: 2,
  painting: 4,
  tiling: 2,
  aluminum: 11,
  metalwork: 1,
  masonry: 8,
  marble: 5,
  glass: 9,
  welding: 8,
  locksmith: 3,
  mechanic: 6,
  appliances: 2,
  upholstery: 10,
  cleaning: 7,
  pest: 11,
  moving: 12,
  elevator: 9,
  satellite: 12,
  security: 1,
  roofing: 8,
  garden: 7,
  parquet: 3,
  kitchen: 4,
  bathroom: 9,
  handyman: 6,
};

// تلويح بسيط بحيث أي تخصص غير معروف ياخد لوناً ثابتاً أيضاً
export function categoryColorIndex(slug: string): number {
  const index = CAT_INDEX[slug];
  if (index) return index;
  const hash = [...slug].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return (hash % 12) + 1;
}

export function categoryColor(slug: string): string {
  return `var(--cat-${categoryColorIndex(slug)})`;
}
