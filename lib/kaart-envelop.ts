// De envelop van een kaart: kleur, voering en zegel.
//
// Het eerste wat een gast ziet is de envelop, en bij Paperless Post is dat
// precies wat een kaart bijzonder maakt. Met een paar voeringen en zegels
// voelt elke kaart anders, zonder dat we de kaart zelf aanraken. Werkt voor
// elk ontwerp. Zie docs/PLAN-kaartontwerpen.md, fase 3.
//
// Opgeslagen in cards.content.envelop. Leeg is zoals het altijd was: de
// envelop in de kleur van de kaart, zonder voering, met een zegel in de
// accentkleur. Oudere code negeert het veld.

import type { SC } from "./event-styles"

export type EnvelopKleur = "kaart" | "creme" | "kraft" | "salie" | "oudroze" | "nachtblauw" | "zwart"
export type EnvelopVoering = "geen" | "streep" | "stip" | "takjes" | "deco" | "goud"
export type ZegelKleur = "accent" | "goud" | "bordeaux" | "groen" | "zwart" | "wit"

export interface CardEnvelop {
  kleur?: EnvelopKleur
  voering?: EnvelopVoering
  zegel?: ZegelKleur
}

export const ENVELOP_KLEUREN: { id: EnvelopKleur; naam: string; kleur: string | null }[] = [
  { id: "kaart", naam: "Als de kaart", kleur: null },
  { id: "creme", naam: "Crème", kleur: "#F4EDE0" },
  { id: "kraft", naam: "Kraft", kleur: "#C8A57C" },
  { id: "salie", naam: "Salie", kleur: "#AFBBA4" },
  { id: "oudroze", naam: "Oudroze", kleur: "#D8B4AC" },
  { id: "nachtblauw", naam: "Nachtblauw", kleur: "#25314A" },
  { id: "zwart", naam: "Zwart", kleur: "#1D1C1A" },
]

export const ENVELOP_VOERINGEN: { id: EnvelopVoering; naam: string }[] = [
  { id: "geen", naam: "Geen" },
  { id: "streep", naam: "Streepjes" },
  { id: "stip", naam: "Stippen" },
  { id: "takjes", naam: "Takjes" },
  { id: "deco", naam: "Art deco" },
  { id: "goud", naam: "Goud" },
]

export const ZEGEL_KLEUREN: { id: ZegelKleur; naam: string; kleur: string | null }[] = [
  { id: "accent", naam: "Als de kaart", kleur: null },
  { id: "goud", naam: "Goud", kleur: "#B8924E" },
  { id: "bordeaux", naam: "Bordeaux", kleur: "#7A2B34" },
  { id: "groen", naam: "Groen", kleur: "#4F6B4A" },
  { id: "zwart", naam: "Zwart", kleur: "#1D1C1A" },
  { id: "wit", naam: "Wit", kleur: "#F4F1EA" },
]

/** Alleen bekende waarden bewaren; de rest valt weg. */
export function schoonEnvelop(raw: unknown): CardEnvelop | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const r = raw as Record<string, unknown>
  const e: CardEnvelop = {}
  if (ENVELOP_KLEUREN.some((k) => k.id === r.kleur) && r.kleur !== "kaart") e.kleur = r.kleur as EnvelopKleur
  if (ENVELOP_VOERINGEN.some((v) => v.id === r.voering) && r.voering !== "geen") e.voering = r.voering as EnvelopVoering
  if (ZEGEL_KLEUREN.some((z) => z.id === r.zegel) && r.zegel !== "accent") e.zegel = r.zegel as ZegelKleur
  return Object.keys(e).length ? e : undefined
}

/** Hoe licht een kleur is, van 0 (zwart) tot 255 (wit). */
function helderheid(hex: string): number {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)
  if (!m) return 200
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16))
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** Is deze kleur donker? Dan komt er lichte tekst of een licht patroon op. */
function donker(hex: string): boolean {
  return helderheid(hex) < 110
}

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** De voering als CSS-achtergrond, in de kleuren van de envelop en de kaart. */
function voeringAchtergrond(voering: EnvelopVoering, basis: string, accent: string): string | null {
  // Het patroon moet te zien zijn: goud op kraft valt weg, dus dan wit of
  // donkerbruin in plaats van de accentkleur
  const lijn = donker(basis)
    ? "#E9D9B4"
    : Math.abs(helderheid(accent) - helderheid(basis)) >= 45
      ? accent
      : helderheid(basis) < 175 ? "#FFFFFF" : "#5A4632"
  switch (voering) {
    case "streep":
      return `repeating-linear-gradient(135deg, ${lijn}55 0 5px, ${basis} 5px 13px)`
    case "stip":
      return `radial-gradient(${lijn}88 1.7px, transparent 2px) 0 0 / 13px 13px, ${basis}`
    case "takjes":
      return `${svgUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 34 34'><g fill='${lijn}' fill-opacity='0.55'><path d='M9 21c-4-1-6-5-5-9 4 1 6 5 5 9z'/><path d='M10 21c1-4 5-6 9-5-1 4-5 6-9 5z'/></g><path d='M9 21l-2 6' stroke='${lijn}' stroke-opacity='0.55' stroke-width='0.9' fill='none'/></svg>`
      )} 0 0 / 34px 34px, ${basis}`
    case "deco":
      return `${svgUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='16' viewBox='0 0 28 16'><g fill='none' stroke='${lijn}' stroke-opacity='0.7' stroke-width='0.9'><path d='M0 16a14 14 0 0 1 28 0'/><path d='M5 16a9 9 0 0 1 18 0'/><path d='M10 16a4 4 0 0 1 8 0'/></g></svg>`
      )} 0 0 / 28px 16px, ${basis}`
    case "goud":
      return "linear-gradient(125deg, #B08A45 0%, #E6CD91 38%, #C29B55 52%, #EAD6A2 70%, #B08A45 100%)"
    default:
      return null
  }
}

export interface EnvelopStijl {
  /** De envelop zelf */
  lichaam: string
  /** Wat je aan de binnenkant ziet als de klep opengaat; leeg is geen voering */
  voering: string | null
  zegel: string
  zegelTekst: string
}

export function envelopStijl(sc: SC, envelop: CardEnvelop | undefined): EnvelopStijl {
  const lichaam = ENVELOP_KLEUREN.find((k) => k.id === envelop?.kleur)?.kleur ?? sc.cardBg ?? sc.navBg
  const zegel = ZEGEL_KLEUREN.find((z) => z.id === envelop?.zegel)?.kleur ?? sc.accent
  return {
    lichaam,
    voering: envelop?.voering ? voeringAchtergrond(envelop.voering, lichaam, sc.accent) : null,
    zegel,
    zegelTekst: envelop?.zegel ? (donker(zegel) ? "#FFFFFF" : "#3A3226") : sc.buttonText,
  }
}
