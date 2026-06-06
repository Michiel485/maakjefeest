export const TITLE_FONT_OPTIONS = [
  { id: "allura",       label: "Allura",            cssVar: "--font-allura",      weight: 400 },
  { id: "bodonimoda",   label: "Bodoni Moda",        cssVar: "--font-bodonimoda",  weight: 400 },
  { id: "cinzel",       label: "Cinzel",             cssVar: "--font-cinzel",      weight: 400 },
  { id: "cormorant",    label: "Cormorant Garamond", cssVar: "--font-cormorant",   weight: 300 },
  { id: "dancing",      label: "Dancing Script",     cssVar: "--font-dancing",     weight: 400 },
  { id: "gfsdidot",     label: "GFS Didot",          cssVar: "--font-gfsdidot",    weight: 400 },
  { id: "greatvibes",   label: "Great Vibes",        cssVar: "--font-greatvibes",  weight: 400 },
  { id: "italiana",     label: "Italiana",           cssVar: "--font-italiana",    weight: 400 },
  { id: "lora",         label: "Lora",               cssVar: "--font-lora",        weight: 500 },
  { id: "marcellus",    label: "Marcellus",          cssVar: "--font-marcellus",   weight: 400 },
  { id: "montserrat",   label: "Montserrat",         cssVar: "--font-montserrat",  weight: 500 },
  { id: "pinyonscript", label: "Pinyon Script",      cssVar: "--font-pinyonscript",weight: 400 },
  { id: "playfair",     label: "Playfair Display",   cssVar: "--font-playfair",    weight: 700 },
  { id: "windsong",     label: "WindSong",           cssVar: "--font-windsong",    weight: 400 },
] as const

export type TitleFontId = typeof TITLE_FONT_OPTIONS[number]["id"]

export function getTitleFont(id?: string | null) {
  const opt = TITLE_FONT_OPTIONS.find(f => f.id === id) ?? TITLE_FONT_OPTIONS[0]
  return { family: `var(${opt.cssVar})`, weight: opt.weight }
}
