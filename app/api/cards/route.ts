import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { generateShareToken, type CardGuestType, type CardTemplate, type CardType } from "@/lib/cards"

const CARD_TYPES: CardType[] = ["save_the_date", "trouwkaart"]
const CARD_TEMPLATES: CardTemplate[] = ["klassiek", "foto"]
const GUEST_TYPES: CardGuestType[] = ["daggast", "avondgast", "receptiegast"]

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
  const photoUrl =
    chosenTemplate === "foto" && typeof photo_url === "string" && /^https?:\/\//.test(photo_url)
      ? photo_url.slice(0, 500)
      : undefined

  const service = createServiceClient()

  const { data: event } = await service
    .from("events")
    .select("id, user_email")
    .eq("id", event_id)
    .single()

  if (!event) return Response.json({ error: "Website niet gevonden" }, { status: 404 })
  if (event.user_email !== user.email) return Response.json({ error: "Geen toegang" }, { status: 403 })

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
