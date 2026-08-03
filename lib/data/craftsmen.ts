export type SocialPlatform = "facebook" | "instagram" | "tiktok" | "other";

export type SocialLink = {
  platform: SocialPlatform;
  url: string;
};

export type Craftsman = {
  id: string;
  slug: string;
  name: string;
  category: string; // slug زي 'plumbing'
  image: string; // رابط الصورة (في Supabase Storage أو خارجي)
  phone: string; // بصيغة +20...
  whatsapp: string;
  area: string; // اسم المنطقة
  description: string;
  verified: boolean;
  addedAt: string; // تاريخ الإضافة بصيغة ISO
  socialLinks?: SocialLink[]; // روابط سوشيال اختيارية
};

export type Category = {
  slug: string;
  name: string; // بالعربي
  icon: string; // اسم الأيقونة اللي هنرسمها كـ component
};

export type CategoryWithCount = Category & {
  count: number;
};

export type CraftsmanSort = "verified" | "recent";

export function filterByArea(list: Craftsman[], area: string): Craftsman[] {
  if (!area || area === "all") return list;
  return list.filter((c) => c.area === area);
}

export function getAvailableAreas(list: Craftsman[], areas: string[]): string[] {
  const usedAreas = new Set(list.map((c) => c.area));
  return areas.filter((area) => usedAreas.has(area));
}

export function sortCraftsmen(list: Craftsman[], sort: CraftsmanSort): Craftsman[] {
  return [...list].sort((a, b) => {
    if (sort === "verified" && a.verified !== b.verified) {
      return Number(b.verified) - Number(a.verified);
    }

    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });
}
