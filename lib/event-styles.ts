export const STYLE_CONFIG = {
  roze: {
    accent: "#E8627A",
    heroGradient: "linear-gradient(135deg, #fff0f3, #fce7e7, #fff5ee)",
    fontFamily: "Inter, sans-serif",
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
    accent: "#8A9E8C",
    heroGradient: "linear-gradient(135deg, #F5F0E8, #EDE8DF, #E8E4DC)",
    fontFamily: "Inter, sans-serif",
    navBg: "#F5F0E8",
    navText: "#2C2C2C",
    headingColor: "#2C2C2C",
    bodyText: "#5a5a5a",
    buttonBg: "#8A9E8C",
    buttonText: "#ffffff",
    labelColor: "#8A9E8C",
    bodyBg: "#ede8e0",
    floral: false as boolean,
    fontImport: null as string | null,
  },
} as const

export type Style = keyof typeof STYLE_CONFIG
export type SC = typeof STYLE_CONFIG[Style]

export const TYPE_LABEL: Record<string, string> = {
  bruiloft: "Bruiloft",
  verjaardag: "Verjaardag",
  evenement: "Evenement",
}

export function getStyleConfig(style: string): SC {
  return (style in STYLE_CONFIG ? STYLE_CONFIG[style as Style] : STYLE_CONFIG.roze) as SC
}

export function formatDate(iso: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
