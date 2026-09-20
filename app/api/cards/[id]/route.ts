import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { cardAnimatie, cardTaal, type CardContent, type CardGuestType, type CardTemplate, type CardType } from "@/lib/cards"
import { verversKaart } from "@/lib/db"

const CARD_TEMPLATES: CardTemplate[] = ["klassiek", "sierlijk", "bohemian", "foto"]
const CARD_TYPES: CardType[] = ["save_the_date", "trouwkaart"]
const GUEST_TYPES: CardGuestType[] = ["daggast", "avondgast", "receptiegast"]
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
    guestType: GUEST_TYPES.includes(input.guestType as CardGuestType)
      ? (input.guestType as CardGuestType)
      : undefined,
    inviteText: text(input.inviteText, 160),
    timeText: text(input.timeText, 80),
    animatie: cardAnimatie(input.animatie),
    taal: cardTaal(input.taal),
  }
}

// PATCH: kaartinhoud, ontwerp of soort kaart bijwerken
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

  let body: { content?: unknown; template?: string; type?: string }
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
  // Van Save the Date naar trouwkaart en terug mag: ontwerpen is gratis, het
  // pakket wordt pas bij het versturen gecontroleerd. Wie zich bedenkt hoeft
  // dus niet opnieuw te beginnen.
  if (body.type !== undefined) {
    if (!CARD_TYPES.includes(body.type as CardType)) {
      return Response.json({ error: "Ongeldig soort kaart" }, { status: 400 })
    }
    update.type = body.type
  }
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Niets om bij te werken" }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: bijgewerkt, error } = await service
    .from("cards")
    .update(update)
    .eq("id", id)
    .select("share_token")
    .single()

  if (error) {
    console.error("[cards] update:", error.message)
    return Response.json({ error: "Opslaan mislukt" }, { status: 500 })
  }

  // De kaartpagina is gecached; zonder dit zou het bruidspaar zijn eigen
  // wijziging een minuut lang niet terugzien op de deelbare link.
  await verversKaart(bijgewerkt?.share_token as string | null)

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
