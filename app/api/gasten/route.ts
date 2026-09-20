import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import {
  volledigeNaam,
  MAX_EMAIL,
  MAX_GASTEN_PER_EVENT,
  MAX_KIND_LEEFTIJD,
  MAX_NAAM,
  MAX_TELEFOON,
} from "@/lib/gasten"

export const dynamic = "force-dynamic"

// POST: gasten met de hand aan de lijst toevoegen.
//
// De andere weg is dat een gast zichzelf invult via een kaart; die loopt via
// /api/rsvp. Deze is voor het bruidspaar dat zijn lijst zelf opbouwt, of een
// lijst plakt uit een sheet. Wat hier binnenkomt heeft nog niet gereageerd, dus
// de stand is "uitgenodigd".

interface NieuweGast {
  voornaam?: string
  achternaam?: string
  email?: string
  telefoon?: string
  guest_type?: string
  is_kind?: boolean
  leeftijd?: number | null
  huishouden_naam?: string
}

function tekst(waarde: unknown, max: number): string | null {
  if (typeof waarde !== "string") return null
  const v = waarde.trim()
  return v ? v.slice(0, max) : null
}

const GROEPEN = ["daggast", "avondgast", "receptiegast"]

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as
    | { event_id?: unknown; gasten?: unknown }
    | null

  const event_id = tekst(body?.event_id, 64)
  const gasten = Array.isArray(body?.gasten) ? (body.gasten as NieuweGast[]) : []

  if (!event_id) return Response.json({ error: "event_id is verplicht" }, { status: 400 })
  if (gasten.length === 0) return Response.json({ error: "Vul minstens één naam in." }, { status: 400 })

  const service = createServiceClient()
  const { data: event } = await service
    .from("events")
    .select("id, user_email")
    .eq("id", event_id)
    .single()

  if (!event) return Response.json({ error: "Bruiloft niet gevonden" }, { status: 404 })
  if (event.user_email !== user.email) return Response.json({ error: "Geen toegang" }, { status: 403 })

  // Namen eerst, zodat we niet half invoeren en dan pas klagen
  const schoon: { voornaam: string; achternaam: string | null; g: NieuweGast }[] = []
  for (const g of gasten) {
    const voornaam = tekst(g.voornaam, MAX_NAAM)
    if (!voornaam) continue
    schoon.push({ voornaam, achternaam: tekst(g.achternaam, MAX_NAAM), g })
  }
  if (schoon.length === 0) {
    return Response.json({ error: "Geen bruikbare namen gevonden." }, { status: 400 })
  }

  const { count } = await service
    .from("rsvp")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event_id)

  if ((count ?? 0) + schoon.length > MAX_GASTEN_PER_EVENT) {
    return Response.json(
      { error: `Er passen maximaal ${MAX_GASTEN_PER_EVENT} gasten in een lijst. Je hebt er nu ${count ?? 0}.` },
      { status: 400 }
    )
  }

  const rows = schoon.map(({ voornaam, achternaam, g }) => ({
    event_id,
    submission_id: crypto.randomUUID(),
    name: volledigeNaam(voornaam, achternaam),
    voornaam,
    achternaam,
    email: tekst(g.email, MAX_EMAIL),
    telefoon: tekst(g.telefoon, MAX_TELEFOON),
    guest_type: GROEPEN.includes(g.guest_type ?? "") ? g.guest_type : "daggast",
    is_kind: g.is_kind === true,
    leeftijd:
      g.is_kind === true && typeof g.leeftijd === "number" && g.leeftijd >= 0 && g.leeftijd <= MAX_KIND_LEEFTIJD
        ? Math.round(g.leeftijd)
        : null,
    huishouden_naam: tekst(g.huishouden_naam, MAX_NAAM * 2),
    // Met de hand toegevoegd betekent: uitgenodigd, nog niets gehoord. De
    // aanwezigheid blijft leeg tot de gast zelf reageert.
    status: "uitgenodigd",
    attending: "yes",
    is_primary: true,
  }))

  const { data: nieuw, error } = await service.from("rsvp").insert(rows).select("id")

  if (error) {
    console.error("[gasten] insert:", error)
    return Response.json({ error: "Toevoegen mislukt" }, { status: 500 })
  }

  return Response.json({ success: true, toegevoegd: nieuw?.length ?? 0 }, { status: 201 })
}
