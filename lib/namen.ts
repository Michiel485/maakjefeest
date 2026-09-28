// De twee namen van het bruidspaar (28 september 2026).
//
// De namen worden als twee losse velden ingevuld (de start, de bouwers, het
// dashboard) en bewaard als "Michiel & Lindsey". Door die vaste vorm weet elk
// ontwerp waar de ene naam ophoudt en de andere begint, en kiest het zelf wat
// ertussen komt: een & in dezelfde letter, een sierlijke & of een hartje
// (VERBINDER in lib/kaart-ontwerpen.ts). Geen extra kolom in de database.

const VERBINDER_WOORD = /^(&|\+|\||\/|en|and|et|und|y|e)$/i

/**
 * De twee namen los, of null bij één naam of iets heel anders. Kent ook
 * oudere vormen: "Michiel en Lindsey", "Michiel | Lindsey", of de namen op
 * twee regels.
 */
export function splitsNamen(namen: string | null | undefined): [string, string] | null {
  const schoon = (namen ?? "").trim()
  if (!schoon) return null
  // Zoals de velden het bewaren
  const opAmp = schoon.split(/\s*\n\s*&\s*|\s+&\s+/)
  if (opAmp.length === 2 && opAmp[0].trim() && opAmp[1].trim()) return [opAmp[0].trim(), opAmp[1].trim()]
  const regels = schoon.split(/\r?\n/).map((r) => r.trim()).filter((r) => r && !VERBINDER_WOORD.test(r))
  if (regels.length === 2) return [regels[0].replace(/^&\s*/, ""), regels[1].replace(/^&\s*/, "")]
  const m = schoon.replace(/\s+/g, " ").match(/^(.+?)\s+(?:&|\+|\||\/|en|and|et|und|y|e)\s+(.+)$/i)
  return m ? [m[1], m[2]] : null
}

/** Twee losse namen als één regel, zoals hij bewaard wordt */
export function voegNamenSamen(een: string, twee: string): string {
  const a = een.trim()
  const b = twee.trim()
  return a && b ? `${a} & ${b}` : a || b
}
