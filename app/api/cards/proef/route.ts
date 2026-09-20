import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { sendProefkaartEmail } from "@/lib/mail"
import { buildCardDisplay } from "@/lib/cards"
import { MARKETING_URL } from "@/lib/site-url"
import { bezoekerIp, teVeelPogingen } from "@/lib/rem"

export const dynamic = "force-dynamic"

// POST: de kaart als proef naar het bruidspaar zelf mailen.
//
// Alleen naar het eigen mailadres van de ingelogde eigenaar. Bewust geen vrij
// in te vullen ontvanger: dan zou dit een manier zijn om via ons domein post
// naar willekeurige mensen te sturen.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  if (teVeelPogingen("proefkaart", bezoekerIp(request), 5)) {
    return Response.json(
      { error: "Je hebt er net al een paar gestuurd. Wacht even en probeer het opnieuw." },
      { status: 429 }
    )
  }

  const body = (await request.json().catch(() => null)) as { card_id?: unknown } | null
  if (!body || typeof body.card_id !== "string") {
    return Response.json({ error: "card_id is verplicht" }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: card } = await service
    .from("cards")
    .select("id, event_id, type, template, share_token, content")
    .eq("id", body.card_id)
    .single()

  if (!card) return Response.json({ error: "Kaart niet gevonden" }, { status: 404 })

  const { data: event } = await service
    .from("events")
    .select("title, frame_names, datum, locatie, hero_image_url, user_email")
    .eq("id", card.event_id)
    .single()

  if (!event) return Response.json({ error: "Kaart niet gevonden" }, { status: 404 })
  if (event.user_email !== user.email) {
    return Response.json({ error: "Geen toegang" }, { status: 403 })
  }

  const display = buildCardDisplay(card.type, card.template, card.content, event)

  const result = await sendProefkaartEmail({
    toEmail:       user.email,
    namen:         display.names,
    // De voorbeeldweergave, niet de publieke link: die laat een nog niet
    // verstuurde kaart namelijk dicht, ook voor het bruidspaar zelf.
    kaartUrl:      `${MARKETING_URL}/kaart/${card.share_token}/voorbeeld`,
    afbeeldingUrl: `${MARKETING_URL}/kaart/${card.share_token}/opengraph-image`,
    isTrouwkaart:  card.type === "trouwkaart",
  })

  if (!result.success) {
    return Response.json({ error: "Versturen mislukt, probeer het zo opnieuw." }, { status: 502 })
  }

  return Response.json({ success: true, naar: user.email })
}
