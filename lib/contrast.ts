// Is een kleur leesbaar op een achtergrond? Voor tekst op een kaart waarvan
// de kleur uit de tekening komt maar de achtergrond uit de kleurstijl. Goud
// op terracotta viel bijvoorbeeld weg (Michiel, 26 september 2026).

function kanaal(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function licht(hex: string): number | null {
  const h = hex.trim().replace("#", "")
  const vol = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6)
  if (!/^[0-9a-f]{6}$/i.test(vol)) return null
  const [r, g, b] = [0, 2, 4].map((i) => kanaal(parseInt(vol.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** De contrastverhouding volgens de webrichtlijnen, van 1 (gelijk) tot 21 (zwart op wit) */
export function contrast(a: string, b: string): number {
  const x = licht(a)
  const y = licht(b)
  if (x === null || y === null) return 21
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/**
 * De kleur zelf als hij genoeg afsteekt, anders het eerste alternatief dat
 * dat wel doet, en anders wit of donker, wat het best leest. De grens van 2
 * ligt bewust lager dan de webrichtlijn: goud op crème, zoals veel kaarten
 * het hebben, haalt ongeveer 2,4 en leest prima. Wat eronder valt, zoals goud
 * op terracotta (1,1), valt echt weg.
 */
export function leesbaar(kleur: string, achtergrond: string, alternatieven: string[] = [], grens = 2): string {
  if (contrast(kleur, achtergrond) >= grens) return kleur
  for (const k of alternatieven) if (contrast(k, achtergrond) >= grens) return k
  return contrast("#FFFFFF", achtergrond) >= contrast("#2B2622", achtergrond) ? "#FFFFFF" : "#2B2622"
}
