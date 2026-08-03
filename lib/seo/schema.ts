import { faqItems } from "@/lib/data/faq";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { siteDescription, siteName, siteUrl } from "@/lib/data/site";

type SchemaItem = {
  "@context": "https://schema.org";
  [key: string]: unknown;
};

export function organizationSchema(): SchemaItem {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteName,
    url: `${siteUrl}/`,
    description: siteDescription,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/web-app-manifest-512x512.png`,
    },
  };
}

export function websiteSchema(): SchemaItem {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: `${siteUrl}/`,
    name: siteName,
    description: siteDescription,
    inLanguage: "ar-EG",
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function homeSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationSchema(), websiteSchema()],
  };
}

export function faqSchema(): SchemaItem {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]): SchemaItem {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function categoryPageSchema(category: Category, craftsmen: Craftsman[]): SchemaItem {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `أفضل ${category.name} في السويس`,
    url: `${siteUrl}/category/${category.slug}`,
    numberOfItems: craftsmen.length,
    itemListElement: craftsmen.map((craftsman, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: craftsman.name,
      url: `${siteUrl}/craftsman/${craftsman.slug}`,
    })),
  };
}

export function allCategoriesSchema(categories: Category[]): SchemaItem {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "كل تصنيفات دليل الصنايعية في السويس",
    numberOfItems: categories.length,
    itemListElement: categories.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: category.name,
      url: `${siteUrl}/category/${category.slug}`,
    })),
  };
}

const LOCAL_BUSINESS_TYPES: Record<string, string> = {
  plumbing: "Plumber",
  electrical: "Electrician",
  hvac: "HVACBusiness",
  painting: "HousePainter",
  tiling: "FlooringContractor",
};

export function craftsmanSchema(
  craftsman: Craftsman,
  categoryName: string,
): SchemaItem {
  const sameAs = (craftsman.socialLinks ?? [])
    .map((link) => link.url)
    .filter((url) => /^https?:\/\//.test(url));

  return {
    "@context": "https://schema.org",
    "@type": LOCAL_BUSINESS_TYPES[craftsman.category] ?? "LocalBusiness",
    "@id": `${siteUrl}/craftsman/${craftsman.slug}#local-business`,
    name: craftsman.name,
    url: `${siteUrl}/craftsman/${craftsman.slug}`,
    image: craftsman.image || `${siteUrl}/web-app-manifest-512x512.png`,
    description:
      craftsman.description || `${craftsman.name} — ${categoryName} في السويس`,
    telephone: craftsman.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: craftsman.area,
      addressRegion: "السويس",
      addressCountry: "EG",
    },
    areaServed: { "@type": "City", name: "السويس" },
    priceRange: "$$",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: craftsman.phone,
      contactType: "customer service",
      areaServed: "EG",
      availableLanguage: "ar",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    founder: { "@type": "Person", name: craftsman.name },
    ...(craftsman.verified ? { award: "موثّق في دليل الصنايعية" } : {}),
    makesOffer: {
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: categoryName },
    },
  };
}
