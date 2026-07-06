import { notFound } from "next/navigation"
import { buildCardDisplay } from "@/lib/cards"
import { fetchCardByToken } from "@/lib/cards-server"
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

  return renderCardImage(display, sc, "og")
}
