// De gastenlijst: één model voor de kaart en voor de website.
//
// Dit bestand bestaat om één reden: wat een gast op een trouwkaart invult en
// wat hij op de trouwsite invult moet hetzelfde zijn. Niet ongeveer hetzelfde,
// maar letterlijk hetzelfde formulier met dezelfde vragen. Twee bijna gelijke
// formulieren lopen binnen een maand uit elkaar; dat is hier al twee keer
// gebeurd, bij de mailteksten en bij de kaartteksten.
//
// Geen imports, zodat dit ook in clientcode bruikbaar is.

/** Hoeveel gasten één bruiloft mag hebben. Geen verkoopargument, een dak. */
export const MAX_GASTEN_PER_EVENT = 500

// ── De stand van een gast ───────────────────────────────────────────────────
// Een gast en een aanmelding zijn hetzelfde ding in drie standen. De eerste
// twee samen zijn precies de lijst "wie moet ik nog najagen".
export type GastStatus = "uitgenodigd" | "voorlopig" | "definitief"

export const GAST_STATUS_LABEL: Record<GastStatus, string> = {
  uitgenodigd: "Nog niets gehoord",
  voorlopig: "Voorlopig",
  definitief: "Definitief",
}

export const GAST_STATUS_UITLEG: Record<GastStatus, string> = {
  uitgenodigd: "staat op de lijst maar heeft nog nooit gereageerd",
  voorlopig: "reageerde op de Save the Date, nog geen volledige aanmelding",
  definitief: "heeft de hele aanmelding ingevuld",
}

export function gastStatus(waarde: unknown): GastStatus {
  return waarde === "uitgenodigd" || waarde === "voorlopig" ? waarde : "definitief"
}

/** Wie nog een herinnering kan gebruiken. */
export function moetNogReageren(status: GastStatus): boolean {
  return status !== "definitief"
}

// ── Wat er gevraagd wordt, en wanneer ───────────────────────────────────────
// Bij een Save the Date wil je alleen weten wie er denkt te komen en hoe je
// hem bereikt. Dieetwensen achttien maanden vooraf zijn zinloos: niemand weet
// dan of hij tegen die tijd vegetarisch eet. Het korte formulier moet in tien
// seconden te doen zijn, want dat is waarom mensen het invullen.
export type AanmeldStand = "geen" | "janee" | "volledig"

export const AANMELD_LABEL: Record<AanmeldStand, string> = {
  geen: "Niets vragen",
  janee: "Alleen of ze komen",
  volledig: "Volledig aanmelden",
}

export const AANMELD_UITLEG: Record<AanmeldStand, string> = {
  geen: "de gast ziet alleen de kaart",
  janee: "wie komt er, met hoeveel personen en hoe bereik ik je",
  volledig: "alles, inclusief dieetwensen en je eigen vragen",
}

export function aanmeldStand(waarde: unknown): AanmeldStand {
  return waarde === "janee" || waarde === "volledig" ? waarde : "geen"
}

/** Wat standaard aanstaat bij een nieuw gemaakte kaart. */
export function standaardAanmeldStand(kaartType: string): AanmeldStand {
  return kaartType === "trouwkaart" ? "volledig" : "janee"
}

// ── Eén gast zoals het formulier hem instuurt ───────────────────────────────
export interface GastInvoer {
  voornaam: string
  achternaam: string
  email?: string
  telefoon?: string
  guest_type?: string
  /** Kinderen tellen anders bij de catering, dus die vragen we apart uit. */
  is_kind?: boolean
  leeftijd?: number | null
  /** Voorkeur, bijvoorbeeld vegetarisch. */
  dietary?: string
  /** Veiligheid, bijvoorbeeld noten. Bewust los van de voorkeur. */
  allergie?: string
  attending?: "yes" | "no"
  message?: string
  song?: string
  overnachting?: boolean | null
  /** Antwoorden op de eigen vragen van het bruidspaar. */
  antwoorden?: Record<string, string | boolean>
}

/** De volledige naam, zoals hij in oude lijsten en in mails staat. */
export function volledigeNaam(voornaam: string, achternaam?: string | null): string {
  return [voornaam.trim(), (achternaam ?? "").trim()].filter(Boolean).join(" ")
}

/**
 * Sleutel om dubbele inzendingen te herkennen. Voor- en achternaam samen,
 * zonder hoofdletters en spaties. Michiels punt: met alleen een voornaam zijn
 * twee Sannes niet uit elkaar te houden, met een achternaam erbij bijna altijd
 * wel.
 */
export function gastSleutel(voornaam: string, achternaam?: string | null): string {
  return volledigeNaam(voornaam, achternaam)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

// ── Grenzen op wat een gast mag insturen ────────────────────────────────────
// Dit is de enige plek waar het publiek in onze database schrijft, dus hier
// hoort een hek. Zie ook app/api/rsvp/route.ts.
export const MAX_NAAM = 80
export const MAX_EMAIL = 160
export const MAX_TELEFOON = 32
export const MAX_KORT = 120
export const MAX_BERICHT = 1000
/** Een formulier stuurt er hoogstens een handvol; meer is misbruik. */
export const MAX_PERSONEN_PER_INZENDING = 20
/** Een kind is hoogstens dit oud; daarboven reken je gewoon een volwassene. */
export const MAX_KIND_LEEFTIJD = 17
