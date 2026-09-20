import { createServiceClient } from "@/lib/supabase"
import { fetchCardByToken, isOpenbaar } from "@/lib/cards-server"
import { isBotUserAgent } from "@/lib/visitors"

export const dynamic = "force-dynamic"

// Eenvoudige rem per IP (in-memory, per serverless instance), zelfde aanpak als
// /api/track. Voorkomt dat een ververs-knop de teller opblaast.
const hits = new Map<string, number[]>()
function teVeel(ip: string): boolean {
  const nu = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => nu - t < 60_000)
  recent.push(nu)
  hits.set(ip, recent)
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => nu - t >= 60_000)) hits.delete(k)
  }
  return recent.length > 20
}

// POST: een geopende kaart meetellen.
//
// Dit gebeurde eerder tijdens het renderen van de kaartpagina, maar die pagina
// is nu gecached: honderd gasten leveren dan één render en dus één tik. De
// teller hoort daarom bij de browser van de gast, net als de bezoekersteller.
//
// Antwoordt altijd 204: een teller mag nooit iets voor de gast breken.
export async function POST(request: Request) {
  const klaar = () => new Response(null, { status: 204 })
  try {
    const ua = request.headers.get("user-agent") ?? ""
    if (!ua || isBotUserAgent(ua)) return klaar()

    const ip =
      (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "0"
    if (teVeel(ip)) return klaar()

    const body = (await request.json().catch(() => null)) as { token?: unknown } | null
    if (!body || typeof body.token !== "string" || body.token.length > 64) return klaar()

    // Alleen kaarten die echt naar de gasten mogen tellen mee; een voorbeeld
    // van het bruidspaar zelf hoort niet in de kijkteller.
    const data = await fetchCardByToken(body.token)
    if (!data || !isOpenbaar(data)) return klaar()

    await createServiceClient().rpc("increment_card_views", { card_token: body.token })
  } catch {
    // stil: zie hierboven
  }
  return klaar()
}
