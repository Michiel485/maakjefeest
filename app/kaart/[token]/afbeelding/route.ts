import { kaartKleuren } from "@/lib/kaart-paletten"
import { buildCardDisplay } from "@/lib/cards"
import { fetchCardByToken, isOpenbaar } from "@/lib/cards-server"
import { getStyleConfig, isStyle } from "@/lib/event-styles"
import { renderCardImage } from "@/lib/card-image"

export const dynamic = "force-dynamic"

// Download van de kaart als afbeelding (PNG, staand formaat).
// Zolang het pakket niet geactiveerd is, komt er een watermerk over de kaart:
// de kaart is het product, dus een voorbeeld mag niet als echte kaart bruikbaar zijn.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const data = await fetchCardByToken(token)
  if (!data) return Response.json({ error: "Niet gevonden" }, { status: 404 })

  // Dezelfde regel als de kaartpagina: geactiveerd en in het pakket
  const betaald = isOpenbaar(data)

  const display = buildCardDisplay(data.card.type, data.card.template, data.card.content, data.event)
  // De kleuren van de kaart: die van de website, of een eigen palet
  const sc = kaartKleuren(getStyleConfig(isStyle(data.card.content.stijl) ? data.card.content.stijl : data.event.style), data.card.content.kleur)

  const image = await renderCardImage(display, sc, "download", !betaald)

  const naam = betaald ? `kaart-${data.event.slug}.png` : `voorbeeld-${data.event.slug}.png`
  const headers = new Headers(image.headers)
  headers.set("Content-Disposition", `attachment; filename="${naam}"`)
  headers.set("Cache-Control", "no-store")

  return new Response(image.body, { status: 200, headers })
}
