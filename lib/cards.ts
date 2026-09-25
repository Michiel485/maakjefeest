// Gedeelde types en helpers voor digitale kaarten (Save the Date / trouwkaart)

import { formatDate } from "./event-styles"

export type CardType = "save_the_date" | "trouwkaart"
// De ontwerpen. "foto" is de oude waarde uit de tijd dat een foto een apart
// template was; die telt nu als "klassiek" en de foto hangt alleen nog aan
// content.photoUrl.
//
// De eerste drie (klassiek, sierlijk, bohemian) hebben dezelfde opbouw en een
// eigen stuk code in de kaartpagina en de afbeelding. De nieuwe van
// 25 september 2026 hebben elk een eigen opbouw en één renderer voor browser
// en afbeelding samen: components/kaart/KaartVoorkant.tsx. Zie
// docs/PLAN-kaartontwerpen.md. Oudere code kent de nieuwe waarden niet en
// valt dan terug op klassiek; terugdraaien breekt dus geen kaart.
export type KlassiekOntwerp = "klassiek" | "sierlijk" | "bohemian"
export type NieuwOntwerp =
  | "minimaal" | "fotovol" | "boog" | "deco" | "datum" | "eigen"
  // De themakaarten van 25 september 2026: minder tekst, een vaste titel,
  // namen met een verbindingswoord in een andere letter
  | "titel" | "palm" | "ibiza" | "fotoschrift"
  // Het olijfkader uit de websitebouwer als vierkante kaart
  | "olijf"
export type CardDesign = KlassiekOntwerp | NieuwOntwerp
export type CardTemplate = CardDesign | "foto"

/** Alle waarden die in cards.template mogen staan. */
export const CARD_TEMPLATE_WAARDEN: CardTemplate[] = [
  "klassiek", "sierlijk", "bohemian", "foto", "minimaal", "fotovol", "boog", "deco", "datum", "eigen",
  "titel", "palm", "ibiza", "fotoschrift", "olijf",
]

export function isKlassiekOntwerp(d: CardDesign): d is KlassiekOntwerp {
  return d === "klassiek" || d === "sierlijk" || d === "bohemian"
}
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
  /**
   * De kleuren van deze kaart: een palet uit lib/kaart-paletten.ts. Leeg of
   * "website" betekent de kleuren van de website, zoals het altijd was.
   */
  kleur?: string
  /**
   * Eigen ontwerp: de afbeelding die de kaart is, en hoe hoog hij is ten
   * opzichte van zijn breedte. Wij doen de envelop, het aanmelden en de rest.
   */
  ontwerpUrl?: string
  ontwerpVerhouding?: number
  /** Een vouwkaart: eerst een kaft, tik en hij klapt open */
  vouwkaart?: boolean
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

// De volgorde in de galerij van de bouwer
export const CARD_DESIGNS: CardDesign[] = [
  "klassiek", "sierlijk", "bohemian", "olijf", "minimaal", "datum", "titel", "palm", "ibiza", "deco", "boog", "fotovol", "fotoschrift", "eigen",
]

export const CARD_TEMPLATE_LABEL: Record<CardDesign, string> = {
  klassiek: "Strak",
  sierlijk: "Sierlijk",
  bohemian: "Bohemian",
  minimaal: "Minimaal",
  fotovol: "Foto",
  boog: "Boog",
  deco: "Art deco",
  datum: "De datum",
  eigen: "Eigen ontwerp",
  titel: "Grote titel",
  palm: "Palm",
  ibiza: "Ibiza",
  fotoschrift: "Foto met handschrift",
  olijf: "Olijf",
}

export const CARD_TEMPLATE_UITLEG: Record<CardDesign, string> = {
  klassiek: "rustig en tijdloos",
  sierlijk: "handschrift en krullen",
  bohemian: "warm en natuurlijk",
  minimaal: "veel wit, grote letters",
  fotovol: "jullie foto over de hele kaart",
  boog: "een boogvenster met foto of initialen",
  deco: "geometrisch goud, jaren twintig",
  datum: "de datum groot als beeld",
  eigen: "upload jullie eigen kaart",
  titel: "Save the Date groot in beeld",
  palm: "één palm, namen in twee letters",
  ibiza: "palmen en golven in een ovaal",
  fotoschrift: "jullie foto met een titel in handschrift",
  olijf: "waterverf eucalyptus in een gouden kader",
}

/** De sfeer, als label in de galerij. */
export const CARD_DESIGN_SFEER: Record<CardDesign, string> = {
  klassiek: "Klassiek",
  sierlijk: "Romantisch",
  bohemian: "Natuurlijk",
  minimaal: "Modern",
  fotovol: "Persoonlijk",
  boog: "Romantisch",
  deco: "Feestelijk",
  datum: "Modern",
  eigen: "Van jullie",
  titel: "Modern",
  palm: "Zomer",
  ibiza: "Zomer",
  fotoschrift: "Persoonlijk",
  olijf: "Natuurlijk",
}

