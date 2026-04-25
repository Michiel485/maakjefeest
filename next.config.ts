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
      afterFiles: [
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
