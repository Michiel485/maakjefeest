// In welke fase van de planning zit dit bruidspaar?
//
// Uit het klantreisgesprek van 21 september 2026. Twaalf momenten waren te fijn
// voor één scherm, dus ze zijn tot zes fasen samengetrokken. Het dashboard zet
// de fase waarin je zit bovenaan en klapt de rest in.
//
// Twee regels, en de tweede is de belangrijkste:
//
// 1. De trouwdatum bepaalt de fase. Dat is het enige vaste punt dat een
//    bruiloft heeft.
// 2. Wat je al gedaan hebt kan je vooruit duwen, nooit achteruit. Wie zijn
//    uitnodiging al verstuurd heeft zit in Najagen, ook op acht maanden
//    vooraf. Anders liegt het dashboard tegen iemand die harder is dan
//    gemiddeld, en dat is precies de klant die we niet willen afremmen.
//
// De fase wordt nergens opgeslagen. Een fase in een kolom loopt binnen een dag
// achter op de werkelijkheid, en er is niets aan op te slaan: hij volgt uit
// gegevens die we al hebben.
//
// Geen imports, zodat dit ook in clientcode bruikbaar is.

export type Fase =
  | "voorbereiden"
  | "save_the_date"
  | "uitnodigen"
  | "najagen"
  | "aftellen"
  | "na_de_dag"

/** De zes fasen op volgorde. De index is de voortgang. */
export const FASE_ORDE: readonly Fase[] = [
  "voorbereiden",
  "save_the_date",
  "uitnodigen",
  "najagen",
  "aftellen",
  "na_de_dag",
] as const

export const FASE_NAAM: Record<Fase, string> = {
  voorbereiden: "Voorbereiden",
  save_the_date: "Save the Date",
  uitnodigen: "Uitnodigen",
  najagen: "Najagen",
  aftellen: "Aftellen",
  na_de_dag: "Na de dag",
}

/** Wanneer een fase normaal begint, kort opgeschreven voor de fasenbalk. */
export const FASE_WANNEER: Record<Fase, string> = {
  voorbereiden: "vanaf nu",
  save_the_date: "14 tot 6 mnd",
  uitnodigen: "6 tot 3 mnd",
  najagen: "3 mnd tot 3 wkn",
  aftellen: "3 wkn tot de dag",
  na_de_dag: "erna",
}

/** Eén regel die zegt waar je nu mee bezig bent. Staat boven de tegels. */
export const FASE_UITLEG: Record<Fase, string> = {
  voorbereiden:
    "Nog niets verstuurd. Alles wat nu telt is je datum, en wie je wilt uitnodigen.",
  save_the_date:
    "Je Save the Date is eruit. Nu wil je weten wie er ongeveer komt, en wie nog niet heeft gereageerd.",
  uitnodigen:
    "Nu wordt het concreet: tijden, dresscode en de details die op de kaart en op de site moeten staan.",
  najagen:
    "Alles is verstuurd. Nu is er maar één vraag: wie heeft nog niet gereageerd.",
  aftellen:
    "De aantallen moeten naar de locatie, en wat er nu nog verandert moet iedereen weten.",
  na_de_dag:
    "Jullie zijn getrouwd. Er staat nog iets voor je klaar dat je niet wilt verliezen.",
}

// ── De grenzen ──────────────────────────────────────────────────────────────
// In dagen voor de trouwdag. Michiel heeft deze maanden bevestigd op
// 21 september 2026; ze zijn een standaard, niet een wet. Een bruidspaar dat
// het anders ziet kan ze verschuiven, en daarom staan ze hier bij elkaar en
// niet verspreid door de code.
export interface FaseGrenzen {
  /** Vanaf hoeveel dagen vooraf de Save the Date-fase begint. */
  saveTheDate: number
  /** Vanaf hoeveel dagen vooraf je gaat uitnodigen. */
  uitnodigen: number
  /** Vanaf hoeveel dagen vooraf het najagen begint. */
  najagen: number
  /** Vanaf hoeveel dagen vooraf het aftellen begint. */
  aftellen: number
}

export const STANDAARD_GRENZEN: FaseGrenzen = {
  saveTheDate: 425, // ongeveer 14 maanden
  uitnodigen: 182, // ongeveer 6 maanden
  najagen: 91, // ongeveer 3 maanden
  aftellen: 21, // drie weken
}

/** Grenzen van het bruidspaar aanvullen met de standaard, en op orde zetten. */
export function grenzen(eigen?: Partial<FaseGrenzen> | null): FaseGrenzen {
  const g = { ...STANDAARD_GRENZEN, ...(eigen ?? {}) }
  // Een omgekeerde grens zou een fase laten verdwijnen, dus we houden de reeks
  // aflopend. Liever een verschoven grens dan een dashboard dat een fase
  // overslaat.
  g.uitnodigen = Math.min(g.uitnodigen, g.saveTheDate)
  g.najagen = Math.min(g.najagen, g.uitnodigen)
  g.aftellen = Math.min(g.aftellen, g.najagen)
  return g
}

// ── Wat er al gedaan is ─────────────────────────────────────────────────────
// Bewust klein gehouden: alleen wat de fase kan veranderen. Alles hier komt uit
// gegevens die we toch al ophalen voor het dashboard.
export interface Gedaan {
  /** Is er een Save the Date gedeeld met gasten? */
  stdVerstuurd?: boolean
  /** Is er een uitnodiging of trouwkaart gedeeld met gasten? */
  invVerstuurd?: boolean
  /** Heeft de klant gezegd dat de aantallen bij de locatie liggen? */
  aantallenDoorgegeven?: boolean
}