// Oude waarden en rommel vallen terug op het strakke ontwerp
export function cardDesign(template: unknown): CardDesign {
  return typeof template === "string" && template !== "foto" && (CARD_TEMPLATE_WAARDEN as string[]).includes(template)
    ? (template as CardDesign)
    : "klassiek"
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

export const CARD_DESIGN_STYLE: Record<KlassiekOntwerp, CardDesignStyle> = {
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
export type CardTaal = "nl" | "en" | "fr" | "de" | "es" | "it"

export const CARD_TALEN: CardTaal[] = ["nl", "en", "fr", "de", "es", "it"]

export const CARD_TAAL_LABEL: Record<CardTaal, string> = {
  nl: "Nederlands",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
}

/** Korte aanduiding voor in een keuzelijst met kaarten. */
export const CARD_TAAL_KORT: Record<CardTaal, string> = {
  nl: "NL",
  en: "EN",
  fr: "FR",
  de: "DE",
  es: "ES",
  it: "IT",
}

export function cardTaal(value: unknown): CardTaal {
  return value === "en" || value === "fr" || value === "de" || value === "es" || value === "it" ? value : "nl"
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
  /** Tussen de twee namen, in een andere letter: "Eline en Manuel". */
  verbinder: string
  /** Op de kaft van een vouwkaart. */
  tikOpen: string
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
    verbinder: "en",
    tikOpen: "Tik om te openen",
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
    verbinder: "and",
    tikOpen: "Tap to open",
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
    verbinder: "et",
    tikOpen: "Touchez pour ouvrir",
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
    verbinder: "und",
    tikOpen: "Zum Öffnen tippen",
    dresscode: "Dresscode",
    gasten: { daggast: "Tagesgast", avondgast: "Abendgast", receptiegast: "Empfangsgast" },
    locale: "de-DE",
  },
  es: {
    kop: { save_the_date: "Save the Date", trouwkaart: "Nos casamos" },
    bericht: {
      save_the_date: "¡Nos casamos! Reserva la fecha, la invitación oficial llegará pronto.",
      trouwkaart: "Nos casamos y nos encantaría celebrarlo contigo. ¿Vienes?",
    },
    uitnodiging: {
      daggast: "Te invitamos con mucho cariño a todo nuestro día de boda",
      avondgast: "Te invitamos con mucho cariño a la fiesta de la noche",
      receptiegast: "Te invitamos con mucho cariño a la recepción",
    },
    rsvpKnop: "Dinos si podrás venir",
    siteKnop: "Visita nuestra web de boda",
    agendaKnop: "Añade la fecha a tu calendario",
    siteVolgt: "Pronto más información 🤍",
    openEnvelop: "Abre el sobre",
    gemaaktMet: "Hecho con",
    verbinder: "y",
    tikOpen: "Toca para abrir",
    dresscode: "Código de vestimenta",
    gasten: { daggast: "Invitado de día", avondgast: "Invitado de noche", receptiegast: "Invitado a la recepción" },
    locale: "es-ES",
  },
  it: {
    kop: { save_the_date: "Save the Date", trouwkaart: "Ci sposiamo" },
    bericht: {
      save_the_date: "Ci sposiamo! Segna la data, l'invito ufficiale arriverà presto.",
      trouwkaart: "Ci sposiamo e ci farebbe molto piacere festeggiare con te. Ci sarai?",
    },
    uitnodiging: {
      daggast: "Ti invitiamo con affetto a tutta la nostra giornata di nozze",
      avondgast: "Ti invitiamo con affetto alla festa serale",
      receptiegast: "Ti invitiamo con affetto al ricevimento",
    },
    rsvpKnop: "Facci sapere se ci sarai",
    siteKnop: "Visita il nostro sito di nozze",
    agendaKnop: "Aggiungi la data al calendario",
    siteVolgt: "Presto altre informazioni 🤍",
    openEnvelop: "Apri la busta",
    gemaaktMet: "Creato con",
    verbinder: "e",
    tikOpen: "Tocca per aprire",
    dresscode: "Dress code",
    gasten: { daggast: "Invitato al giorno", avondgast: "Invitato alla sera", receptiegast: "Invitato al ricevimento" },
    locale: "it-IT",
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
  verbinder: string
  tikOpen: string
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
    verbinder: tk.verbinder,
    tikOpen: tk.tikOpen,
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
  /** De trouwdatum als 2027-08-15, voor ontwerpen die met de cijfers spelen. */
  datumIso?: string | null
  ontwerpUrl?: string | null
  ontwerpVerhouding?: number | null
  vouwkaart?: boolean
  /**
   * Heeft het bruidspaar de boodschap zelf geschreven? Een strak ontwerp zet
   * alleen een eigen boodschap onder de kaart, niet onze standaardtekst.
   */
  eigenBericht?: boolean
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
    // In de accentkleur onder de tekst wat er verder te weten is: voor wie,
    // hoe laat, welke kleding. Alleen wat is ingevuld, elk op een eigen regel.
    // Eerst stond het naast elkaar met een puntje ertussen; Michiel wil het
    // onder elkaar (25 september 2026).
    timeText:
      [
        content.toonGastType && content.guestType ? tk.gasten[content.guestType] : null,
        content.timeText?.trim() || null,
        content.dresscode?.trim() ? `${tk.dresscode}: ${content.dresscode.trim()}` : null,
      ]
        .filter((d): d is string => !!d)
        .join("\n") || null,
    message: content.message?.trim() || tk.bericht[type],
    // Een foto hoort bij de kaart zodra er één gekozen is, los van het ontwerp
    photoUrl: content.photoUrl?.trim() || (template === "foto" ? event.hero_image_url?.trim() || null : null),
    design: cardDesign(template),
    animatie: cardAnimatie(content.animatie),
    // Een eigen datumtekst (van oude kaarten) wint van de cijfers
    datumIso: content.dateText?.trim() ? null : event.datum || null,
    ontwerpUrl: content.ontwerpUrl || null,
    ontwerpVerhouding: content.ontwerpVerhouding || null,
    vouwkaart: content.vouwkaart === true,
    eigenBericht: !!content.message?.trim(),
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
