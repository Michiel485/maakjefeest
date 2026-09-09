// Is deze hostnaam de marketingsite (sayingyes.nl of .be, met of zonder www)?
// Klant-trouwsites draaien op subdomeinen en horen hier niet bij.
// Geen imports: dit bestand wordt ook door client-componenten gebruikt.
export function isMarketingHost(host: string, allowLocalhost = false): boolean {
  const h = host.split(":")[0].toLowerCase()
  if (h === "localhost" || h.endsWith(".localhost") || h === "127.0.0.1") return allowLocalhost
  const base = h === "sayingyes.be" || h.endsWith(".sayingyes.be") ? "sayingyes.be" : "sayingyes.nl"
  return h === base || h === `www.${base}`
}
