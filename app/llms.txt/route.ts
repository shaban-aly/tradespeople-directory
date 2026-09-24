import { getCategories, getCraftsmen } from "@/lib/db/queries";
import { siteDescription, siteName, siteUrl } from "@/lib/data/site";
// llms.txt يكفيه تحديث يومي
export const revalidate = 86400; // 24 ساعة بالثواني

const shortDescription = (text: string, max = 120): string =>
  text.length > max ? `${text.slice(0, max).trim()}...` : text;

export async function GET() {
  const [categories, craftsmen] = await Promise.all([
    getCategories(),
    getCraftsmen(),
  ]);

  const lines = [
    `# ${siteName}`,
    "",
    `> ${siteDescription}`,
    "",
    "## صفحات أساسية",
    `- [الرئيسية](${siteUrl}/): ${siteDescription}`,
    `- [كل التخصصات](${siteUrl}/categories): قائمة كل تخصصات الصنايعية في السويس`,
    `- [انضم كصنايعي](${siteUrl}/join): أضف صنايعي للدليل (بعد تسجيل الدخول)`,
    `- [أبلغ عن بيانات](${siteUrl}/report): بلّغ عن رقم أو بيانات غلط في الدليل`,
    "",
    "## التخصصات",
    ...categories.map(
      (category) =>
        `- [${category.name}](${siteUrl}/category/${category.slug}): صنايعية ${category.name} في السويس`,
    ),
    "",
    "## الصنايعية",
    ...craftsmen.map((craftsman) => {
      const note = craftsman.description
        ? shortDescription(craftsman.description)
        : `صنايعي في ${craftsman.area} — السويس`;
      return `- [${craftsman.name}](${siteUrl}/craftsman/${craftsman.slug}): ${note}`;
    }),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
