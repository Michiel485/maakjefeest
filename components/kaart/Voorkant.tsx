// De voorkant van een kaart, welk ontwerp het ook is. De drie eerste
// ontwerpen hebben hun eigen code (KlassiekeVoorkant), de nieuwe delen er één
// met de afbeelding (KaartVoorkant). Gebruikt op de kaartpagina, in het
// voorbeeld in de bouwer en in de galerij van ontwerpen.

import { isKlassiekOntwerp, type CardDisplay } from "@/lib/cards"
import type { SC } from "@/lib/event-styles"
import { browserLetters } from "@/lib/kaart-ontwerpen"
import KaartVoorkant from "./KaartVoorkant"
import KlassiekeVoorkant from "./KlassiekeVoorkant"

export default function Voorkant({ display, sc, breedte }: { display: CardDisplay; sc: SC; breedte: number }) {
  if (isKlassiekOntwerp(display.design)) return <KlassiekeVoorkant display={display} sc={sc} />
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <KaartVoorkant
        d={display}
        ontwerp={display.design}
        sc={sc}
        breedte={breedte}
        letters={browserLetters(display.design)}
        // Dezelfde schaduw als de eerste ontwerpen: alleen onder de kaart
        schaduw="0 26px 50px -26px rgba(0,0,0,0.5)"
      />
    </div>
  )
}
