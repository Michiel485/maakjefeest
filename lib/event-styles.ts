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
    fontImport: null as string | null,
  },
  ivoor: {
    accent: "#1A1A1A",
    heroGradient: "linear-gradient(135deg, #FAF7F2, #F5EFE6, #FAF7F2)",
    fontFamily: "'Cormorant Garamond', serif",
    navBg: "#FAF7F2",
    navText: "#1A1A1A",
    headingColor: "#1A1A1A",
    bodyText: "#3d3d3d",
    buttonBg: "#1A1A1A",
    buttonText: "#FAF7F2",
    labelColor: "#8a7a6a",
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
