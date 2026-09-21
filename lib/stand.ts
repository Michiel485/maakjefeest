// Hoe het ervoor staat, per mail.
//
// Michiels vraag van 21 september 2026: willen we bij elke reactie een bericht
// sturen, of dagelijks, of wekelijks? En zijn zorg erbij: veel mails op vaste
// momenten is foutgevoelig.
//
// Het antwoord is deze drie regels:
//
// 1. Niet per reactie. Tachtig gasten is tachtig mails, en dan zet iemand het
//    uit. Dan horen ze ook niets meer op het moment dat het wel telt.
// 2. De klant kiest zelf hoe vaak. Wij bepalen dat niet voor hem.
// 3. Niets sturen als er niets nieuws is. Een mail die zegt "er is niets
//    gebeurd" leert de klant om onze mails weg te klikken.
//
// Eén soort mail dus, met een frequentie die de klant kiest. Geen kalender met
// momenten die elk hun eigen tekst hebben; dat is precies de constructie die in
// september de verkeerde pakketnaam in een herinnering zette.
//
// Geen imports, zodat dit ook in clientcode bruikbaar is.

export type Frequentie = "nooit" | "dagelijks" | "wekelijks" | "maandelijks"

export const FREQUENTIE_LABEL: Record<Frequentie, string> = {
  nooit: "Nooit",
  dagelijks: "Dagelijks",
  wekelijks: "Wekelijks",
  maandelijks: "Maandelijks",
}

export const FREQUENTIE_UITLEG: Record<Frequentie, string> = {
  nooit: "je kijkt zelf in je dashboard",
  dagelijks: "alleen op dagen dat er iets binnenkwam",
  wekelijks: "één mail per week met de stand",
  maandelijks: "genoeg als je bruiloft nog ver weg is",
}

export function frequentie(waarde: unknown): Frequentie {
  return waarde === "nooit" || waarde === "dagelijks" || waarde === "maandelijks"
    ? waarde
    : "wekelijks"
}

/** Hoeveel dagen er minstens tussen twee mails zitten. */
const WACHT_DAGEN: Record<Frequentie, number> = {
  nooit: Infinity,
  dagelijks: 1,
  wekelijks: 7,
  maandelijks: 28,
}

const DAG_MS = 24 * 60 * 60 * 1000

/**
 * Mag er nu een standmail uit?
 *
 * Twee voorwaarden, en ze moeten allebei waar zijn. De klant heeft lang genoeg
 * gewacht, en er is iets nieuws om te melden. Dat tweede is het belangrijkste:
 * zonder die regel krijgt iemand die wekelijks kiest ook in de stille maanden
 * elke week een mail waarin niets staat, en leert hij ons weg te klikken.
 */
export function magStandMail(
  keuze: Frequentie,
  laatstGemaild: string | Date | null | undefined,
  ietsNieuws: boolean,
  nu: Date = new Date()
): boolean {
  if (keuze === "nooit") return false
  if (!ietsNieuws) return false
  if (!laatstGemaild) return true

  const toen = laatstGemaild instanceof Date ? laatstGemaild : new Date(laatstGemaild)
  if (Number.isNaN(toen.getTime())) return true

  return nu.getTime() - toen.getTime() >= WACHT_DAGEN[keuze] * DAG_MS - 60_000
}

// ── Wat er in de mail staat ─────────────────────────────────────────────────

export interface StandCijfers {
  gasten: number
  komen: number
  nietKomen: number
  stil: number
  /** Hoeveel gasten er sinds de vorige mail iets lieten weten. */
  nieuw: number
}

/**
 * De regel bovenaan de mail. Die moet in één oogopslag zeggen of er iets aan de
 * hand is, want dat is de enige reden om zo'n mail te openen.
 */
export function standKop(c: StandCijfers): string {
  if (c.nieuw === 1) return "Eén nieuwe reactie"
  if (c.nieuw > 1) return `${c.nieuw} nieuwe reacties`
  return "De stand van je gastenlijst"
}

/**
 * Eén regel die zegt wat het bruidspaar nu zou doen. Niet een samenvatting van
 * de cijfers, die staan er al; dit is het advies.
 */
export function standAdvies(c: StandCijfers): string {
  if (c.gasten === 0) {
    return "Er staat nog niemand in je lijst. Typ of plak je gasten, of verstuur je kaart en laat de lijst zich vullen door wie er antwoordt."
  }
  if (c.stil === 0) {
    return "Iedereen heeft laten weten of hij komt. Dat is eerder de uitzondering dan de regel."
  }
  if (c.stil === 1) {
    return "Van één gast heb je nog niets gehoord. In je gastenlijst selecteer je hem met één druk, dan schrijven wij het berichtje en verstuur jij het zelf."
  }
  return `Van ${c.stil} gasten heb je nog niets gehoord. In je gastenlijst selecteer je ze met één druk, dan schrijven wij het berichtje en verstuur jij het zelf.`
}
