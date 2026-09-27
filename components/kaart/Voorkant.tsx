// De voorkant van een kaart, welk ontwerp het ook is. De drie eerste
// ontwerpen hebben hun eigen code (KlassiekeVoorkant), de nieuwe delen er één
// met de afbeelding (KaartVoorkant). Gebruikt op de kaartpagina, in het
// voorbeeld in de bouwer en in de galerij van ontwerpen.

import { isKlassiekOntwerp, type CardDisplay } from "@/lib/cards"
import type { SC } from "@/lib/event-styles"
import { browserLetters } from "@/lib/kaart-ontwerpen"
import { gemetenLetter, getTitleFont } from "@/lib/title-fonts"
import KaartVoorkant from "./KaartVoorkant"
import KlassiekeVoorkant from "./KlassiekeVoorkant"

export default function Voorkant({
  display,
  sc,
  breedte,
  vullen,
}: {
  display: CardDisplay
  sc: SC
  breedte: number
  /** Galerij: de eerste drie ontwerpen minstens zo hoog, zie KlassiekeVoorkant */
  vullen?: number
}) {
  if (isKlassiekOntwerp(display.design)) return <KlassiekeVoorkant display={display} sc={sc} vullen={vullen} breedte={breedte} />
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <KaartVoorkant
        d={display}
        ontwerp={display.design}
        sc={sc}
        breedte={breedte}
        // Een eigen lettertype voor de namen gaat voor dat van het ontwerp
        letters={display.namenFont ? { ...browserLetters(display.design), namen: getTitleFont(display.namenFont).family } : browserLetters(display.design)}
        namenMeting={gemetenLetter(display.namenFont)}
        // Dezelfde schaduw als de eerste ontwerpen: alleen onder de kaart
        schaduw="0 26px 50px -26px rgba(0,0,0,0.5)"
      />
    </div>
  )
}
