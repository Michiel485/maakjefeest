import { createServiceClient } from "@/lib/supabase"
import { isMarketingHost } from "@/lib/marketing-host"
import { cleanPath, deviceType, isBotUserAgent, referrerHost, visitorHash } from "@/lib/visitors"

export const dynamic = "force-dynamic"

// Eenvoudige rem per IP (in-memory, per serverless instance)
const hits = new Map<string, number[]>()
function teVeel(ip: string): boolean {
  const nu = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => nu - t < 60_000)
  recent.push(nu)
  hits.set(ip, recent)
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => nu - t >= 60_000)) hits.delete(k)
  }
  return recent.length > 60
}

// POST: een anonieme paginaweergave registreren. Antwoordt altijd 204: tracking
// mag nooit iets voor de bezoeker breken, ook niet als de tabel nog ontbreekt.
export async function POST(request: Request) {
  const klaar = () => new Response(null, { status: 204 })
  try {
    const host = request.headers.get("host") ?? ""
    if (!isMarketingHost(host, process.env.NODE_ENV !== "production")) return klaar()

    const ua = request.headers.get("user-agent") ?? ""
    if (!ua || isBotUserAgent(ua)) return klaar()

    // Respecteer een browser die niet gevolgd wil worden
    if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return klaar()

    const ip =
      (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "0"
    if (teVeel(ip)) return klaar()

    const body = (await request.json().catch(() => null)) as { path?: unknown; referrer?: unknown } | null
    if (!body || typeof body.path !== "string") return klaar()

    await createServiceClient().from("page_views").insert({
      path: cleanPath(body.path),
      referrer_host: referrerHost(typeof body.referrer === "string" ? body.referrer : null),
      country: request.headers.get("x-vercel-ip-country"),
      device: deviceType(ua),
      visitor_hash: visitorHash(ip, ua),
    })
  } catch {
    // bewust stil: statistiek is nooit belangrijker dan de pagina
  }
  return klaar()
}
