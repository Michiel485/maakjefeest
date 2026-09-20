// De prijsladder: drie pakketten op één product. Dit bestand is de enige plek
// met prijzen en rechten; kassa, webhook, dashboard, publieke site en
// marketing lezen allemaal hieruit. Geen imports, ook bruikbaar in client-code.

export type Plan = "save_the_date" | "uitnodiging" | "compleet"

export const PLAN_ORDER: Plan[] = ["save_the_date", "uitnodiging", "compleet"]

export const DEFAULT_PLAN: Plan = "compleet"

export interface PlanInfo {
  id: Plan
  label: string
  price: number
  subtitel: string
  tagline: string
  features: string[]
  invoiceDescription: string
}

export const PLANS: Record<Plan, PlanInfo> = {
  save_the_date: {
    id: "save_the_date",
    label: "Save the Date",
    price: 15,
    subtitel: "Zet de datum alvast bij je gasten in de agenda",
    tagline: "Zet de datum bij je gasten in de agenda, in stijl.",
    features: [
      "Digitale Save the Date als envelop met lakzegel",
      "Versturen als link via WhatsApp of mail",
      "Ook als afbeelding te downloaden",
      "Kijkteller: zie hoeveel gasten hem openden",
      "Geen einddatum en geen abonnement",
      "Later upgraden, alles blijft staan",
    ],
    invoiceDescription: "Save the Date, digitale kaart",
  },
  uitnodiging: {
    id: "uitnodiging",
    label: "Uitnodiging & RSVP",
    price: 25,
    subtitel: "De uitnodiging waar gasten met één tik op reageren",
    tagline: "De uitnodiging die werkt: gasten reageren met één tik.",
    features: [
      "Alles van Save the Date",
      "Trouwkaart per gastengroep: dag, avond of receptie",
      "Eigen uitnodigingstekst en tijden per kaart",
      "RSVP-pagina met dieetwensen en aantal personen",
      "Dashboard met alle aanmeldingen en export",
      "Geen einddatum en geen abonnement",
    ],
    invoiceDescription: "Uitnodiging & RSVP, digitale kaarten met RSVP-pagina",
  },
  compleet: {
    id: "compleet",
    label: "Trouwwebsite compleet",
    price: 49.99,
    subtitel: "Alles voor jullie gasten op één plek",
    tagline: "Kaarten, RSVP en een complete trouwwebsite op jullie eigen adres.",
    features: [
      "Alles van Uitnodiging & RSVP",
      "Volledige trouwwebsite op jullienamen.sayingyes.nl",
      "Programma, informatie, cadeautips, ons verhaal en fotogalerij",
      "Live gastenfotomuur met QR-code en slideshow",
      "Thema's, wachtwoord en zes talen voor gasten",
      "Een jaar online, daarna zelf verlengen",
    ],
    invoiceDescription: "Trouwwebsite compleet, 1 jaar live",
  },
}

export function isPlan(value: unknown): value is Plan {
  return value === "save_the_date" || value === "uitnodiging" || value === "compleet"
}

// Onbekend of ontbrekend (bijv. migratie nog niet gedraaid) telt als compleet:
// bestaande klanten mogen nooit iets verliezen.
export function normalizePlan(value: unknown): Plan {
  return isPlan(value) ? value : DEFAULT_PLAN
}

export type PlanFeature = "save_the_date_cards" | "trouwkaart_cards" | "rsvp" | "site" | "photos"

const RIGHTS: Record<Plan, Record<PlanFeature, boolean>> = {
  save_the_date: { save_the_date_cards: true, trouwkaart_cards: false, rsvp: false, site: false, photos: false },
  uitnodiging:   { save_the_date_cards: true, trouwkaart_cards: true,  rsvp: true,  site: false, photos: false },
  compleet:      { save_the_date_cards: true, trouwkaart_cards: true,  rsvp: true,  site: true,  photos: true },
}

export function planAllows(plan: unknown, feature: PlanFeature): boolean {
  return RIGHTS[normalizePlan(plan)][feature]
}

// Welke paginatypes van een event publiek zichtbaar zijn
export function publicPageTypes<T extends { type: string }>(plan: unknown, pages: T[]): T[] {
  const p = normalizePlan(plan)
  if (p === "compleet") return pages
  if (p === "uitnodiging") return pages.filter((page) => page.type === "RSVP")
  return []
}

