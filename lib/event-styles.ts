import { getTitleFont } from "./title-fonts"

export const STYLE_CONFIG = {
  roze: {
    accent: "#C5A059",
    heroGradient: "linear-gradient(135deg, #EBC0B4, #E2A796, #D99080)",
    fontFamily: "var(--font-lora), serif",
    nameFont: null as string | null,
    navBg: "#E2A796",
    navText: "#3A1E0D",
    headingColor: "#3A1E0D",
    bodyText: "#5A2E1E",
    buttonBg: "#C5A059",
    buttonText: "#ffffff",
    labelColor: "#C5A059",
    bodyBg: "#D99080",
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "0.02em",
    bodyFontWeight: "400",
    fontImport: null as string | null,
  },
  ivoor: {
    accent: "#9CA996",
    heroGradient: "linear-gradient(160deg, #FDFAF6 0%, #F4F0E8 60%, #EBE6DF 100%)",
    fontFamily: "var(--font-montserrat), sans-serif",
    nameFont: null as string | null,
    navBg: "#FDFAF6",
    navText: "#4A4440",
    headingColor: "#3D3530",
    bodyText: "#6B6257",
    buttonBg: "#9CA996",
    buttonText: "#ffffff",
    labelColor: "#B5A898",
    bodyBg: "#EBE6DF",
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: null as string | null,
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
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Pinyon+Script&display=swap');",
  },
  earthy: {
    accent: "#5A6B5D",
    heroGradient: "linear-gradient(135deg, #EDE9E1, #DDD5C5, #CABFAB)",
    fontFamily: "var(--font-lora), serif",
    nameFont: null as string | null,
    navBg: "#F5F2ED",
    navText: "#2A1A10",
    headingColor: "#2A1A10",
    bodyText: "#4A3728",
    buttonBg: "#5A6B5D",
    buttonText: "#ffffff",
    labelColor: "#8A4B53",
    bodyBg: "#ECEBE4",
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "500",
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
  floralFilter: string | null
  bodyLetterSpacing: string
  bodyFontWeight: string
  fontImport: string | null
  fontHero: string
  fontHeroWeight: number
  fontInitials: string
  fontInitialsWeight: number
  fontFrameNames: string
  fontFrameNamesWeight: number
  fontPageTitles: string
  fontPageTitlesWeight: number
}

export const TYPE_LABEL: Record<string, string> = {
  bruiloft: "Bruiloft",
  verjaardag: "Verjaardag",
  evenement: "Evenement",
}

export function getStyleConfig(
  style: string,
  fonts?: {
    fontHero?: string | null
    fontInitials?: string | null
    fontFrameNames?: string | null
    fontPageTitles?: string | null
  } | null
): SC {
  const base = style in STYLE_CONFIG ? STYLE_CONFIG[style as Style] : STYLE_CONFIG.roze
  const hero  = getTitleFont(fonts?.fontHero)
  const ini   = getTitleFont(fonts?.fontInitials)
  const fn    = getTitleFont(fonts?.fontFrameNames)
  const pt    = getTitleFont(fonts?.fontPageTitles)
  return {
    ...base,
    fontHero: hero.family,           fontHeroWeight: hero.weight,
    fontInitials: ini.family,        fontInitialsWeight: ini.weight,
    fontFrameNames: fn.family,       fontFrameNamesWeight: fn.weight,
    fontPageTitles: pt.family,       fontPageTitlesWeight: pt.weight,
  }
}

export function formatDate(iso: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
