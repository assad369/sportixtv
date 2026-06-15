import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: [
      // General: index everything public
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin", "/api", "/favorites", "/offline"],
      },
      // Google — full access for all Google bots
      {
        userAgent: ["Googlebot", "Googlebot-Image", "Googlebot-Video"],
        allow: ["/"],
        disallow: ["/admin", "/api"],
      },
      // AI search crawlers — allow for discoverability in AI answers
      {
        userAgent: [
          "GPTBot",           // OpenAI / ChatGPT
          "Claude-Web",       // Anthropic / Claude
          "PerplexityBot",    // Perplexity AI
          "anthropic-ai",     // Anthropic
          "CCBot",            // Common Crawl (used by many AI models)
          "Omgilibot",        // Webz.io data partner
          "FacebookBot",      // Meta AI
          "Applebot",         // Apple Siri / Spotlight
          "Bingbot",          // Microsoft Copilot / Bing
        ],
        allow: ["/"],
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
