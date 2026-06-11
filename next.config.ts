import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      // Channel/team logos and ad banners are admin-supplied URLs from arbitrary hosts.
      { protocol: "https", hostname: "**" },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
