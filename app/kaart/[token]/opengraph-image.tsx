import { notFound } from "next/navigation"
import { buildCardDisplay } from "@/lib/cards"
import { fetchCardByToken, isOpenbaar } from "@/lib/cards-server"
import { getStyleConfig } from "@/lib/event-styles"
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
  const sc = getStyleConfig(data.event.style)

  // Nog niet geactiveerd: watermerk, ook in de voorvertoning die WhatsApp maakt
  // Dezelfde regel als de kaartpagina: geactiveerd en in het pakket
  const betaald = isOpenbaar(data)

  return renderCardImage(display, sc, "og", !betaald)
}