// Welke pagina's het bruidspaar in de bouwer mag bewerken. Bij een kaartpakket
// is dat alleen de voorkant (namen, datum, locatie, stijl), want dat is wat er
// op de kaart komt.
const EDITABLE: Record<Plan, string[]> = {
  save_the_date: ["Home"],
  uitnodiging:   ["Home", "RSVP"],
  compleet:      ["Home", "OnsVerhaal", "Programma", "Informatie", "Cadeautips", "Ceremoniemeesters", "RSVP", "Fotos"],
}

export function editablePages(plan: unknown): string[] {
  return EDITABLE[normalizePlan(plan)]
}

export function isCardPlan(plan: unknown): boolean {
  return !planAllows(plan, "site")
}

// Verlengen is alleen zinvol bij een complete site (bijvoorbeeld om de
// fotogalerij na de bruiloft online te houden). Bij een kaartpakket bieden we
// in plaats daarvan een upgrade aan.
export function renewalAllowed(plan: unknown): boolean {
  return normalizePlan(plan) === "compleet"
}

// Waar begint iemand die dit pakket kiest: kaartpakketten in de kaartbouwer,
// de complete site via de aanmaakpagina van de websitebouwer.
export function planStartUrl(plan: unknown): string {
  const p = normalizePlan(plan)
  if (p === "save_the_date") return "/kaart-maken?type=save_the_date"
  if (p === "uitnodiging") return "/kaart-maken?type=trouwkaart"
  return "/aanmaken?plan=compleet"
}

export function planRank(plan: unknown): number {
  return PLAN_ORDER.indexOf(normalizePlan(plan))
}

// Korte regel onder de prijs: wat betaal je bij als je al een pakket hebt
export function upgradeHint(plan: unknown): string {
  const p = normalizePlan(plan)
  if (p === "save_the_date") return "Instappen kan hier; upgraden kost later alleen het verschil."
  if (p === "uitnodiging") return `Al een Save the Date gekocht? Dan betaal je slechts ${formatEur(upgradePrice("save_the_date", "uitnodiging") ?? 0)} bij.`
  return `Al een kaartpakket gekocht? Dan betaal je slechts het verschil: ${formatEur(upgradePrice("uitnodiging", "compleet") ?? 0)} of ${formatEur(upgradePrice("save_the_date", "compleet") ?? 0)}.`
}

// Bij te betalen bedrag; null als het geen upgrade is
export function upgradePrice(from: unknown, to: Plan): number | null {
  const f = normalizePlan(from)
  if (planRank(to) <= planRank(f)) return null
  return Math.round((PLANS[to].price - PLANS[f].price) * 100) / 100
}

export function formatEur(amount: number): string {
  return `€${amount.toFixed(2).replace(".", ",")}`
}

// Geldig tot de laatste van: betaaldatum + 12 maanden, trouwdatum + 1 maand.
// Alleen het pakket Compleet wordt hier ook echt op afgesloten (zie
// renewalAllowed); kaartpakketten hebben geen einddatum.
export function planExpiry(now: Date, datum: string | null | undefined): Date {
  const eenJaar = new Date(now)
  eenJaar.setFullYear(eenJaar.getFullYear() + 1)
  if (!datum) return eenJaar
  const trouwdag = new Date(datum)
  if (Number.isNaN(trouwdag.getTime())) return eenJaar
  const naBruiloft = new Date(trouwdag)
  naBruiloft.setMonth(naBruiloft.getMonth() + 1)
  return naBruiloft > eenJaar ? naBruiloft : eenJaar
}

// ── Teksten en termijnen voor de mails ──────────────────────────────────────
// Eén mail per moment, met de woorden per pakket hiervandaan. Aparte mails per
// product zouden drie keer onderhoud zijn en drie keer de kans dat er één
// achterloopt; dat is precies hoe de conceptherinnering over een trouwwebsite
// bleef praten nadat de prijsladder er was.
export interface PlanMailWoorden {
  // Waar het over gaat, in een zin: "jullie Save the Date staat nog klaar"
  ding: string
  // Wat de klant ermee gaat doen zodra hij betaald heeft
  werkwoord: string
  // Hetzelfde werkwoord als voltooid deelwoord, want dat is onregelmatig
  voltooid: string
  // Wat er verdwijnt als hij niets doet
  kwijt: string
  // Waar de knop in de mail naartoe gaat
  bouwerPad: string
}

