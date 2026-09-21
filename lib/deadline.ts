// De deadline waarop de aantallen bij de locatie moeten liggen.
//
// Dit komt uit Michiels eigen bruiloft, juni 2026. Hij gaf zijn definitieve
// gastenlijst te laat door, de locatie had de inkoop al gedaan, en hij heeft
// betaald voor gasten die niet kwamen. Dat is de enige plek in de hele
// klantreis waar te laat zijn direct geld kost.
//
// Wij sturen nooit iets naar de locatie. Dat blijft van de klant, net als alle
// berichten aan gasten. Wij weten alleen wanneer het moet en hoeveel het nu
// zijn, en dat is precies wat hij die week niet wist.
//
// Drie berichten en niet meer, en ze stoppen allemaal zodra de klant zegt dat
// het gelukt is. Michiels waarschuwing over mails op vaste momenten is hier
// verwerkt: er is één template met drie standen, geen drie templates.
//
// Geen imports, zodat dit ook in clientcode bruikbaar is.

/** Standaard hoeveel dagen voor de trouwdag. Bij Michiels locatie was het een
 *  week; hij stelde twee weken voor als veilige standaard. */
export const STANDAARD_DAGEN_VOORAF = 14

/** Na zoveel dagen te laat vragen we één keer of het gelukt is. */
export const NAVRAAG_NA_DAGEN = 3

/** Vanaf zoveel dagen vooraf gaat de eerste herinnering eruit. */
export const EERSTE_HERINNERING_DAGEN = 10

/** Een deadline van langer dan dit geleden laten we met rust. */
const TE_OUD_DAGEN = 30

export const MAX_LOCATIE_NAAM = 80

export type DeadlineMoment = "tien" | "dag" | "navraag"

export interface Deadline {
  /** De naam van de locatie of cateraar, zoals de klant hem noemt. */
  naam: string | null
  /** De dag waarop zij de aantallen willen hebben. */
  datum: string | null
  /** De klant heeft gezegd dat het doorgegeven is. Dan zwijgen we voorgoed. */
  gedaan: boolean
  /** Wanneer welk bericht eruit ging, zodat er nooit twee van hetzelfde komen. */
  gemaild: Partial<Record<DeadlineMoment, string | null>>
}

export const LEGE_DEADLINE: Deadline = {
  naam: null,
  datum: null,
  gedaan: false,
  gemaild: {},
}

/** Wat er in events.deadline staat, met alle rommel eruit. */
export function leesDeadline(waarde: unknown): Deadline {
  const v = (waarde ?? {}) as Partial<Deadline>
  const datum =
    typeof v.datum === "string" && !Number.isNaN(new Date(v.datum).getTime()) ? v.datum : null
  const g = (v.gemaild ?? {}) as Record<string, unknown>
  return {
    naam: typeof v.naam === "string" && v.naam.trim() ? v.naam.trim().slice(0, MAX_LOCATIE_NAAM) : null,
    datum,
    gedaan: v.gedaan === true,
    gemaild: {
      tien: typeof g.tien === "string" ? g.tien : null,
      dag: typeof g.dag === "string" ? g.dag : null,
      navraag: typeof g.navraag === "string" ? g.navraag : null,
    },
  }
}

/** Is er iets ingesteld waar we iets mee kunnen? */
export function isIngesteld(d: Deadline): boolean {
  return !!d.datum
}

/** Hele dagen tot de deadline. Negatief betekent: die is al geweest. */
export function dagenTotDeadline(d: Deadline, vandaag: Date = new Date()): number | null {
  if (!d.datum) return null
  const dag = new Date(d.datum)
  if (Number.isNaN(dag.getTime())) return null
  const a = Date.UTC(dag.getUTCFullYear(), dag.getUTCMonth(), dag.getUTCDate())
  const b = Date.UTC(vandaag.getUTCFullYear(), vandaag.getUTCMonth(), vandaag.getUTCDate())
  return Math.round((a - b) / 86400000)
}

