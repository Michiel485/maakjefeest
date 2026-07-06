import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { generateShareToken, type CardTemplate, type CardType } from "@/lib/cards"

const CARD_TYPES: CardType[] = ["save_the_date", "trouwkaart"]
const CARD_TEMPLATES: CardTemplate[] = ["klassiek", "foto"]

// POST: nieuwe kaart aanmaken voor een eigen event
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  let body: { event_id?: string; type?: string; template?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige body" }, { status: 400 })
  }

  const { event_id, type, template } = body
  if (!event_id || !CARD_TYPES.includes(type as CardType)) {
    return Response.json({ error: "event_id en geldig type zijn verplicht" }, { status: 400 })
  }
  const chosenTemplate = CARD_TEMPLATES.includes(template as CardTemplate)
    ? (template as CardTemplate)
    : "klassiek"

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
      content: {},
    })
    .select("id, event_id, type, template, share_token, content, view_count, created_at")
    .single()

  if (error || !card) {
    console.error("[cards] insert:", error?.message)
    return Response.json({ error: "Kaart aanmaken mislukt" }, { status: 500 })
  }

  return Response.json({ card }, { status: 201 })
}
