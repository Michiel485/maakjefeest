import { createServiceClient } from "@/lib/supabase"
import { sendRSVPConfirmation, sendAdminRSVPNotification } from "@/lib/mail"

interface GuestInput {
  name: string
  email?: string
  guest_type?: string
  dietary?: string
  is_primary: boolean
  attending?: string
  message?: string
  song?: string
  overnachting?: boolean
  custom_answer?: boolean
  custom_answer_2?: boolean
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
    .select("id, title, user_id")
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
    attending: g.attending ?? "yes",
    is_primary: g.is_primary,
    guest_type: g.guest_type ?? "daggast",
    dietary: g.dietary || null,
    message: g.message || null,
    song: g.song || null,
    overnachting: g.overnachting ?? null,
    custom_answer: g.custom_answer ?? null,
    custom_answer_2: g.custom_answer_2 ?? null,
  }))

  const { error } = await supabase.from("rsvp").insert(rows)

  if (error) {
    console.error("RSVP insert error:", error)
    return Response.json({ error: "Kon aanmelding niet opslaan" }, { status: 500 })
  }

  const ev          = event as { id: string; title?: string; user_id?: string }
  const eventTitle  = ev.title ?? "het evenement"
  const guestPayload = rows.map((r) => ({
    name:         r.name,
    attending:    r.attending,
    guest_type:   r.guest_type,
    dietary:      r.dietary,
    song:         r.song,
    overnachting: r.overnachting,
    message:      r.message,
  }))

  const primaryGuest = guests.find((g) => g.is_primary) ?? guests[0]

  // Confirmation mail to the guest
  if (primaryGuest.email) {
    await sendRSVPConfirmation({
      toEmail:     primaryGuest.email,
      primaryName: primaryGuest.name,
      eventTitle,
      guests:      guestPayload,
    })
  }

  // Notification mail to the event owner
  if (ev.user_id) {
    const { data: adminUser } = await supabase.auth.admin.getUserById(ev.user_id)
    const adminEmail = adminUser?.user?.email
    if (adminEmail) {
      await sendAdminRSVPNotification({
        toEmail:     adminEmail,
        eventTitle,
        primaryName: primaryGuest.name,
        guests:      guestPayload,
      })
    }
  }

  return Response.json({ success: true, count: guests.length }, { status: 201 })
}
