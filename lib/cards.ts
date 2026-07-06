// Gedeelde types en helpers voor digitale kaarten (Save the Date / trouwkaart)

import { formatDate } from "./event-styles"

export type CardType = "save_the_date" | "trouwkaart"
export type CardTemplate = "klassiek" | "foto"
export type CardGuestType = "daggast" | "avondgast" | "receptiegast"

export interface CardContent {
  names?: string
  dateText?: string
  location?: string
  message?: string
  photoUrl?: string
  // Alleen voor trouwkaarten: voor welke gastengroep deze kaart(-link) is
  guestType?: CardGuestType
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

export const CARD_TEMPLATE_LABEL: Record<CardTemplate, string> = {
  klassiek: "Klassiek",
  foto: "Met foto",
}

// Kop op de kaart zelf
export const CARD_HEADING: Record<CardType, string> = {
  save_the_date: "Save the Date",
  trouwkaart: "Wij gaan trouwen",
}

const DEFAULT_MESSAGE: Record<CardType, string> = {
  save_the_date: "Zet de datum alvast in je agenda — de officiële uitnodiging volgt!",
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
  message: string
  photoUrl: string | null
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
      type === "trouwkaart" && content.guestType
        ? GUEST_TYPE_INVITE_LINE[content.guestType]
        : null,
    message: content.message?.trim() || DEFAULT_MESSAGE[type],
    photoUrl:
      template === "foto"
        ? content.photoUrl?.trim() || event.hero_image_url?.trim() || null
        : null,
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
