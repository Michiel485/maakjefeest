import { buildCardDisplay } from "@/lib/cards"
import { fetchCardByToken } from "@/lib/cards-server"
import { getStyleConfig } from "@/lib/event-styles"
import { renderCardImage } from "@/lib/card-image"

export const dynamic = "force-dynamic"

// Download van de kaart als afbeelding (PNG, staand formaat)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const data = await fetchCardByToken(token)
  if (!data) return Response.json({ error: "Niet gevonden" }, { status: 404 })

  const display = buildCardDisplay(data.card.type, data.card.template, data.card.content, data.event)
  const sc = getStyleConfig(data.event.style)

  const image = await renderCardImage(display, sc, "download")

  const headers = new Headers(image.headers)
  headers.set("Content-Disposition", `attachment; filename="kaart-${data.event.slug}.png"`)
  headers.set("Cache-Control", "no-store")

  return new Response(image.body, { status: 200, headers })
}
