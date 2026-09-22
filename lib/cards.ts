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
  // ── Namen en datum: van de bruiloft, niet van de kaart ────────────────────
  // Deze twee worden alleen nog gelezen, nooit meer geschreven. Ze stonden
  // eerder als kopie op elke kaart en die kopie won van wat er op de bruiloft
  // stond. Veranderde je de namen in de websitebouwer, dan hielden de kaarten
  // stilletjes de oude. Eén bruiloft heeft één stel namen en één datum, dus
  // die horen op het event. Blijven staan voor kaarten van voor deze wijziging.
  names?: string
  dateText?: string
  // ── Locatie: wel per kaart, maar alleen als hij afwijkt ───────────────────
  // Leeg betekent: volg de locatie van de bruiloft. Gevuld betekent: op deze
  // kaart staat iets anders. Dat komt echt voor, bijvoorbeeld een avondfeest
  // op een andere plek dan de ceremonie.
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
  // In welke taal de vaste teksten op de kaart staan
  taal?: CardTaal
  // Of er onder de kaart om een aanmelding wordt gevraagd, en hoeveel. Zie
  // AanmeldStand in lib/gasten.ts: geen, alleen ja of nee, of volledig.
  aanmelden?: string
  // ── Details op de kaart ───────────────────────────────────────────────────
  // Michiels wens van 22 september 2026: subtiel kunnen tonen voor wie de
  // kaart is, hoe laat het is en wat de dresscode is, zonder de kaart te
  // verpesten. Ze komen samen in één regel in de accentkleur, onder de tekst.
  toonGastType?: boolean
  dresscode?: string
  /**
   * Hoe jij deze kaart noemt, om je kaarten uit elkaar te houden. Alleen voor
   * het bruidspaar; je gasten zien dit niet. Leeg betekent: de automatische
   * naam uit het soort kaart, de gastengroep en de taal.
   */
  naam?: string
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

// Hoeveel kaarten één bruiloft mag hebben. Geen verkoopargument maar een dak
// tegen misbruik: een bruidspaar heeft er in de praktijk hoogstens zes nodig
// (dag, avond en receptie, elk in twee talen). Kaarten maken is en blijft
// gratis, het pakket bepaalt welk soort kaart je mag versturen.
export const MAX_KAARTEN_PER_EVENT = 10

/**
 * Korte naam van een kaart, voor de keuzelijst in de bouwer en het dashboard.
 * De taal staat erbij zodra hij niet Nederlands is, want juist dan heeft een
 * bruidspaar twee kaarten die anders identiek heten.
 */
