export const TITLE_FONT_OPTIONS = [
  { id: "allura",       label: "Allura",            cssVar: "--font-allura",      weight: 400, google: "Allura" },
  // Het eerste lettertype is ook wat een onbekende keuze wordt: Allura blijft vooraan
  { id: "abril",        label: "Abril Fatface",      cssVar: "--font-abril",       weight: 400, google: "Abril Fatface" },
  // Het handschrift van "Wij gaan trouwen" op Foto met handschrift (Michiel, 26 september 2026)
  { id: "allison",      label: "Allison",            cssVar: "--font-allison",     weight: 400, google: "Allison" },
  { id: "bodonimoda",   label: "Bodoni Moda",        cssVar: "--font-bodonimoda",  weight: 400, google: "Bodoni Moda" },
  { id: "cinzel",       label: "Cinzel",             cssVar: "--font-cinzel",      weight: 400, google: "Cinzel" },
  { id: "cormorant",    label: "Cormorant Garamond", cssVar: "--font-cormorant",   weight: 300, google: "Cormorant Garamond" },
  { id: "dancing",      label: "Dancing Script",     cssVar: "--font-dancing",     weight: 400, google: "Dancing Script" },
  { id: "gfsdidot",     label: "GFS Didot",          cssVar: "--font-gfsdidot",    weight: 400, google: "GFS Didot" },
  { id: "greatvibes",   label: "Great Vibes",        cssVar: "--font-greatvibes",  weight: 400, google: "Great Vibes" },
  { id: "italiana",     label: "Italiana",           cssVar: "--font-italiana",    weight: 400, google: "Italiana" },
  { id: "jost",         label: "Jost",               cssVar: "--font-jost",        weight: 400, google: "Jost" },
  { id: "lora",         label: "Lora",               cssVar: "--font-lora",        weight: 500, google: "Lora" },
  { id: "marcellus",    label: "Marcellus",          cssVar: "--font-marcellus",   weight: 400, google: "Marcellus" },
  { id: "montserrat",   label: "Montserrat",         cssVar: "--font-montserrat",  weight: 500, google: "Montserrat" },
  { id: "pinyonscript", label: "Pinyon Script",      cssVar: "--font-pinyonscript",weight: 400, google: "Pinyon Script" },
  { id: "playfair",     label: "Playfair Display",   cssVar: "--font-playfair",    weight: 700, google: "Playfair Display" },
  { id: "prata",        label: "Prata",              cssVar: "--font-prata",       weight: 400, google: "Prata" },
] as const

export type TitleFontId = typeof TITLE_FONT_OPTIONS[number]["id"]

export function getTitleFont(id?: string | null) {
  const opt = TITLE_FONT_OPTIONS.find(f => f.id === id) ?? TITLE_FONT_OPTIONS[0]
  return { family: `var(${opt.cssVar})`, weight: opt.weight }
}

/** Het lettertype zoals lib/letterbreedtes.ts het kent, om de namen passend te maken */
export function gemetenLetter(id?: string | null): { google: string; gewicht: number } | null {
  const opt = TITLE_FONT_OPTIONS.find(f => f.id === id)
  return opt ? { google: opt.google, gewicht: opt.weight } : null
}
