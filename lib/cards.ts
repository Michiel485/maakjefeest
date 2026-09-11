// Gedeelde types en helpers voor digitale kaarten (Save the Date / trouwkaart)

import { formatDate } from "./event-styles"

export type CardType = "save_the_date" | "trouwkaart"
// De drie ontwerprichtingen. "foto" is de oude waarde uit de tijd dat een foto
// een apart template was; die telt nu als "klassiek" en de foto hangt alleen
// nog aan content.photoUrl.
export type CardTemplate = "klassiek" | "sierlijk" | "bohemian" | "foto"
export type CardDesign = "klassiek" | "sierlijk" | "bohemian"
export type CardGuestType = "daggast" | "avondgast" | "receptiegast"

// Hoe de envelop opengaat. "klassiek" is de eerste versie (klep klapt om, kaart
// verschijnt eroverheen); die bewaren we werkend, maar bieden we niet aan in de
// bouwer omdat de nieuwe animatie simpelweg beter is. Zie docs/PLAN-kaartbouwer.md.
export type CardAnimatie = "rustig" | "feestelijk" | "klassiek"

// Alleen deze twee krijgt het bruidspaar te kiezen
export const CARD_ANIMATIE_KEUZES: CardAnimatie[] = ["rustig", "feestelijk"]

export const CARD_ANIMATIE_LABEL: Record<CardAnimatie, string> = {
  rustig: "Rustig",
  feestelijk: "Feestelijk",
  klassiek: "Klassiek",
}

export const CARD_ANIMATIE_UITLEG: Record<CardAnimatie, string> = {
  rustig: "zegel breekt, kaart schuift uit de envelop",
  feestelijk: "hetzelfde, met gouden stofjes erbij",
  klassiek: "de eerste versie: klep klapt om",
}

export function cardAnimatie(value: unknown): CardAnimatie {
  return value === "feestelijk" || value === "klassiek" ? value : "rustig"
}

export interface CardContent {
  names?: string
  dateText?: string
  location?: string
  message?: string
  photoUrl?: string
  // Alleen voor trouwkaarten: voor welke gastengroep deze kaart(-link) is
  guestType?: CardGuestType
  // Eigen uitnodigingstekst; leeg = de standaardregel van de gastengroep
  inviteText?: string
  // Tijden op de kaart, bijv. "Van 20:00 tot 23:00 uur"
  timeText?: string
  // Hoe de envelop opengaat bij de gast
  animatie?: CardAnimatie
}

export interface CardRow {
  id: string
  event_id: string
  type: CardType
  template: CardTemplate
  share_token: string
  content: CardContent
  view_count: number
  created_at: string
}

// Velden van het event die een kaart nodig heeft om zichzelf voor te vullen
export interface CardEventSource {
  title: string
  frame_names?: string | null
  datum?: string | null
  locatie?: string | null
  hero_image_url?: string | null
}

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  save_the_date: "Save the Date",
  trouwkaart: "Trouwkaart",
}

// Welk pakket hoort bij welk kaarttype (voor de kaartbouwer en de kassa)
export const CARD_TYPE_PLAN: Record<CardType, "save_the_date" | "uitnodiging"> = {
  save_the_date: "save_the_date",
  trouwkaart: "uitnodiging",
}

export const CARD_DESIGNS: CardDesign[] = ["klassiek", "sierlijk", "bohemian"]

export const CARD_TEMPLATE_LABEL: Record<CardDesign, string> = {
  klassiek: "Strak",
  sierlijk: "Sierlijk",
  bohemian: "Bohemian",
}

export const CARD_TEMPLATE_UITLEG: Record<CardDesign, string> = {
  klassiek: "rustig en tijdloos",
  sierlijk: "handschrift en krullen",
  bohemian: "warm en natuurlijk",
}

// Oude waarden en rommel vallen terug op het strakke ontwerp
export function cardDesign(template: unknown): CardDesign {
  return template === "sierlijk" || template === "bohemian" ? template : "klassiek"
}

// Typografie en ornament per ontwerp. De kleuren komen uit het thema, de vorm
// hieruit, zodat browser en afbeelding hetzelfde tonen.
export interface CardDesignStyle {
  // CSS-variabelen voor de browser
  namenFont: string
  kopFont: string
  // Google Fonts voor de afbeelding (satori)
  namenFontImage: { family: string; weight: 400 | 600 }
  // Welke van de twee basisfonts de kop in de afbeelding gebruikt
  kopFontImage: "sans" | "serif"
  namenSchaal: number
  kopSpatiering: string
  namenSpatiering?: string
  ornament: "diamant" | "krul" | "takje"
  // Afsluiter onderaan de kaart: alle drie een hartje, maar in de stijl van
  // het ontwerp: vol, dun met zwaaitjes, of vol met blaadjes aan de punt
  slot: "hart" | "sierlijkhart" | "blaadjeshart"
  // Hoe de datum eruitziet: stevig schreefloos, in serif of luchtig gespatieerd
  datumStijl: "vet" | "serif" | "licht"
  dubbeleRand: boolean
  hoekRadius: number
  namenCursief: boolean
}

