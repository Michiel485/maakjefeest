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

// ── Een geplakte lijst lezen ────────────────────────────────────────────────
// Veel bruidsparen hebben hun gastenlijst al ergens staan, in een sheet of in
// een notitie. Plakken is dan sneller dan overtypen, en het is ook het halve
// werk van importeren uit Excel: wat je uit een sheet kopieert komt met tabs
// tussen de kolommen binnen.
//
// Bewust vergevingsgezind. We raden wat elk stukje is in plaats van een vast
// formaat te eisen, en laten het bruidspaar daarna zien wat we ervan begrepen
// hebben. Een verkeerde gok is dan een klik om te herstellen; een strenge
// regel is een doodlopende weg.

export interface GeplakteGast {
  voornaam: string
  achternaam: string
  email: string
  telefoon: string
}

/** Lijkt dit op een telefoonnummer? Cijfers, plussen en streepjes, minstens 8. */
function lijktOpTelefoon(s: string): boolean {
  const cijfers = s.replace(/[^0-9]/g, "")
  return cijfers.length >= 8 && /^[0-9+\-\s()./]+$/.test(s)
}

export function leesGeplakteLijst(tekst: string): GeplakteGast[] {
  const uit: GeplakteGast[] = []

  for (const regel of tekst.split(/\r?\n/)) {
    const delen = regel
      .split(/\t|;|,/)
      .map((d) => d.trim())
      .filter(Boolean)
    if (delen.length === 0) continue

    let email = ""
    let telefoon = ""
    const rest: string[] = []

    for (const d of delen) {
      if (!email && d.includes("@") && !d.includes(" ")) email = d
      else if (!telefoon && lijktOpTelefoon(d)) telefoon = d
      else rest.push(d)
    }

    // Wat overblijft is de naam. Twee losse stukken betekent meestal dat de
    // sheet voornaam en achternaam in aparte kolommen had.
    let voornaam = ""
    let achternaam = ""
    if (rest.length >= 2) {
      voornaam = rest[0]
      achternaam = rest.slice(1).join(" ")
    } else if (rest.length === 1) {
      const woorden = rest[0].split(/\s+/)
      voornaam = woorden[0]
      achternaam = woorden.slice(1).join(" ")
    }

    if (!voornaam) continue
    uit.push({
      voornaam: voornaam.slice(0, MAX_NAAM),
      achternaam: achternaam.slice(0, MAX_NAAM),
      email: email.slice(0, MAX_EMAIL),
      telefoon: telefoon.slice(0, MAX_TELEFOON),
    })
  }

  return uit
}

// ── De reis per product ─────────────────────────────────────────────────────
// Michiels model, en het is beter dan één statuskolom. Dat kon namelijk niet
// twee dingen tegelijk zeggen: of wíj het verstuurd hebben, en of de gast
// gereageerd heeft. Een met de hand toegevoegde gast stond daardoor meteen op
// "aanwezig" terwijl je nog niets had gehoord.
//
// Nu per product vier standen. Het verstuurd-zetten doet het bruidspaar zelf,
// want delen gaat via WhatsApp en dat kunnen wij niet zien. Reageert een gast
// via de kaart, dan zetten wij de stand automatisch op ja of nee.
export type Reis = "niet_verstuurd" | "verstuurd" | "ja" | "nee"

export const REIS_LABEL: Record<Reis, string> = {
  niet_verstuurd: "Niet verstuurd",
  verstuurd: "Verstuurd",
  ja: "Komt",
  nee: "Komt niet",
}

/** Welke van de twee producten. */
export type Product = "std" | "inv"

export const PRODUCT_LABEL: Record<Product, string> = {
  std: "Save the Date",
  inv: "Uitnodiging",
}

export function reis(waarde: unknown): Reis {
  return waarde === "verstuurd" || waarde === "ja" || waarde === "nee" ? waarde : "niet_verstuurd"
}

/** Heeft de gast op dit product gereageerd? */
export function heeftGereageerd(r: Reis): boolean {
  return r === "ja" || r === "nee"
}

/**
 * Wie kan een herinnering gebruiken: iedereen die de uitnodiging heeft gekregen
 * maar nog niet heeft gereageerd, plus wie hem nog niet eens heeft gehad.
 * Dat is letterlijk de lijst "wie moet ik nog najagen".
 */
export function moetNagejaagd(std: Reis, inv: Reis): boolean {
  return !heeftGereageerd(inv)
}

/**
 * Komt deze gast? Het laatste woord is van de uitnodiging; is die nog niet
 * beantwoord, dan geldt het voorlopige antwoord van de Save the Date. Zonder
 * antwoord weten we het niet, en dan is het geen ja.
 */
export function komtGast(std: Reis, inv: Reis): boolean | null {
  if (heeftGereageerd(inv)) return inv === "ja"
  if (heeftGereageerd(std)) return std === "ja"
  return null
}
