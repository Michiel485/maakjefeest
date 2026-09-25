// De envelop van een kaart, automatisch passend bij het ontwerp.
//
// Eerst (25 september 2026) kon je in de bouwer de kleur, een voering en het
// zegel kiezen. Michiel vond dat te veel, en het oogde goedkoop: "less is
// more". Dus weer zoals het was, de envelop in de stijl van de kaart, en
// alleen de nieuwe ontwerpen die daar iets eigens bij hebben krijgen dat
// vanzelf. Geen keuzes in de bouwer.

import type { CardDesign } from "./cards"
import type { SC } from "./event-styles"

export interface EnvelopStijl {
  /** De envelop zelf */
  lichaam: string
  /** Wat je aan de binnenkant ziet als de klep opengaat; leeg is geen voering */
  voering: string | null
  zegel: string
  zegelTekst: string
}

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export function envelopStijl(sc: SC, ontwerp: CardDesign): EnvelopStijl {
  const lichaam = sc.cardBg ?? sc.navBg
  const standaard: EnvelopStijl = { lichaam, voering: null, zegel: sc.accent, zegelTekst: sc.buttonText }

  // Minimaal: een zegel in de kleur van de namen, zonder goud of kleur
  if (ontwerp === "minimaal") {
    return { ...standaard, zegel: sc.cardText ?? sc.headingColor, zegelTekst: lichaam }
  }

  // Art deco: dezelfde waaier als op de kaart, fijn en in de accentkleur, aan
  // de binnenkant van de klep
  if (ontwerp === "deco") {
    const waaier = svgUrl(
      `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='20' viewBox='0 0 36 20'><g fill='none' stroke='${sc.accent}' stroke-opacity='0.55' stroke-width='0.8'><path d='M0 20a18 18 0 0 1 36 0'/><path d='M6 20a12 12 0 0 1 24 0'/><path d='M12 20a6 6 0 0 1 12 0'/></g></svg>`
    )
    return { ...standaard, voering: `${waaier} 0 0 / 36px 20px, ${lichaam}` }
  }

  return standaard
}