export const CARD_DESIGN_STYLE: Record<CardDesign, CardDesignStyle> = {
  klassiek: {
    namenFont: "var(--font-cormorant), Georgia, serif",
    kopFont: "var(--font-montserrat), Helvetica, sans-serif",
    namenFontImage: { family: "Cormorant Garamond", weight: 600 },
    kopFontImage: "sans",
    namenSchaal: 1,
    kopSpatiering: "0.35em",
    ornament: "diamant",
    slot: "hart",
    datumStijl: "vet",
    dubbeleRand: false,
    hoekRadius: 16,
    namenCursief: false,
  },
  sierlijk: {
    namenFont: "var(--font-greatvibes), cursive",
    kopFont: "var(--font-cormorant), Georgia, serif",
    namenFontImage: { family: "Great Vibes", weight: 400 },
    kopFontImage: "serif",
    namenSchaal: 1.45,
    kopSpatiering: "0.28em",
    ornament: "krul",
    slot: "sierlijkhart",
    datumStijl: "serif",
    dubbeleRand: true,
    hoekRadius: 22,
    namenCursief: false,
  },
  bohemian: {
    namenFont: "var(--font-marcellus), Georgia, serif",
    kopFont: "var(--font-montserrat), Helvetica, sans-serif",
    namenFontImage: { family: "Marcellus", weight: 400 },
    kopFontImage: "sans",
    namenSchaal: 0.92,
    kopSpatiering: "0.42em",
    namenSpatiering: "0.07em",
    ornament: "takje",
    slot: "blaadjeshart",
    datumStijl: "licht",
    dubbeleRand: false,
    hoekRadius: 34,
    namenCursief: false,
  },
}

// Kop op de kaart zelf
export const CARD_HEADING: Record<CardType, string> = {
  save_the_date: "Save the Date",
  trouwkaart: "Wij gaan trouwen",
}

const DEFAULT_MESSAGE: Record<CardType, string> = {
  save_the_date: "Wij gaan trouwen! Zet de datum alvast in je agenda, de officiële uitnodiging volgt.",
  trouwkaart: "Wij gaan trouwen en vieren dat graag met jou. Kom je ook?",
}

export const GUEST_TYPE_LABEL: Record<CardGuestType, string> = {
  daggast: "Daggasten",
  avondgast: "Avondgasten",
  receptiegast: "Receptiegasten",
}

// De uitnodigingsregel die per gastengroep op de trouwkaart komt
export const GUEST_TYPE_INVITE_LINE: Record<CardGuestType, string> = {
  daggast: "Wij nodigen je van harte uit voor onze hele trouwdag",
  avondgast: "Wij nodigen je van harte uit voor het avondfeest",
  receptiegast: "Wij nodigen je van harte uit voor de receptie",
}

// De uiteindelijke weergavedata: eigen invoer van het bruidspaar wint,
// anders wordt het veld voorgevuld vanuit de trouwsite.
export interface CardDisplay {
  heading: string
  names: string
  dateText: string
  location: string
  inviteLine: string | null
  timeText: string | null
  message: string
  photoUrl: string | null
  design: CardDesign
  animatie: CardAnimatie
}

export function buildCardDisplay(
  type: CardType,
  template: CardTemplate,
  content: CardContent,
  event: CardEventSource
): CardDisplay {
  const fallbackNames =
    (event.frame_names && event.frame_names.trim()) ||
    event.title.replace(/^de bruiloft van\s+/i, "").trim()

  return {
    heading: CARD_HEADING[type],
    names: content.names?.trim() || fallbackNames,
    dateText: content.dateText?.trim() || (event.datum ? formatDate(event.datum) : ""),
    location: content.location?.trim() || event.locatie?.trim() || "",
    inviteLine:
      type === "trouwkaart"
        ? content.inviteText?.trim() ||
          (content.guestType ? GUEST_TYPE_INVITE_LINE[content.guestType] : null)
        : null,
    timeText: type === "trouwkaart" ? content.timeText?.trim() || null : null,
    message: content.message?.trim() || DEFAULT_MESSAGE[type],
    // Een foto hoort bij de kaart zodra er één gekozen is, los van het ontwerp
    photoUrl: content.photoUrl?.trim() || (template === "foto" ? event.hero_image_url?.trim() || null : null),
    design: cardDesign(template),
    animatie: cardAnimatie(content.animatie),
  }
}

// Kort, onraadbaar deel-token voor in de URL
export function generateShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9))
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "a")
    .replace(/\//g, "b")
    .replace(/=/g, "")
}
