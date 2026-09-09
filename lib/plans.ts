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
  moment: string
  tagline: string
  features: string[]
  invoiceDescription: string
}

export const PLANS: Record<Plan, PlanInfo> = {
  save_the_date: {
    id: "save_the_date",
    label: "Save the Date",
    price: 15,
    moment: "6 tot 12 maanden vooraf",
    tagline: "Zet de datum bij je gasten in de agenda, in stijl.",
    features: [
      "Digitale Save the Date als envelop met lakzegel",
      "Versturen als link via WhatsApp of mail",
      "Ook als afbeelding te downloaden",
      "Kijkteller: zie hoeveel gasten hem openden",
      "Later upgraden, alles blijft staan",
    ],
    invoiceDescription: "Save the Date, digitale kaart",
  },
  uitnodiging: {
    id: "uitnodiging",
    label: "Uitnodiging & RSVP",
    price: 25,
    moment: "3 tot 4 maanden vooraf",
    tagline: "De uitnodiging die werkt: gasten reageren met één tik.",
    features: [
      "Alles van Save the Date",
      "Trouwkaart per gastengroep: dag, avond of receptie",
      "Eigen uitnodigingstekst en tijden per kaart",
      "RSVP-pagina met dieetwensen en aantal personen",
      "Dashboard met alle aanmeldingen en export",
    ],
    invoiceDescription: "Uitnodiging & RSVP, digitale kaarten met RSVP-pagina",
  },
  compleet: {
    id: "compleet",
    label: "Trouwwebsite compleet",
    price: 49.99,
    moment: "Alles voor jullie gasten op één plek",
    tagline: "Kaarten, RSVP en een complete trouwwebsite op jullie eigen adres.",
    features: [
      "Alles van Uitnodiging & RSVP",
      "Volledige trouwwebsite op jullienamen.sayingyes.nl",
      "Programma, informatie, cadeautips, ons verhaal en fotogalerij",
      "Live gastenfotomuur met QR-code en slideshow",
      "Thema's, wachtwoord en zes talen voor gasten",
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

export function planRank(plan: unknown): number {
  return PLAN_ORDER.indexOf(normalizePlan(plan))
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
// Zo verloopt een vroeg gekochte Save the Date nooit vóór de bruiloft.
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