/**
 * De fase uit de datum alleen. Zonder datum kun je niets plannen, dus dan is
 * het altijd Voorbereiden: je datum zetten is dan de enige zinvolle stap.
 */
export function faseUitDatum(
  trouwdag: Date | string | null | undefined,
  vandaag: Date = new Date(),
  eigen?: Partial<FaseGrenzen> | null
): Fase {
  if (!trouwdag) return "voorbereiden"
  const dag = trouwdag instanceof Date ? trouwdag : new Date(trouwdag)
  if (Number.isNaN(dag.getTime())) return "voorbereiden"

  const dagen = dagenTot(dag, vandaag)
  if (dagen < 0) return "na_de_dag"

  const g = grenzen(eigen)
  if (dagen > g.saveTheDate) return "voorbereiden"
  if (dagen > g.uitnodigen) return "save_the_date"
  if (dagen > g.najagen) return "uitnodigen"
  if (dagen > g.aftellen) return "najagen"
  return "aftellen"
}

/**
 * De fase zoals het dashboard hem gebruikt: de datum, vooruit geduwd door wat
 * er al gedaan is.
 *
 * Vooruit duwen doen we alleen, nooit achteruit. Iemand die zijn Save the Date
 * al verstuurd heeft terwijl de bruiloft nog ver weg is, is verder dan het
 * gemiddelde paar en hoort niet naar een leeg beginscherm te kijken. Maar
 * iemand die vier weken voor zijn bruiloft nog niets verstuurd heeft, hoort
 * wel degelijk het aftellen te zien: dat is geen fout, dat is haast.
 */
export function huidigeFase(
  trouwdag: Date | string | null | undefined,
  gedaan: Gedaan = {},
  vandaag: Date = new Date(),
  eigen?: Partial<FaseGrenzen> | null
): Fase {
  const uitDatum = faseUitDatum(trouwdag, vandaag, eigen)
  if (uitDatum === "na_de_dag") return uitDatum

  let vloer: Fase = "voorbereiden"
  if (gedaan.stdVerstuurd) vloer = "save_the_date"
  if (gedaan.invVerstuurd) vloer = "najagen"
  if (gedaan.aantallenDoorgegeven) vloer = "aftellen"

  return later(uitDatum, vloer)
}

/** Van twee fasen die het verst in de reis. */
export function later(a: Fase, b: Fase): Fase {
  return FASE_ORDE.indexOf(a) >= FASE_ORDE.indexOf(b) ? a : b
}

/** Hoe ver deze fase in de reis staat, nul tot vijf. */
export function faseIndex(f: Fase): number {
  return FASE_ORDE.indexOf(f)
}

export function faseVoorbij(fase: Fase, huidig: Fase): boolean {
  return faseIndex(fase) < faseIndex(huidig)
}

// ── Rekenen met dagen ───────────────────────────────────────────────────────
// Op hele dagen, niet op uren. Een bruiloft om drie uur 's middags is de hele
// dag lang "vandaag", en niet vanaf twaalf uur "geweest".

/** Hele dagen tussen vandaag en de trouwdag. Negatief betekent: geweest. */
export function dagenTot(trouwdag: Date | string, vandaag: Date = new Date()): number {
  const dag = trouwdag instanceof Date ? trouwdag : new Date(trouwdag)
  const a = Date.UTC(dag.getUTCFullYear(), dag.getUTCMonth(), dag.getUTCDate())
  const b = Date.UTC(vandaag.getUTCFullYear(), vandaag.getUTCMonth(), vandaag.getUTCDate())
  return Math.round((a - b) / 86400000)
}

/**
 * Hoe lang het nog duurt, in gewone woorden. Dit staat naast de datum bovenaan
 * het dashboard, dus het moet klinken zoals een mens het zou zeggen: niet
 * "over 274 dagen" maar "over 9 maanden".
 */
export function afstandInWoorden(
  trouwdag: Date | string | null | undefined,
  vandaag: Date = new Date()
): string {
  if (!trouwdag) return "datum nog niet bekend"
  const dag = trouwdag instanceof Date ? trouwdag : new Date(trouwdag)
  if (Number.isNaN(dag.getTime())) return "datum nog niet bekend"

  const d = dagenTot(dag, vandaag)
  if (d === 0) return "vandaag"
  if (d === 1) return "morgen"
  if (d === -1) return "gisteren"

  const weg = Math.abs(d)
  const maanden = Math.round(weg / 30.44)
  const jaren = Math.floor(maanden / 12)

  let hoeveel: string
  if (weg < 14) hoeveel = `${weg} dagen`
  else if (weg < 60) hoeveel = `${Math.round(weg / 7)} weken`
  else if (maanden < 18) hoeveel = `${maanden} ${maanden === 1 ? "maand" : "maanden"}`
  else if (maanden % 12 === 0) hoeveel = `${jaren} jaar`
  else hoeveel = `${jaren} jaar en ${maanden % 12} ${maanden % 12 === 1 ? "maand" : "maanden"}`

  return d > 0 ? `over ${hoeveel}` : `${hoeveel} geleden`
}
