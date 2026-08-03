import type { MetadataRoute } from "next";
import { getCategories, getCraftsmen } from "@/lib/db/queries";
import { siteUrl } from "@/lib/data/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, craftsmen] = await Promise.all([
    getCategories(),
    getCraftsmen(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/categories`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/join`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/category/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const craftsmanRoutes: MetadataRoute.Sitemap = craftsmen.map((craftsman) => ({
    url: `${siteUrl}/craftsman/${craftsman.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
    lastModified: craftsman.addedAt,
  }));

  return [...staticRoutes, ...categoryRoutes, ...craftsmanRoutes];
}
