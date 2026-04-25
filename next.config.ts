import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.maakjefeest.nl",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Passthrough: prevent /_next/ static assets from being caught by the
        // subdomain rewrite below (they'd resolve to a non-existent path → 404).
        {
          source: '/_next/:path*',
          destination: '/_next/:path*',
        },
        // Subdomain rewrite: michiel.maakjefeest.nl/:path* → /events/michiel/:path*
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: '(?<slug>(?!www)[a-z0-9-]+)\\.maakjefeest\\.nl',
            },
          ],
          destination: '/events/:slug/:path*',
        },
      ],
    }
  },
};

export default nextConfig;
