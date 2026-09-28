// Een fout in de browser van een bezoeker doorgeven aan de server, die er een
// mail van maakt (app/api/fout, 28 september 2026).

let gemeld = 0

// Ruis die niets met onze code te maken heeft: extensies, scripts van
// anderen, en een bekende onschuldige melding van de browser zelf
const RUIS = /ResizeObserver loop|^Script error\.?$|chrome-extension:|moz-extension:|safari-extension:|Non-Error promise rejection|Load failed|Failed to fetch|NetworkError|AbortError|The operation was aborted/i

export function meldInBrowser(fout: unknown, waar: string): void {
  try {
    const bericht = fout instanceof Error ? fout.message : String((fout as { message?: unknown })?.message ?? fout)
    const stapel = fout instanceof Error ? fout.stack ?? "" : ""
    if (!bericht || RUIS.test(bericht) || RUIS.test(stapel)) return
    // Hoogstens drie per bezoek aan een pagina
    if (gemeld >= 3) return
    gemeld++
    void fetch("/api/fout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bericht: bericht.slice(0, 500), stapel: stapel.slice(0, 2000), pad: window.location.pathname, waar }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}