export const PLAN_MAIL: Record<Plan, PlanMailWoorden> = {
  save_the_date: {
    ding: "jullie Save the Date",
    werkwoord: "versturen",
    voltooid: "verstuurd",
    kwijt: "jullie ontwerp",
    bouwerPad: "/kaart-maken",
  },
  uitnodiging: {
    ding: "jullie digitale uitnodiging",
    werkwoord: "versturen",
    voltooid: "verstuurd",
    kwijt: "jullie ontwerp en de RSVP-instellingen",
    bouwerPad: "/kaart-maken",
  },
  compleet: {
    ding: "jullie trouwwebsite",
    werkwoord: "publiceren",
    voltooid: "gepubliceerd",
    kwijt: "jullie concept",
    bouwerPad: "/bouwen",
  },
}

// Hoe lang een onbetaald ontwerp blijft staan en wanneer we herinneren, in
// dagen na de laatste activiteit. De laatste herinnering is de aankondiging
// dat het ontwerp wordt verwijderd.
export interface Bewaarschema {
  herinneringen: number[]
  verwijderNa: number
}

const BEWAARSCHEMA: Record<Plan, Bewaarschema> = {
  // Kaarten worden vaak maanden vooruit ontworpen, dus een half jaar bewaren.
  // Herinneringen na 6 weken, 3 maanden en een week voor het verwijderen.
  save_the_date: { herinneringen: [42, 91, 175], verwijderNa: 182 },
  uitnodiging:   { herinneringen: [42, 91, 175], verwijderNa: 182 },
  // Een concept van een site is minder lang houdbaar: tien weken, met een
  // herinnering na 6 weken en de aankondiging na 9 weken.
  compleet:      { herinneringen: [42, 63], verwijderNa: 70 },
}

export function bewaarschema(plan: unknown): Bewaarschema {
  return BEWAARSCHEMA[normalizePlan(plan)]
}

// De teksten van de conceptherinnering, los van het versturen zodat ze te
// controleren zijn zonder mail. Eén mail, de woorden per pakket uit
// lib/plans.ts: zo kan de tekst nooit meer over een trouwwebsite gaan terwijl
// iemand een Save the Date heeft gemaakt.
// Welke van de herinneringen dit is. Drie varianten, want dezelfde tekst twee
// keer sturen (na zes weken en na drie maanden) leest als een robot.
export type DraftHerinnering = "eerste" | "tussen" | "laatste"

export function draftReminderTekst({
  eventTitle,
  plan,
  variant,
  dagenTotVerwijderen,
}: {
  eventTitle: string
  plan: Plan
  variant: DraftHerinnering
  dagenTotVerwijderen: number
}) {
  const w = PLAN_MAIL[plan]
  const prijs = formatEur(PLANS[plan].price).replace(",00", "")
  const dagen = dagenTotVerwijderen === 1 ? "morgen" : `over ${dagenTotVerwijderen} dagen`
  const Ding = `${w.ding.charAt(0).toUpperCase()}${w.ding.slice(1)}`

  const subject = {
    eerste: `${Ding} staat nog klaar`,
    tussen: `Staat ${w.ding} nog in de planning?`,
    laatste: `Laatste herinnering: ${w.ding} wordt ${dagen} verwijderd`,
  }[variant]

  const headline = {
    eerste: `${Ding} staat nog klaar`,
    tussen: "Nog steeds voor jullie bewaard",
    laatste: "Laatste herinnering",
  }[variant]

  const bodyText = {
    eerste: `Het ontwerp voor <strong>${eventTitle}</strong> staat klaar, maar jullie gasten kunnen er nog niets van zien: ${w.ding} is nog niet ${w.voltooid}. Dat kost eenmalig ${prijs}, en daarna kun je hem ${w.werkwoord}.`,
    tussen: `Een tijd terug hebben jullie een ontwerp gemaakt voor <strong>${eventTitle}</strong>. Het staat er nog precies zoals jullie het achterlieten, maar ${w.ding} is nog niet ${w.voltooid}. Is de bruiloft nog in voorbereiding? Dan pak je het weer op waar je was; het kost eenmalig ${prijs}.`,
    laatste: `Dit is de laatste herinnering. Het ontwerp voor <strong>${eventTitle}</strong> staat er al een tijd en is nog niet ${w.voltooid}. Doen jullie niets, dan verwijderen we ${w.kwijt} ${dagen}. Wil je het houden, open het dan nog één keer; daarna staat het er weer een hele tijd.`,
  }[variant]

  return { w, prijs, dagen, laatste: variant === "laatste", subject, headline, bodyText }
}
