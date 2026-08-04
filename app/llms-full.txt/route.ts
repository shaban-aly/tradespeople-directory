import { getCategories, getCraftsmen } from "@/lib/db/queries";
import { siteDescription, siteName, siteUrl } from "@/lib/data/site";

export const revalidate = 3600;

export async function GET() {
  const [categories, craftsmen] = await Promise.all([
    getCategories(),
    getCraftsmen(),
  ]);

  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

  const craftsmanSections = craftsmen.map((craftsman) => {
    const category = categoryName.get(craftsman.category) ?? "صنايعي";
    return [
      `## ${craftsman.name}`,
      `- التخصص: ${category}`,
      `- المنطقة: ${craftsman.area} — السويس`,
      `- الهاتف: ${craftsman.phone}`,
      `- واتساب: ${craftsman.whatsapp}`,
      craftsman.description ? `- الوصف: ${craftsman.description}` : null,
      craftsman.verified ? "- موثّق في دليل الصنايعية" : null,
      `- الرابط: ${siteUrl}/craftsman/${craftsman.slug}`,
      "",
    ].filter((line): line is string => line !== null);
  });

  const content = [
    `# ${siteName} — المحتوى الكامل`,
    "",
    `> ${siteDescription}`,
    "",
    `> جميع البيانات من ${siteUrl}/llms.txt (الروابط والفهرس). هذا الملف يحتوي التفاصيل الكاملة للصنايعية المسجلين.`,
    "",
    ...craftsmanSections.flat(),
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
