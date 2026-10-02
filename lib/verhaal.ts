// Ons verhaal in momenten (ontwerpronde, 2 oktober 2026): twee tot zes korte
// stukjes met elk een jaar of een woord, een foto en een paar zinnen, plus één
// zin die eruit springt. Het oude verhaal (één tekst, één foto) wordt gelezen
// als één moment, zodat er niets verloren gaat en er geen migratie nodig is.

export interface Moment {
  id: string
  /** "2016", of een woord als "Het aanzoek" */
  jaar?: string
  titel?: string
  tekst: string
  image_url?: string | null
  image_pos_x?: number
  image_pos_y?: number
}

export const MAX_MOMENTEN = 6

function tekstOf(v: unknown): string {
  return typeof v === "string" ? v : ""
}

/** De momenten uit de inhoud van de pagina, met het oude verhaal als eerste moment */
export function verhaalMomenten(content: unknown): Moment[] {
  const c = (content && typeof content === "object" ? content : {}) as Record<string, unknown>
  if (Array.isArray(c.momenten)) {
    return (c.momenten as Partial<Moment>[]).map((m, i) => ({
      id: m.id ?? `m${i}`,
      jaar: tekstOf(m.jaar) || undefined,
      titel: tekstOf(m.titel) || undefined,
      tekst: tekstOf(m.tekst),
      image_url: typeof m.image_url === "string" && m.image_url ? m.image_url : null,
      image_pos_x: typeof m.image_pos_x === "number" ? m.image_pos_x : 50,
      image_pos_y: typeof m.image_pos_y === "number" ? m.image_pos_y : 50,
    }))
  }
  const tekst = tekstOf(c.text).trim()
  const foto = typeof c.image_url === "string" && c.image_url ? c.image_url : null
  if (!tekst && !foto) return []
  return [{
    id: "oud",
    tekst,
    image_url: foto,
    image_pos_x: typeof c.image_pos_x === "number" ? c.image_pos_x : 50,
    image_pos_y: typeof c.image_pos_y === "number" ? c.image_pos_y : 50,
  }]
}

/** De uitgelichte zin */
export function verhaalQuote(content: unknown): string {
  const c = (content && typeof content === "object" ? content : {}) as Record<string, unknown>
  return tekstOf(c.quote).trim()
}

/** Staat er iets in het verhaal dat een gast kan zien? */
export function verhaalHeeftInhoud(content: unknown): boolean {
  return verhaalQuote(content).length > 0 || verhaalMomenten(content).some((m) => m.tekst.trim() || m.image_url)
}
