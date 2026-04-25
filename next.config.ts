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
        // 1. Keiharde passthrough voor Next.js assets (CSS, JS, media)
        {
          source: '/_next/:path*',
          destination: '/_next/:path*',
        },
        // 2. Optioneel: passthrough voor public map bestanden (zoals favicon.ico)
        {
          source: '/favicon.ico',
          destination: '/favicon.ico',
        },
        // 3. De daadwerkelijke subdomein routing
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
