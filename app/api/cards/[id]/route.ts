import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import type { CardContent, CardTemplate } from "@/lib/cards"

const CARD_TEMPLATES: CardTemplate[] = ["klassiek", "foto"]
const MAX_FIELD = 120
const MAX_MESSAGE = 400

async function verifyOwnership(cardId: string, userEmail: string): Promise<boolean> {
  const service = createServiceClient()
  const { data: card } = await service.from("cards").select("event_id").eq("id", cardId).single()
  if (!card) return false
  const { data: event } = await service.from("events").select("user_email").eq("id", card.event_id).single()
  return !!event && event.user_email === userEmail
}

function sanitizeContent(raw: unknown): CardContent {
  const input = (raw ?? {}) as Record<string, unknown>
  const text = (value: unknown, max: number) =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined
  return {
    names: text(input.names, MAX_FIELD),
    dateText: text(input.dateText, MAX_FIELD),
    location: text(input.location, MAX_FIELD),
    message: text(input.message, MAX_MESSAGE),
    photoUrl: text(input.photoUrl, 500),
  }
}

// PATCH: kaartinhoud of template bijwerken
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })
  if (!(await verifyOwnership(id, user.email))) {
    return Response.json({ error: "Geen toegang" }, { status: 403 })
  }

  let body: { content?: unknown; template?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige body" }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (body.content !== undefined) update.content = sanitizeContent(body.content)
  if (body.template !== undefined) {
    if (!CARD_TEMPLATES.includes(body.template as CardTemplate)) {
      return Response.json({ error: "Ongeldig template" }, { status: 400 })
    }
    update.template = body.template
  }
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Niets om bij te werken" }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.from("cards").update(update).eq("id", id)

  if (error) {
    console.error("[cards] update:", error.message)
    return Response.json({ error: "Opslaan mislukt" }, { status: 500 })
  }

  return Response.json({ success: true })
}

// DELETE: kaart verwijderen (de deel-link stopt dan met werken)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })
  if (!(await verifyOwnership(id, user.email))) {
    return Response.json({ error: "Geen toegang" }, { status: 403 })
  }

  const service = createServiceClient()
  const { error } = await service.from("cards").delete().eq("id", id)

  if (error) {
    console.error("[cards] delete:", error.message)
    return Response.json({ error: "Verwijderen mislukt" }, { status: 500 })
  }

  return Response.json({ success: true })
}
