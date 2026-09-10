import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { generateShareToken, type CardGuestType, type CardTemplate, type CardType } from "@/lib/cards"
import { planAllows } from "@/lib/plans"

const CARD_TYPES: CardType[] = ["save_the_date", "trouwkaart"]
const CARD_TEMPLATES: CardTemplate[] = ["klassiek", "sierlijk", "bohemian", "foto"]
const GUEST_TYPES: CardGuestType[] = ["daggast", "avondgast", "receptiegast"]

// GET /api/cards?event_id=...: kaarten van een eigen event (voor de kaartbouwer)
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const eventId = new URL(request.url).searchParams.get("event_id")
  if (!eventId) return Response.json({ error: "event_id is verplicht" }, { status: 400 })

  const service = createServiceClient()
  const { data: event } = await service.from("events").select("id, user_email").eq("id", eventId).single()
  if (!event) return Response.json({ error: "Niet gevonden" }, { status: 404 })
  if (event.user_email !== user.email) return Response.json({ error: "Geen toegang" }, { status: 403 })

  const { data: cards } = await service
    .from("cards")
    .select("id, event_id, type, template, share_token, content, view_count, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })

  return Response.json({ cards: cards ?? [] })
}

// POST: nieuwe kaart aanmaken voor een eigen event
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  let body: {
    event_id?: string
    type?: string
    template?: string
    guest_type?: string
    photo_url?: string
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige body" }, { status: 400 })
  }

  const { event_id, type, template, guest_type, photo_url } = body
  if (!event_id || !CARD_TYPES.includes(type as CardType)) {
    return Response.json({ error: "event_id en geldig type zijn verplicht" }, { status: 400 })
  }
  const chosenTemplate = CARD_TEMPLATES.includes(template as CardTemplate)
    ? (template as CardTemplate)
    : "klassiek"
  // Gasttype geldt alleen voor trouwkaarten
  const guestType =
    type === "trouwkaart" && GUEST_TYPES.includes(guest_type as CardGuestType)
      ? (guest_type as CardGuestType)
      : undefined
  // Een foto hoort bij de kaart zodra er één gekozen is, los van het ontwerp
  const photoUrl =
    typeof photo_url === "string" && /^https?:\/\//.test(photo_url)
      ? photo_url.slice(0, 500)
      : undefined

  const service = createServiceClient()

  const { data: event } = await service
    .from("events")
    .select("id, user_email, plan")
    .eq("id", event_id)
    .single()

  if (!event) return Response.json({ error: "Website niet gevonden" }, { status: 404 })
  if (event.user_email !== user.email) return Response.json({ error: "Geen toegang" }, { status: 403 })

  // Trouwkaarten horen bij het pakket Uitnodiging & RSVP of hoger
  if (type === "trouwkaart" && !planAllows(event.plan, "trouwkaart_cards")) {
    return Response.json(
      { error: "Trouwkaarten zitten in het pakket Uitnodiging & RSVP. Upgrade via je dashboard om ze te maken." },
      { status: 403 }
    )
  }

  const { data: card, error } = await service
    .from("cards")
    .insert({
      event_id,
      type,
      template: chosenTemplate,
      share_token: generateShareToken(),
      content: {
        ...(guestType ? { guestType } : {}),
        ...(photoUrl ? { photoUrl } : {}),
      },
    })
    .select("id, event_id, type, template, share_token, content, view_count, created_at")
    .single()

  if (error || !card) {
    console.error("[cards] insert:", error?.message)
    return Response.json({ error: "Kaart aanmaken mislukt" }, { status: 500 })
  }

  return Response.json({ card }, { status: 201 })
}
