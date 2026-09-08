import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET: alle foto's van een eigen event, inclusief de wachtrij — gebruikt door
// het dashboard om de fotomuur-sectie live te verversen (polling).
export async function GET(request: Request) {
  const eventId = new URL(request.url).searchParams.get("event_id")
  if (!eventId) {
    return Response.json({ error: "event_id is verplicht" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const service = createServiceClient()

  const { data: event } = await service
    .from("events")
    .select("id, user_email")
    .eq("id", eventId)
    .single()

  if (!event) return Response.json({ error: "Niet gevonden" }, { status: 404 })
  if (event.user_email !== user.email) {
    return Response.json({ error: "Geen toegang" }, { status: 403 })
  }

  const { data: photos, error } = await service
    .from("guest_photos")
    .select("id, event_id, name, caption, url, status, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[guest-photos/moderation]", error.message)
    return Response.json({ error: "Kon foto's niet ophalen" }, { status: 500 })
  }

  return Response.json({ photos: photos ?? [] })
}
