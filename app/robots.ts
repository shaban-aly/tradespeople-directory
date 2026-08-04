import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/data/site";

const aiAgents = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "anthropic-ai",
  "cohere-ai",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  const publicRules = {
    allow: "/",
    disallow: ["/admin", "/api/"],
  };
  return {
    rules: [
      ...aiAgents.map((userAgent) => ({ userAgent, ...publicRules })),
      { userAgent: "*", ...publicRules },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
