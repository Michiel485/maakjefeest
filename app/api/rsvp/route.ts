import { createServiceClient } from "@/lib/supabase"

interface GuestInput {
  name: string
  email?: string
  guest_type: "daggast" | "avondgast"
  dietary?: string
  is_primary: boolean
}

export async function POST(request: Request) {
  let body: { event_id: string; guests: GuestInput[] }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige JSON body" }, { status: 400 })
  }

  const { event_id, guests } = body

  if (!event_id || !Array.isArray(guests) || guests.length === 0) {
    return Response.json({ error: "event_id en guests zijn verplicht" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", event_id)
    .eq("status", "published")
    .single()

  if (!event) {
    return Response.json({ error: "Event niet gevonden of niet gepubliceerd" }, { status: 404 })
  }

  const submission_id = crypto.randomUUID()

  const rows = guests.map((g) => ({
    event_id,
    submission_id,
    name: g.name,
    email: g.email || null,
    attending: "yes",
    is_primary: g.is_primary,
    guest_type: g.guest_type,
    dietary: g.dietary || null,
  }))

  const { error } = await supabase.from("rsvp").insert(rows)

  if (error) {
    console.error("RSVP insert error:", error)
    return Response.json({ error: "Kon aanmelding niet opslaan" }, { status: 500 })
  }

  return Response.json({ success: true, count: guests.length }, { status: 201 })
}
