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
};

export default nextConfig;
