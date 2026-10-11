import { getAllTips } from "@/lib/tips"
import { meldBijIndexNow } from "@/lib/indexnow"
import { MARKETING_URL } from "@/lib/site-url"

// Elke ochtend: artikelen met een datum of `updated` van vandaag of gisteren
// gaan naar IndexNow, zodat Bing ze binnen een dag kent. Twee dagen, zodat een
// artikel dat 's avonds live gaat de volgende ochtend nog meekomt. Andere
// wijzigingen (homepage, zoekpagina's) meld je met scripts/indexnow.mjs.
export const dynamic = "force-dynamic"

function dagInAmsterdam(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" })
}

export async function GET(request: Request) {
  const expectedToken = process.env.CRON_SECRET
  if (!expectedToken || request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const nu = new Date()
  const recent = new Set([dagInAmsterdam(nu), dagInAmsterdam(new Date(nu.getTime() - 24 * 60 * 60 * 1000))])
  const tips = getAllTips().filter((t) => recent.has(t.date) || (t.updated ? recent.has(t.updated) : false))
  if (tips.length === 0) return Response.json({ gemeld: [] })

  // Een nieuw artikel verandert ook de lijst op /tips en de homepage
  const urls = [`${MARKETING_URL}/tips`, MARKETING_URL, ...tips.map((t) => `${MARKETING_URL}/tips/${t.slug}`)]
  const status = await meldBijIndexNow(urls)
  return Response.json({ gemeld: urls, status })
}
