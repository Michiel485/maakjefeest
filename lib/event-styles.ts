import { getTitleFont } from "./title-fonts"

export const STYLE_CONFIG = {
  roze: {
    accent: "#C5A059",
    heroGradient: "linear-gradient(135deg, #C87A68, #B86050, #A85040)",
    fontFamily: "var(--font-lora), serif",
    nameFont: null as string | null,
    navBg: "#F0D8CB",
    navText: "#3A1E0D",
    headingColor: "#3A1E0D",
    bodyText: "#5A2E1E",
    buttonBg: "#C5A059",
    buttonText: "#ffffff",
    labelColor: "#C5A059",
    bodyBg: "#E8C8B5",
    bodyBackground: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\") repeat, #F0D8CB" as string | null,
    cardBg: "#B5705F" as string | null,
    cardText: "#FDFBF7" as string | null,
    goldBorder: true as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "0.02em",
    bodyFontWeight: "400",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
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
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
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
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Pinyon+Script&display=swap');",
    frameBodyText: null as string | null,
  },
  earthy: {
    accent: "#5A6B5D",
    heroGradient: "linear-gradient(135deg, #D8D0C0, #C6BA9E, #B3A285)",
    fontFamily: "var(--font-lora), serif",
    nameFont: null as string | null,
    navBg: "#E5DDD0",
    navText: "#2A1A10",
    headingColor: "#2A1A10",
    bodyText: "#4A3728",
    buttonBg: "#5A6B5D",
    buttonText: "#ffffff",
    labelColor: "#8A4B53",
    bodyBg: "#DDD7CA",
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "500",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
  },
  emerald: {
    accent: "#D59C76",
    heroGradient: "linear-gradient(160deg, #07353A 0%, #0A4550 60%, #0D5058 100%)",
    fontFamily: "var(--font-montserrat), sans-serif",
    nameFont: "var(--font-cinzel), serif" as string | null,
    navBg: "#0D5058",
    navText: "#FFFFFF",
    headingColor: "#D59C76",
    bodyText: "#E8DDD0",
    buttonBg: "#D59C76",
    buttonText: "#07353A",
    labelColor: "#D59C76",
    bodyBg: "#0D5058",
    bodyBackground: null as string | null,
    cardBg: "#0D4A52" as string | null,
    cardText: "#FFFFFF" as string | null,
    goldBorder: true as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "0.08em",
    bodyFontWeight: "500",
    fontImport: null as string | null,
    frameBodyText: "#2A1A10" as string | null,
    outerBg: "#155A65" as string | null,
  },
  // ── Vijf stijlen van 25 september 2026 ──
  // Eerst alleen kleuren voor een kaart; Michiel wilde ze ook voor de
  // website, zodat er één lijst is en je bij een kaart niet hoeft te weten
  // wat er voor de website bestaat.
  zwartgoud: {
    accent: "#C9A45C",
    heroGradient: "linear-gradient(160deg, #121110 0%, #1C1A17 60%, #24211C 100%)",
    fontFamily: "var(--font-montserrat), sans-serif",
    nameFont: "var(--font-cinzel), serif" as string | null,
    navBg: "#161513",
    navText: "#F3EBDD",
    headingColor: "#C9A45C",
    bodyText: "#DCD2C1",
    buttonBg: "#C9A45C",
    buttonText: "#121110",
    labelColor: "#C9A45C",
    bodyBg: "#1C1A17",
    bodyBackground: null as string | null,
    cardBg: "#121110" as string | null,
    cardText: "#F3EBDD" as string | null,
    goldBorder: true as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "0.06em",
    bodyFontWeight: "400",
    fontImport: null as string | null,
    frameBodyText: "#2A1A10" as string | null,
    outerBg: "#0E0D0C" as string | null,
  },
  zwartwit: {
    accent: "#141414",
    heroGradient: "linear-gradient(135deg, #FFFFFF, #F4F4F2, #ECECEA)",
    fontFamily: "var(--font-montserrat), sans-serif",
    nameFont: null as string | null,
    navBg: "#FFFFFF",
    navText: "#141414",
    headingColor: "#141414",
    bodyText: "#3A3A3A",
    buttonBg: "#141414",
    buttonText: "#FFFFFF",
    labelColor: "#6E6E6E",
    bodyBg: "#F2F2F0",
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
  },
  terracotta: {
    accent: "#B2603F",
    heroGradient: "linear-gradient(135deg, #FBF4EE, #F4E6DA, #EBD5C4)",
    fontFamily: "var(--font-lora), serif",
    nameFont: null as string | null,
    navBg: "#FBF4EE",
    navText: "#5A3527",
    headingColor: "#5A3527",
    bodyText: "#6E4A3C",
    buttonBg: "#B2603F",
    buttonText: "#FFFFFF",
    labelColor: "#B2603F",
    bodyBg: "#F1E4DA",
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
  },
  bordeaux: {
    accent: "#7A2B34",
    heroGradient: "linear-gradient(135deg, #FFF9F6, #F6EAE7, #EFDCD9)",
    fontFamily: "var(--font-lora), serif",
    nameFont: null as string | null,
    navBg: "#FFF9F6",
    navText: "#4A1D23",
    headingColor: "#4A1D23",
    bodyText: "#5E3A3E",
    buttonBg: "#7A2B34",
    buttonText: "#FFFFFF",
    labelColor: "#7A2B34",
    bodyBg: "#EFE3E1",
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
  },
  poederroze: {
    accent: "#BE8A89",
    heroGradient: "linear-gradient(135deg, #FFFAF8, #F8EDEB, #F1E0DE)",
    fontFamily: "var(--font-montserrat), sans-serif",
    nameFont: null as string | null,
    navBg: "#FFFAF8",
    navText: "#553E40",
    headingColor: "#553E40",
    bodyText: "#6A5456",
    buttonBg: "#BE8A89",
    buttonText: "#FFFFFF",
    labelColor: "#BE8A89",
    bodyBg: "#F4E9E7",
    bodyBackground: null as string | null,
    cardBg: null as string | null,
    cardText: null as string | null,
    goldBorder: false as boolean,
    floral: false as boolean,
    floralFilter: null as string | null,
    bodyLetterSpacing: "normal",
    bodyFontWeight: "400",
    fontImport: null as string | null,
    frameBodyText: null as string | null,
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
  bodyBackground: string | null
  cardBg: string | null
  cardText: string | null
  goldBorder: boolean
  bodyLetterSpacing: string
  bodyFontWeight: string
  fontImport: string | null
  frameBodyText: string | null
  outerBg?: string | null
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
    // User-chosen font becomes the global fallback for all body/UI text
    fontFamily: fonts?.fontPageTitles ? pt.family : base.fontFamily,
    fontHero: hero.family,           fontHeroWeight: hero.weight,
    fontInitials: ini.family,        fontInitialsWeight: ini.weight,
    fontFrameNames: fn.family,       fontFrameNamesWeight: fn.weight,
    fontPageTitles: pt.family,       fontPageTitlesWeight: pt.weight,
  }
}

/**
 * De datum uitgeschreven. De taal hoort erbij omdat een kaart in het Engels,
 * Frans of Duits ook een datum in die taal nodig heeft; zonder dat staat er
 * "14 augustus" op een Engelse kaart.
 */
export function formatDate(iso: string, locale = "nl-NL") {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
