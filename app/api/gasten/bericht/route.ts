import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { sendGastBerichtEmail } from "@/lib/mail"
import { eventSiteUrl, MARKETING_URL } from "@/lib/site-url"
import { bezoekerIp, teVeelPogingen } from "@/lib/rem"

export const dynamic = "force-dynamic"

// POST: een bericht naar de aangevinkte gasten.
//
// Twee soorten. Een herinnering vraagt iemand alsnog te reageren; een
// wijziging laat weten dat er iets veranderd is en zegt er juist bij dat de
// aanmelding blijft staan.
//
// Het bruidspaar drukt op de knop, wij versturen nooit uit onszelf iets naar
// een gast. Alleen naar gasten van een eigen bruiloft, en alleen naar wie een
// mailadres achterliet; voor de rest krijgt het bruidspaar de tekst om zelf
// via WhatsApp te sturen.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  // Een mailknop is een aardige manier om per ongeluk honderd mails te sturen,
  // dus ook hier een rem.
  if (teVeelPogingen("gastbericht", bezoekerIp(request), 5)) {
    return Response.json(
      { error: "Je hebt er net al een paar verstuurd. Wacht even en probeer het opnieuw." },
      { status: 429 }
    )
  }

  const body = (await request.json().catch(() => null)) as
    | { ids?: unknown; soort?: unknown; bericht?: unknown }
    | null

  const ids = Array.isArray(body?.ids) ? body.ids.filter((v): v is string => typeof v === "string") : []
  const soort = body?.soort === "wijziging" ? "wijziging" : "herinnering"
  const bericht = typeof body?.bericht === "string" ? body.bericht.trim().slice(0, 1000) : ""

  if (ids.length === 0) return Response.json({ error: "Selecteer eerst een paar gasten." }, { status: 400 })
  if (ids.length > 200) return Response.json({ error: "Maximaal 200 gasten per keer." }, { status: 400 })
  if (!bericht) return Response.json({ error: "Schrijf even een kort berichtje." }, { status: 400 })

  const service = createServiceClient()
  const { data: gasten } = await service
    .from("rsvp")
    .select("id, name, email, event_id, bron_token")
    .in("id", ids)

  if (!gasten || gasten.length === 0) {
    return Response.json({ error: "Deze gasten bestaan niet meer." }, { status: 404 })
  }

  // Alleen bruiloften van deze klant. Zonder deze controle zou iemand met een
  // willekeurig id post kunnen sturen namens een ander bruidspaar.
  const eventIds = [...new Set(gasten.map((g) => g.event_id as string))]
  const { data: events } = await service
    .from("events")
    .select("id, title, slug, user_email")
    .in("id", eventIds)

  const vanMij = new Map(
    (events ?? [])
      .filter((e) => e.user_email === user.email)
      .map((e) => [e.id as string, e as { id: string; title: string; slug: string }])
  )
  if (vanMij.size === 0) return Response.json({ error: "Geen toegang" }, { status: 403 })

  let verstuurd = 0
  const zonderMail: string[] = []

  for (const g of gasten) {
    const event = vanMij.get(g.event_id as string)
    if (!event) continue

    const email = g.email as string | null
    if (!email) {
      zonderMail.push(g.name as string)
      continue
    }

    // Precies de link die deze gast eerder kreeg: de kaart als hij daarvandaan
    // kwam, anders de trouwsite.
    const link = g.bron_token
      ? `${MARKETING_URL}/kaart/${g.bron_token}`
      : eventSiteUrl(event.slug)

    const r = await sendGastBerichtEmail({
      toEmail: email,
      gastNaam: (g.name as string).split(" ")[0] || (g.name as string),
      eventTitle: event.title,
      soort,
      bericht,
      link,
    })
    if (r.success) verstuurd++
  }

  return Response.json({ success: true, verstuurd, zonderMail })
}
