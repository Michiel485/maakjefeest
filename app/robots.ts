import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/aanmaken", "/contact", "/privacy", "/voorwaarden"],
        disallow: ["/dashboard", "/bouwen", "/betalen", "/succes", "/admin", "/inloggen", "/api", "/events"],
      },
    ],
    sitemap: "https://sayingyes.nl/sitemap.xml",
  }
}
