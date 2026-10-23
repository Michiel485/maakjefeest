// De tekst-tool op /trouwkaart-tekst (23 oktober 2026). "Trouwkaart tekst" is
// de meest gezochte vraag rond trouwkaarten, met varianten voor daggasten en
// avondgasten, en er bestaan alleen pagina's met losse voorbeeldzinnen. Hier
// kies je de gastengroep en de toon, en krijg je een tekst die bij jullie
// past, zonder AI en zonder server: gewone zinnen per groep en per toon,
// dezelfde als in het artikel over trouwkaartteksten. De boodschap gaat met
// één knop op de digitale kaart.

import type { CardGuestType } from "./cards"

export type Toon = "klassiek" | "warm" | "losjes"
/** De gastengroep van de kaart, of iedereen (geen groep op de kaart) */
export type Groep = CardGuestType | "iedereen"

export const GROEPEN: [Groep, string, string][] = [
  ["iedereen", "Iedereen", "Eén kaart voor alle gasten"],
  ["daggast", "Daggasten", "De hele dag erbij"],
  ["avondgast", "Avondgasten", "Alleen het feest"],
  ["receptiegast", "Receptiegasten", "Een toost tussendoor"],
]

export const TONEN: [Toon, string][] = [
  ["klassiek", "Klassiek"],
  ["warm", "Warm"],
  ["losjes", "Losjes"],
]

// De boodschap op de kaart. Zonder namen, datum, locatie en tijden: die staan
// op de kaart al op hun eigen plek, en in de volledige tekst zetten we ze er
// zelf omheen. Hoogstens zo'n 170 tekens, zodat hij op elk ontwerp past.
const BOODSCHAP: Record<Groep, Record<Toon, string>> = {
  iedereen: {
    klassiek: "Wij gaan trouwen en nodigen je van harte uit om deze dag met ons te vieren.",
    warm: "Wij gaan trouwen, en dat willen we vieren met de mensen van wie we houden. Dus met jou. Kom je?",
    losjes: "We gaan trouwen! En jij moet erbij zijn. Kom je?",
  },
  daggast: {
    klassiek: "Wij gaan trouwen en nodigen je van harte uit om deze dag van begin tot eind met ons te vieren: het ja-woord, het diner en het feest.",
    warm: "Jij hoort bij de mensen zonder wie onze dag niet compleet is. Daarom willen we je erbij hebben, van het eerste moment tot de laatste dans.",
    losjes: "We doen het gewoon: trouwen! En jij mag de hele dag mee. Ja-woord, eten, dansen. Kom je?",
  },
  avondgast: {
    klassiek: "Wij gaan trouwen en nodigen je van harte uit voor ons avondfeest. Kom met ons toosten en dansen.",
    warm: "Overdag zeggen we ja, maar het echte feest begint als jij binnenkomt. Kom je met ons dansen?",
    losjes: "Wij trouwen, en dat moet gevierd worden. Dansschoenen mee, wij regelen de rest.",
  },
  receptiegast: {
    klassiek: "Wij gaan trouwen en nodigen je graag uit voor de receptie, om samen te toosten op ons huwelijk.",
    warm: "Een moment om samen het glas te heffen: dat gunnen we jou en onszelf. Kom je toosten?",
    losjes: "Wij trouwen! Kom je een glas met ons drinken?",
  },
}

export interface TekstInvoer {
  een: string
  twee: string
  datum: string
  locatie: string
  groep: Groep
  toon: Toon
  /** Hoe laat gasten welkom zijn, als 13:30 */
  van: string
  /** Tot hoe laat, leeg is open einde */
  tot: string
  /** Tot wanneer gasten kunnen antwoorden, als 2027-05-01 */
  antwoordVoor: string
}

export const LEEG_INVOER: TekstInvoer = {
  een: "",
  twee: "",
  datum: "",
  locatie: "",
  groep: "iedereen",
  toon: "warm",
  van: "",
  tot: "",
  antwoordVoor: "",
}

export function boodschap(groep: Groep, toon: Toon): string {
  return BOODSCHAP[groep][toon]
}

/** "Vanaf 20:30 uur" of "Van 17:00 tot 18:30 uur"; leeg zonder begintijd */
export function tijdenRegel(van: string, tot: string, groep: Groep): string {
  const v = tijd(van)
  if (!v) return ""
  const t = tijd(tot)
  if (t) return `Van ${v} tot ${t} uur`
  if (groep === "daggast") return `Je bent welkom vanaf ${v} uur`
  return `Vanaf ${v} uur`
}

/** "Laat ons uiterlijk 1 mei 2027 weten of je erbij bent."; leeg zonder datum */
export function antwoordRegel(antwoordVoor: string): string {
  const d = datumLang(antwoordVoor)
  return d ? `Laat ons uiterlijk ${d} weten of je erbij bent.` : ""
}

/** "zaterdag 12 juni 2027" */
export function datumMetDag(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ""
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function datumLang(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ""
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

function tijd(t: string): string {
  return /^\d{1,2}:\d{2}$/.test(t.trim()) ? t.trim() : ""
}

/**
 * De volledige tekst, zoals je hem op een papieren kaart zou zetten of in een
 * bericht plakt: kop, namen, datum, locatie, boodschap, tijden en de vraag om
 * te antwoorden. Alleen de regels die zijn ingevuld.
 */
export function volledigeTekst(i: TekstInvoer, namen: string): string {
  const regels = [
    "Wij gaan trouwen",
    "",
    namen,
    "",
    datumMetDag(i.datum),
    i.locatie.trim(),
    "",
    boodschap(i.groep, i.toon),
    "",
    tijdenRegel(i.van, i.tot, i.groep),
    "",
    antwoordRegel(i.antwoordVoor),
  ]
  // Lege regels alleen als scheiding tussen twee gevulde blokken
  return regels
    .reduce<string[]>((acc, r) => {
      if (r === "" && (acc.length === 0 || acc[acc.length - 1] === "")) return acc
      acc.push(r)
      return acc
    }, [])
    .join("\n")
    .trim()
}