/**
 * Welk bericht is nu aan de beurt, of geen.
 *
 * De volgorde is van laat naar vroeg, en zodra een later bericht eruit is
 * stoppen we. Daardoor kan elk moment hoogstens één keer afgaan, en krijgt
 * iemand die zijn deadline pas vijf dagen vooraf instelt niet eerst nog de
 * herinnering van tien dagen ervoor. Eén bericht per moment, nooit een inhaalrace.
 */
export function welkBericht(d: Deadline, vandaag: Date = new Date()): DeadlineMoment | null {
  if (d.gedaan) return null
  const over = dagenTotDeadline(d, vandaag)
  if (over == null) return null
  // Een deadline van vorig jaar laten we met rust. Dat is geen herinnering
  // meer, dat is spam over iets dat niet meer te repareren is.
  if (over < -TE_OUD_DAGEN) return null

  if (d.gemaild.navraag) return null
  if (over <= -NAVRAAG_NA_DAGEN) return "navraag"

  if (d.gemaild.dag) return null
  if (over <= 0) return "dag"

  if (d.gemaild.tien) return null
  if (over <= EERSTE_HERINNERING_DAGEN) return "tien"

  return null
}

/** Een datum voorstellen op basis van de trouwdag. */
export function voorstelDatum(
  trouwdag: string | null | undefined,
  dagenVooraf: number = STANDAARD_DAGEN_VOORAF
): string | null {
  if (!trouwdag) return null
  const dag = new Date(trouwdag)
  if (Number.isNaN(dag.getTime())) return null
  dag.setUTCDate(dag.getUTCDate() - dagenVooraf)
  return dag.toISOString().slice(0, 10)
}

// ── De woorden per bericht ──────────────────────────────────────────────────
// Eén plek, zoals bij de conceptherinneringen in lib/plans.ts. Dat bestaat
// omdat de mailteksten daarvoor uit elkaar liepen, en dat gebeurt opnieuw
// zodra dezelfde tekst op twee plekken staat.

export interface DeadlineTekst {
  onderwerp: string
  kop: string
  eerste: string
  /** De regel bij de knop, of null als er geen knop hoort. */
  knop: string | null
}

export function deadlineTekst(
  moment: DeadlineMoment,
  naam: string | null,
  over: number
): DeadlineTekst {
  const wie = naam ?? "je locatie"
  const dagen = Math.abs(over)
  const dagWoord = dagen === 1 ? "dag" : "dagen"

  if (moment === "tien") {
    return {
      onderwerp:
        over === 1
          ? `Morgen wil ${wie} je aantallen`
          : `Over ${dagen} ${dagWoord} wil ${wie} je aantallen`,
      kop: over === 1 ? `Morgen: aantallen naar ${wie}` : `Over ${dagen} ${dagWoord}: aantallen naar ${wie}`,
      eerste: `Dit is het moment waarop het bij veel bruiloften misgaat. Wie te laat is betaalt voor gasten die niet komen, want de inkoop is dan al gedaan.`,
      knop: "Overzicht voor de cateraar",
    }
  }

  if (moment === "dag") {
    return {
      onderwerp: `Vandaag: je aantallen naar ${wie}`,
      kop: `Vandaag wil ${wie} je aantallen`,
      eerste: `Hieronder staat de stand van vandaag. Het overzicht voor de cateraar kun je met één klik openen en doorsturen.`,
      knop: "Overzicht voor de cateraar",
    }
  }

  return {
    onderwerp: `Heb je je aantallen doorgegeven?`,
    kop: `Is het gelukt met je aantallen?`,
    eerste: `Je deadline bij ${wie} was ${dagen} ${dagWoord} geleden. Zeg je dat het gelukt is, dan houden we er voorgoed over op.`,
    knop: "Ja, doorgegeven",
  }
}
