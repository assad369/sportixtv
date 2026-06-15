import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sportixtv.online";

const nextConfig: NextConfig = {
  cacheComponents: true,
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Channel/team logos and ad banners are admin-supplied URLs from arbitrary hosts.
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Stop MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer for analytics without leaking full URLs
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Prevent IE from switching to quirks mode
          { key: "X-UA-Compatible", value: "IE=edge" },
          // Basic permissions policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Long cache for static assets
        source: "/icons/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/logo/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // llms.txt for AI crawlers
        source: "/llms.txt",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        // Sitemap cache
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Redirect bare www to non-www (or vice versa) — adjust if needed
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${siteUrl.replace(/https?:\/\//, "")}` }],
        destination: `${siteUrl}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
