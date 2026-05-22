import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"

async function verifyOwnership(rsvpId: string, userEmail: string): Promise<boolean> {
  const service = createServiceClient()
  const { data: rsvp } = await service.from("rsvp").select("event_id").eq("id", rsvpId).single()
  if (!rsvp) return false
  const { data: event } = await service.from("events").select("user_email").eq("id", rsvp.event_id).single()
  return !!event && event.user_email === userEmail
}

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

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: "Ongeldige body" }, { status: 400 }) }

  const service = createServiceClient()
  const { error } = await service
    .from("rsvp")
    .update({
      name: body.name,
      email: body.email || null,
      attending: body.attending,
      guest_type: body.guest_type,
      dietary: body.dietary || null,
      message: body.message || null,
      song: body.song || null,
      overnachting: body.overnachting ?? null,
      custom_answer: body.custom_answer ?? null,
      custom_answer_2: body.custom_answer_2 ?? null,
    })
    .eq("id", id)

  if (error) {
    console.error("RSVP update error:", error)
    return Response.json({ error: "Update mislukt" }, { status: 500 })
  }

  return Response.json({ success: true })
}

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
  const { error } = await service.from("rsvp").delete().eq("id", id)

  if (error) {
    console.error("RSVP delete error:", error)
    return Response.json({ error: "Verwijderen mislukt" }, { status: 500 })
  }

  return Response.json({ success: true })
}
