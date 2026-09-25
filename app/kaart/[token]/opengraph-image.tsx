import { kaartKleuren } from "@/lib/kaart-paletten"
import { notFound } from "next/navigation"
import { buildCardDisplay } from "@/lib/cards"
import { fetchCardByToken, isOpenbaar } from "@/lib/cards-server"
import { getStyleConfig, isStyle } from "@/lib/event-styles"
import { renderCardImage } from "@/lib/card-image"

export const alt = "Digitale kaart"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// WhatsApp/social preview: de kaart als afbeelding in de themastijl
export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await fetchCardByToken(token)
  if (!data) notFound()

  const display = buildCardDisplay(data.card.type, data.card.template, data.card.content, data.event)
  // De kleuren van de kaart: die van de website, of een eigen palet
  const sc = kaartKleuren(getStyleConfig(isStyle(data.card.content.stijl) ? data.card.content.stijl : data.event.style), data.card.content.kleur)

  // Nog niet geactiveerd: watermerk, ook in de voorvertoning die WhatsApp maakt
  // Dezelfde regel als de kaartpagina: geactiveerd en in het pakket
  const betaald = isOpenbaar(data)

  return renderCardImage(display, sc, "og", !betaald)
}
