import { createServiceClient } from "@/lib/supabase"
import { sendRSVPConfirmation, sendAdminRSVPNotification } from "@/lib/mail"
import { planAllows } from "@/lib/plans"
import { bezoekerIp, teVeelPogingen } from "@/lib/rem"

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

// Grenzen op wat een gast mag insturen. Dit is de enige plek waar het publiek
// in onze database mag schrijven, dus hier hoort een hek. Er stond niets: een
// lege naam kwam er gewoon in, en een naam van tien megabyte ook.
const MAX_NAAM     = 120
const MAX_EMAIL    = 160
const MAX_KORT     = 120
const MAX_BERICHT  = 1000
const MAX_GASTEN   = 20   // een formulier stuurt er hoogstens een handvol

/** Tekst afkappen en leegte als null teruggeven. */
function tekst(waarde: unknown, max: number): string | null {
  if (typeof waarde !== "string") return null
  const v = waarde.trim()
  return v ? v.slice(0, max) : null
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

  if (guests.length > MAX_GASTEN) {
    return Response.json(
      { error: `Je kunt maximaal ${MAX_GASTEN} personen per keer aanmelden.` },
      { status: 400 }
    )
  }

  // Een rem tegen iemand die de gastenlijst van een bruidspaar volspamt. Voor
  // de controles hieronder, zodat een script geen gratis hulp krijgt.
  if (teVeelPogingen("rsvp", bezoekerIp(request), 10)) {
    return Response.json(
      { error: "Te veel aanmeldingen achter elkaar. Wacht even en probeer het opnieuw." },
      { status: 429 }
    )
  }

  // Een naam is het enige dat het bruidspaar echt nodig heeft. Zonder deze
  // controle belandde er een naamloze regel in hun gastenlijst.
  const schoon: (GuestInput & { name: string })[] = []
  for (const g of guests) {
    const naam = tekst(g.name, MAX_NAAM)
    if (!naam) return Response.json({ error: "Vul van iedereen de naam in." }, { status: 400 })
    schoon.push({ ...g, name: naam })
  }

  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, title, user_email, plan")
    .eq("id", event_id)
    .eq("status", "published")
    .single()

  if (!event) {
    return Response.json({ error: "Event niet gevonden of niet gepubliceerd" }, { status: 404 })
  }

  // RSVP hoort bij het pakket Uitnodiging & RSVP of hoger. Zonder deze controle
  // zouden er aanmeldingen binnenkomen die het bruidspaar niet kan zien.
  if (!planAllows(event.plan, "rsvp")) {
    return Response.json({ error: "Aanmelden is niet beschikbaar voor dit event" }, { status: 404 })
  }

  const submission_id = crypto.randomUUID()

  const rows = schoon.map((g) => ({
    event_id,
    submission_id,
    name: g.name,
    email: tekst(g.email, MAX_EMAIL),
    attending: tekst(g.attending, 20) ?? "yes",
    is_primary: g.is_primary,
    guest_type: tekst(g.guest_type, 40) ?? "daggast",
    dietary: tekst(g.dietary, MAX_KORT),
    message: tekst(g.message, MAX_BERICHT),
    // Only include optional extended columns when they have an actual value,
    // so missing DB columns don't cause an insert error.
    ...(g.song != null        ? { song: tekst(g.song, MAX_KORT) }    : {}),
    ...(g.overnachting != null ? { overnachting: g.overnachting }    : {}),
    ...(g.custom_answer != null ? { custom_answer: g.custom_answer } : {}),
    ...(g.custom_answer_2 != null ? { custom_answer_2: g.custom_answer_2 } : {}),
  }))

  let { error } = await supabase.from("rsvp").insert(rows)

  // If the full insert fails due to missing migration columns, fall back to base schema columns only.
  // This happens when the multi-guest migration hasn't been run in Supabase yet.
  if (error) {
    const isMissingColumn =
      error.code === "42703" ||
      (error.message ?? "").toLowerCase().includes("column") ||
      (error.message ?? "").toLowerCase().includes("does not exist") ||
      (error.message ?? "").toLowerCase().includes("could not find")

    if (isMissingColumn) {
      console.warn("RSVP: extended columns missing, falling back to base schema:", error.message)
      const baseRows = rows.map((r) => ({
        event_id: r.event_id,
        name: r.name,
        // Base schema may have email NOT NULL — use empty string as fallback
        email: r.email || "",
        attending: r.attending,
        message: r.message || null,
      }))
      const fallback = await supabase.from("rsvp").insert(baseRows)
      error = fallback.error
    }
  }

  if (error) {
    console.error("RSVP insert error:", error)
    return Response.json({ error: "Kon aanmelding niet opslaan", detail: error.message }, { status: 500 })
  }

  const ev          = event as { id: string; title?: string; user_email?: string }
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

  const primaryGuest = schoon.find((g) => g.is_primary) ?? schoon[0]

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
  if (ev.user_email) {
    await sendAdminRSVPNotification({
      toEmail:     ev.user_email,
      eventTitle,
      primaryName: primaryGuest.name,
      guests:      guestPayload,
    })
  }

  return Response.json({ success: true, count: schoon.length }, { status: 201 })
}
