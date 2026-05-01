const IS_PROD = process.env.NODE_ENV === "production"

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
