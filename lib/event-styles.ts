import { getTitleFont } from "./title-fonts"

export const STYLE_CONFIG = {
  roze: {
    accent: "#E8627A",
    heroGradient: "linear-gradient(135deg, #fff0f3, #fce7e7, #fff5ee)",
    fontFamily: "Inter, sans-serif",
    nameFont: null as string | null,
    navBg: "#ffffff",
    navText: "#374151",
    headingColor: "#1a1a1a",
    bodyText: "#4b5563",
    buttonBg: "#E8627A",
    buttonText: "#ffffff",
    labelColor: "#E8627A",
    bodyBg: "#f1f5f9",
    floral: false as boolean,
    fontImport: null as string | null,
  },
  ivoor: {
    accent: "#8B7355",
    heroGradient: "linear-gradient(160deg, #FDFAF5 0%, #F5EDE0 55%, #EDE0CF 100%)",
    fontFamily: "'Cormorant Garamond', serif",
    nameFont: null as string | null,
    navBg: "#FDFAF5",
    navText: "#4A3E30",
    headingColor: "#2D2217",
    bodyText: "#6B5E4F",
    buttonBg: "#7A9478",
    buttonText: "#ffffff",
    labelColor: "#C4A265",
    bodyBg: "#EDE7DC",
    floral: true as boolean,
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');",
  },
  zand: {
    accent: "#C5A059",
    heroGradient: "linear-gradient(135deg, #FAF8F5, #F3EFEA, #EDE8DF)",
    fontFamily: "'Cormorant Garamond', serif",
    nameFont: "'Pinyon Script', cursive" as string | null,
    navBg: "#FAF8F5",
    navText: "#3A352F",
    headingColor: "#3A352F",
    bodyText: "#3A352F",
    buttonBg: "#C5A059",
    buttonText: "#ffffff",
    labelColor: "#C5A059",
    bodyBg: "#F3EFEA",
    floral: false as boolean,
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Pinyon+Script&display=swap');",
  },
  earthy: {
    accent: "#A0785A",
    heroGradient: "linear-gradient(135deg, #FAF7F2, #EFE4D6, #E5D5C0)",
    fontFamily: "Inter, sans-serif",
    nameFont: null as string | null,
    navBg: "#FAF7F2",
    navText: "#2C1A0E",
    headingColor: "#2C1A0E",
    bodyText: "#6B4F3A",
    buttonBg: "#A0785A",
    buttonText: "#ffffff",
    labelColor: "#A0785A",
    bodyBg: "#F0E8DC",
    floral: false as boolean,
    fontImport: null as string | null,
  },
} as const

export type Style = keyof typeof STYLE_CONFIG

export interface SC {
  accent: string
  heroGradient: string
  fontFamily: string
  nameFont: string | null
  navBg: string
  navText: string
  headingColor: string
  bodyText: string
  buttonBg: string
  buttonText: string
  labelColor: string
  bodyBg: string
  floral: boolean
  fontImport: string | null
  titleFont: string
  titleFontWeight: number
}

export const TYPE_LABEL: Record<string, string> = {
  bruiloft: "Bruiloft",
  verjaardag: "Verjaardag",
  evenement: "Evenement",
}

export function getStyleConfig(style: string, titleFontId?: string | null): SC {
  const base = style in STYLE_CONFIG ? STYLE_CONFIG[style as Style] : STYLE_CONFIG.roze
  const { family, weight } = getTitleFont(titleFontId)
  return { ...base, titleFont: family, titleFontWeight: weight }
}

export function formatDate(iso: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
