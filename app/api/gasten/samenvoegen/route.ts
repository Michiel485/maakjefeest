import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { komtGast, reis, type Reis } from "@/lib/gasten"

export const dynamic = "force-dynamic"

// POST: twee regels uit de gastenlijst samenvoegen tot één.
//
// Voor een gast die er twee keer in staat: een typfout tussen de Save the Date
// en de trouwkaart, of een keer zelf ingetypt en een keer zelf aangemeld. Het
// bruidspaar kiest dit zelf; wij voegen nooit uit onszelf samen, want twee
// neven met bijna dezelfde naam bestaan echt (Michiel, 24 september 2026).
//
// Wat er gebeurt:
// - "houd" blijft bestaan, met zijn naam. "weg" verdwijnt.
// - Per product telt het sterkste: een antwoord boven verstuurd boven niets.
//   Hebben ze allebei geantwoord, dan het nieuwste antwoord.
// - Lege velden van "houd" worden aangevuld uit "weg": mail, telefoon,
//   dieetwensen, adres, welke kaart hij kreeg, enzovoort.

const RANG: Record<Reis, number> = { niet_verstuurd: 0, verstuurd: 1, ja: 2, nee: 2 }

// Die laten we staan zoals ze op "houd" staan.
const NIET_AANVULLEN = new Set([
  "id", "event_id", "created_at", "bijgewerkt_at", "submission_id", "is_primary",
  "name", "voornaam", "std_status", "inv_status", "attending", "status",
])

function leeg(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "")
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { houd?: unknown; weg?: unknown } | null
  const houdId = typeof body?.houd === "string" ? body.houd : null
  const wegId = typeof body?.weg === "string" ? body.weg : null
  if (!houdId || !wegId || houdId === wegId) {
    return Response.json({ error: "Kies twee verschillende gasten." }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: rijen } = await service.from("rsvp").select("*").in("id", [houdId, wegId])
  const houd = rijen?.find((r) => r.id === houdId) as Record<string, unknown> | undefined
  const weg = rijen?.find((r) => r.id === wegId) as Record<string, unknown> | undefined
  if (!houd || !weg) return Response.json({ error: "Deze gasten bestaan niet meer." }, { status: 404 })
  if (houd.event_id !== weg.event_id) {
    return Response.json({ error: "Deze gasten horen bij verschillende bruiloften." }, { status: 400 })
  }

  const { data: event } = await service.from("events").select("user_email").eq("id", houd.event_id as string).single()
  if (!event || event.user_email !== user.email) return Response.json({ error: "Geen toegang" }, { status: 403 })

  const tijd = (r: Record<string, unknown>) => new Date((r.bijgewerkt_at as string) ?? (r.created_at as string) ?? 0).getTime()
  const wegIsNieuwer = tijd(weg) > tijd(houd)

  const update: Record<string, unknown> = {}

  // Per product het sterkste antwoord
  for (const kolom of ["std_status", "inv_status"] as const) {
    if (!(kolom in houd)) continue
    const a = reis(houd[kolom])
    const b = reis(weg[kolom])
    const kies = RANG[b] > RANG[a] || (RANG[b] === 2 && RANG[a] === 2 && wegIsNieuwer) ? b : a
    if (kies !== a) update[kolom] = kies
  }

  // Aanwezig volgt uit het antwoord dat er nu staat
  const komt = komtGast(reis(update.std_status ?? houd.std_status), reis(update.inv_status ?? houd.inv_status))
  if (komt !== null) update.attending = komt ? "yes" : "no"

  // Lege velden aanvullen
  for (const [k, v] of Object.entries(weg)) {
    if (NIET_AANVULLEN.has(k) || !(k in houd)) continue
    if (leeg(houd[k]) && !leeg(v)) update[k] = v
  }

  if (Object.keys(update).length > 0) {
    const { error } = await service.from("rsvp").update(update).eq("id", houdId)
    if (error) {
      console.error("[samenvoegen] bijwerken:", error)
      return Response.json({ error: "Samenvoegen mislukte" }, { status: 500 })
    }
  }

  const { error: wegFout } = await service.from("rsvp").delete().eq("id", wegId)
  if (wegFout) {
    console.error("[samenvoegen] verwijderen:", wegFout)
    return Response.json({ error: "Samenvoegen is half gelukt; ververs de pagina." }, { status: 500 })
  }

  return Response.json({ success: true, gast: { ...houd, ...update } })
}