export function kaartLabel(card: { type: CardType; content: CardContent }): string {
  // Heb je hem zelf een naam gegeven, dan die. Anders bouwen we er een uit
  // wat de kaart onderscheidt, zodat twee kaarten nooit hetzelfde heten.
  const eigen = card.content.naam?.trim()
  if (eigen) return eigen
  const groep = card.content.guestType ? GUEST_TYPE_LABEL[card.content.guestType] : null
  const taal = cardTaal(card.content.taal)
  const basis = groep
    ? `${CARD_TYPE_LABEL[card.type]}, ${groep.toLowerCase()}`
    : CARD_TYPE_LABEL[card.type]
  return taal === "nl" ? basis : `${basis} (${CARD_TAAL_KORT[taal]})`
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

// ── De taal van de kaart ────────────────────────────────────────────────────
// Los van de taal van de bouwer: een Nederlands paar kan een Engelse kaart
// willen, en wie half Franse familie heeft maakt er twee (kopieer de kaart in
// de bouwer en zet alleen de taal om).
//
// Dit gaat alleen over onze vaste teksten: de kop, de standaardboodschap, de
// uitnodigingsregel per gastengroep, de knoppen en de opmaak van de datum. Wat
// het bruidspaar zelf typt vertalen wij niet.
export type CardTaal = "nl" | "en" | "fr" | "de"

export const CARD_TALEN: CardTaal[] = ["nl", "en", "fr", "de"]

export const CARD_TAAL_LABEL: Record<CardTaal, string> = {
  nl: "Nederlands",
  en: "English",
  fr: "Français",
  de: "Deutsch",
}

/** Korte aanduiding voor in een keuzelijst met kaarten. */
export const CARD_TAAL_KORT: Record<CardTaal, string> = {
  nl: "NL",
  en: "EN",
  fr: "FR",
  de: "DE",
}

export function cardTaal(value: unknown): CardTaal {
  return value === "en" || value === "fr" || value === "de" ? value : "nl"
}

interface KaartTeksten {
  /** De regel boven de namen. */
  kop: Record<CardType, string>
  /** De boodschap als het bruidspaar zelf niets invult. */
  bericht: Record<CardType, string>
  /** De uitnodigingsregel per gastengroep, op een trouwkaart. */
  uitnodiging: Record<CardGuestType, string>
  /** Het woord voor de kledingaanwijzing op de kaart. */
  dresscode: string
  /** De gastengroepen zoals ze óp de kaart komen te staan, in de taal van de
   *  kaart. Enkelvoud: die regel gaat over deze ene gast, niet over een groep. */
  gasten: Record<CardGuestType, string>
  rsvpKnop: string
  siteKnop: string
  /** De knop die de datum in de agenda van de gast zet. */
  agendaKnop: string
  siteVolgt: string
  openEnvelop: string
  gemaaktMet: string
  /** Waarmee de datum wordt opgemaakt. */
  locale: string
}

// "Save the Date" blijft in alle talen staan: dat is de naam van het product
// en een ingeburgerde term op trouwkaarten in alle vier de taalgebieden. De
// rest is echt vertaald.
export const KAART_TEKST: Record<CardTaal, KaartTeksten> = {
  nl: {
    kop: { save_the_date: "Save the Date", trouwkaart: "Wij gaan trouwen" },
    bericht: {
      save_the_date: "Wij gaan trouwen! Zet de datum alvast in je agenda, de officiële uitnodiging volgt.",
      trouwkaart: "Wij gaan trouwen en vieren dat graag met jou. Kom je ook?",
    },
    uitnodiging: {
      daggast: "Wij nodigen je van harte uit voor onze hele trouwdag",
      avondgast: "Wij nodigen je van harte uit voor het avondfeest",
      receptiegast: "Wij nodigen je van harte uit voor de receptie",
    },
    rsvpKnop: "Laat weten of je erbij bent",
    siteKnop: "Bekijk onze trouwsite",
    agendaKnop: "Zet de datum in je agenda",
    siteVolgt: "Meer informatie volgt binnenkort 🤍",
    openEnvelop: "Open de envelop",
    gemaaktMet: "Gemaakt met",
    dresscode: "Dresscode",
    gasten: { daggast: "Daggast", avondgast: "Avondgast", receptiegast: "Receptiegast" },
    locale: "nl-NL",
  },
  en: {
    kop: { save_the_date: "Save the Date", trouwkaart: "We are getting married" },
    bericht: {
      save_the_date: "We are getting married! Save the date, the official invitation will follow.",
      trouwkaart: "We are getting married and we would love to celebrate with you. Will you be there?",
    },
    uitnodiging: {
      daggast: "We warmly invite you to join us for the whole wedding day",
      avondgast: "We warmly invite you to join us for the evening party",
      receptiegast: "We warmly invite you to join us for the reception",
    },
    rsvpKnop: "Let us know if you can make it",
    siteKnop: "Visit our wedding website",
    agendaKnop: "Add the date to your calendar",
    siteVolgt: "More details coming soon 🤍",
    openEnvelop: "Open the envelope",
    gemaaktMet: "Made with",
    dresscode: "Dress code",
    gasten: { daggast: "Day guest", avondgast: "Evening guest", receptiegast: "Reception guest" },
    // en-GB geeft "14 August 2027"; en-US zou "August 14, 2027" geven en dat
    // leest voor Europese gasten vreemd op een kaart.
    locale: "en-GB",
  },
  fr: {
    kop: { save_the_date: "Save the Date", trouwkaart: "Nous nous marions" },
    bericht: {
      save_the_date: "Nous nous marions ! Réservez déjà la date, l'invitation officielle suivra.",
      trouwkaart: "Nous nous marions et nous serions ravis de le célébrer avec vous. Serez-vous là ?",
    },
    uitnodiging: {
      daggast: "Nous vous invitons chaleureusement à partager toute la journée avec nous",
      avondgast: "Nous vous invitons chaleureusement à la soirée",
      receptiegast: "Nous vous invitons chaleureusement à la réception",
    },
    rsvpKnop: "Dites-nous si vous serez là",
    siteKnop: "Voir notre site de mariage",
    agendaKnop: "Ajouter la date à votre agenda",
    siteVolgt: "Plus d'informations bientôt 🤍",
    openEnvelop: "Ouvrir l'enveloppe",
    gemaaktMet: "Créé avec",
    dresscode: "Tenue",
    gasten: { daggast: "Invité de la journée", avondgast: "Invité de la soirée", receptiegast: "Invité de la réception" },
    locale: "fr-FR",
  },
  de: {
    kop: { save_the_date: "Save the Date", trouwkaart: "Wir heiraten" },
    bericht: {
      save_the_date: "Wir heiraten! Halte dir den Tag schon frei, die offizielle Einladung folgt.",
      trouwkaart: "Wir heiraten und feiern das gerne mit dir. Kommst du auch?",
    },
    uitnodiging: {
      daggast: "Wir laden dich herzlich ein, den ganzen Hochzeitstag mit uns zu feiern",
      avondgast: "Wir laden dich herzlich zur Abendfeier ein",
      receptiegast: "Wir laden dich herzlich zum Empfang ein",
    },
    rsvpKnop: "Sag uns, ob du dabei bist",
    siteKnop: "Unsere Hochzeitswebsite ansehen",
    agendaKnop: "Termin in deinen Kalender",
    siteVolgt: "Weitere Infos folgen bald 🤍",
    openEnvelop: "Umschlag öffnen",
    gemaaktMet: "Erstellt mit",
    dresscode: "Dresscode",
    gasten: { daggast: "Tagesgast", avondgast: "Abendgast", receptiegast: "Empfangsgast" },
    locale: "de-DE",
  },
}

/** De gastengroepen, op de volgorde waarin je ze zou uitnodigen. */
export const CARD_GUEST_TYPES: readonly CardGuestType[] = [
  "daggast",
  "avondgast",
  "receptiegast",
] as const

export const GUEST_TYPE_LABEL: Record<CardGuestType, string> = {
  daggast: "Daggasten",
  avondgast: "Avondgasten",
  receptiegast: "Receptiegasten",
}

// De uiteindelijke weergavedata: eigen invoer van het bruidspaar wint,
// anders wordt het veld voorgevuld vanuit de trouwsite.
/**
 * De vaste regels van een kaart in één taal, klaar om in een CardDisplay te
 * zetten. Ook voor wie met de hand een display bouwt, zoals de demokaart op
 * de marketingsite: die hoeft de lijst dan niet zelf bij te houden.
 */
export interface CardVasteTeksten {
  taal: CardTaal
  rsvpKnop: string
  siteKnop: string
  agendaKnop: string
  siteVolgtTekst: string
  openEnvelopLabel: string
  gemaaktMet: string
}

export function displayTeksten(taal: CardTaal = "nl"): CardVasteTeksten {
  const tk = KAART_TEKST[taal]
  return {
    taal,
    rsvpKnop: tk.rsvpKnop,
    siteKnop: tk.siteKnop,
    agendaKnop: tk.agendaKnop,
    siteVolgtTekst: tk.siteVolgt,
    openEnvelopLabel: tk.openEnvelop,
    gemaaktMet: tk.gemaaktMet,
  }
}

// De vaste teksten zitten in het display, opgelost tot losse regels, zodat de
// weergave ze niet zelf hoeft op te zoeken. Zonder dat zou er in card-reveal
// opnieuw een tabel met talen moeten staan.
export interface CardDisplay extends CardVasteTeksten {
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

  const taal = cardTaal(content.taal)
  const tk = KAART_TEKST[taal]

  return {
    heading: tk.kop[type],
    names: content.names?.trim() || fallbackNames,
    dateText: content.dateText?.trim() || (event.datum ? formatDate(event.datum, tk.locale) : ""),
    location: content.location?.trim() || event.locatie?.trim() || "",
    // Een eigen uitnodigingsregel mag op elke kaart; de standaardregel per
    // gastengroep alleen op een trouwkaart, want op een Save the Date nodig je
    // nog niet uit.
    inviteLine:
      content.inviteText?.trim() ||
      (type === "trouwkaart" && content.guestType ? tk.uitnodiging[content.guestType] : null),
    // Eén regel in de accentkleur onder de tekst met wat er verder te weten
    // is: voor wie, hoe laat, welke kleding. Alleen wat is ingevuld, met een
    // puntje ertussen, zodat het één rustige regel blijft.
    timeText:
      [
        content.toonGastType && content.guestType ? tk.gasten[content.guestType] : null,
        content.timeText?.trim() || null,
        content.dresscode?.trim() ? `${tk.dresscode}: ${content.dresscode.trim()}` : null,
      ]
        .filter((d): d is string => !!d)
        .join(" · ") || null,
    message: content.message?.trim() || tk.bericht[type],
    // Een foto hoort bij de kaart zodra er één gekozen is, los van het ontwerp
    photoUrl: content.photoUrl?.trim() || (template === "foto" ? event.hero_image_url?.trim() || null : null),
    design: cardDesign(template),
    animatie: cardAnimatie(content.animatie),
    ...displayTeksten(taal),
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
