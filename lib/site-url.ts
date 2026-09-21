const IS_PROD = process.env.NODE_ENV === "production"

/**
 * Canonieke URL van de marketingsite. Vercel stuurt sayingyes.nl door naar
 * www.sayingyes.nl, dus canonicals, sitemap en structured data wijzen daar ook
 * naartoe: één versie voor Google. Klant-sites blijven op [slug].sayingyes.nl.
 */
export const MARKETING_URL = "https://www.sayingyes.nl"

/**
 * De link naar een digitale kaart, altijd absoluut en altijd op het echte
 * domein. Dit bestaat apart omdat zo'n link op papier kan belanden: zet je een
 * QR-code op je trouwkaart, dan gaat hij naar de drukker en is hij niet meer te
 * wijzigen. Het domein van het verzoek is daarvoor niet goed genoeg, want op
 * een voorvertoningsdomein van Vercel zou die code naar een tijdelijke URL
 * wijzen, en dat merk je pas als de kaarten al op de mat liggen.
 */
export function kaartUrl(token: string, origin?: string): string {
  return IS_PROD ? `${MARKETING_URL}/kaart/${token}` : `${origin ?? "http://localhost:3000"}/kaart/${token}`
}

/**
 * Returns the public URL for a published event site.
 * - Production: https://[slug].sayingyes.nl  (subdomain routing via proxy)
 * - Development: /events/[slug]              (path routing, port-agnostic)
 */
export function eventSiteUrl(slug: string): string {
  return IS_PROD ? `https://${slug}.sayingyes.nl` : `/events/${slug}`
}

/**
 * Human-readable label for the URL.
 * Pass `window.location.host` from client components to get the correct port in dev.
 */
export function eventSiteLabel(slug: string, host?: string): string {
  if (IS_PROD) return `${slug}.sayingyes.nl`
  return `${host ?? "localhost:3000"}/events/${slug}`
}
