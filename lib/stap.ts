// De stappen van de funnel meten met de eigen, anonieme teller: namen getypt,
// bouwer geopend, betaald. Elke stap telt als een paginaweergave op
// /stap/<naam>, zodat hij vanzelf in het dagelijkse bezoekersoverzicht staat
// (lib/visitors.ts). Zo weten we na een maand waar het lekt (ontwerpronde,
// ronde 7, 2 oktober 2026). Alleen in de browser, en nooit belangrijker dan
// de pagina zelf.

export type Stap = "namen" | "kaart-bouwer" | "site-bouwer" | "betaald"

export function meetStap(naam: Stap) {
  if (typeof window === "undefined") return
  try {
    const payload = JSON.stringify({ path: `/stap/${naam}`, referrer: document.referrer || null })
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }))
    } else {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {})
    }
  } catch {}
}
