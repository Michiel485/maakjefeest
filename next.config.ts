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
        // 1. Rewrite expliciet voor de root (/) van het subdomein
        {
          source: '/',
          has: [
            {
              type: 'host',
              value: '(?<slug>(?!www)[a-z0-9-]+)\\.maakjefeest\\.nl',
            },
          ],
          destination: '/events/:slug',
        },
        // 2. Rewrite voor alle andere paden, BEHALVE interne Next.js assets en API
        {
          source: '/:path((?!_next|api|_vercel|favicon\\.ico).*)',
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
