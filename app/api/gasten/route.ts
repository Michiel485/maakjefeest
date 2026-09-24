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

  // Regels met dezelfde huishoudnaam horen bij elkaar. Zo kun je een gezin
  // invoeren zonder een apart scherm voor huishoudens: je typt dezelfde naam.
  const huishoudens = new Map<string, string>()
  function huishoudenVan(naam: string | null): string {
    if (!naam) return crypto.randomUUID()
    const sleutel = naam.toLowerCase().trim()
    let id = huishoudens.get(sleutel)
    if (!id) {
      id = crypto.randomUUID()
      huishoudens.set(sleutel, id)
    }
    return id
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
    huishouden_id: huishoudenVan(tekst(g.huishouden_naam, MAX_NAAM * 2)),
    // Met de hand toegevoegd betekent: je hebt nog niets verstuurd en dus ook
    // nog niets gehoord. Eerder stond attending hier op "yes", waardoor zo
    // iemand meteen als aanwezig in de lijst kwam. Dat was een fout.
    //
    // "maybe" staat voor nog geen antwoord. Leeg zou netter lezen, maar de
    // kolom attending is NOT NULL en dat omzetten kost een migratie die we
    // niet nodig hebben: sinds de twee reiskolommen is attending niet meer de
    // waarheid, alleen nog een samenvatting van het laatste antwoord.
    status: "uitgenodigd",
    std_status: "niet_verstuurd",
    inv_status: "niet_verstuurd",
    attending: "maybe",
    is_primary: true,
  }))

  const { data: nieuw, error } = await service.from("rsvp").insert(rows).select("id")

  if (error) {
    console.error("[gasten] insert:", error)
    return Response.json({ error: "Toevoegen mislukt" }, { status: 500 })
  }

  return Response.json({ success: true, toegevoegd: nieuw?.length ?? 0 }, { status: 201 })
}

// PATCH: van een groep gasten de reis bijwerken.
//
// Delen gaat via WhatsApp en dat kunnen wij niet zien, dus "verstuurd" zet het
// bruidspaar zelf. Meestal voor veertig mensen tegelijk, vandaar dat dit op een
// selectie werkt en niet per regel.
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as
    | { ids?: unknown; product?: unknown; waarde?: unknown; kaart_id?: unknown }
    | null

  const ids = Array.isArray(body?.ids) ? body.ids.filter((v): v is string => typeof v === "string") : []
  const product = body?.product === "inv" ? "inv" : "std"
  const waarde = body?.waarde
  const geldig = ["niet_verstuurd", "verstuurd", "ja", "nee"]

  if (ids.length === 0) return Response.json({ error: "Selecteer eerst een paar gasten." }, { status: 400 })
  if (ids.length > 500) return Response.json({ error: "Maximaal 500 per keer." }, { status: 400 })
  if (typeof waarde !== "string" || !geldig.includes(waarde)) {
    return Response.json({ error: "Onbekende stand" }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: gasten } = await service.from("rsvp").select("id, event_id, std_status, inv_status").in("id", ids)
  if (!gasten || gasten.length === 0) {
    return Response.json({ error: "Deze gasten bestaan niet meer." }, { status: 404 })
  }

  // Alleen bruiloften van deze klant, zoals bij het berichtendpoint
  const { data: events } = await service
    .from("events")
    .select("id, user_email")
    .in("id", [...new Set(gasten.map((g) => g.event_id as string))])

  const vanMij = new Set(
    (events ?? []).filter((e) => e.user_email === user.email).map((e) => e.id as string)
  )
  const kolom = product === "inv" ? "inv_status" : "std_status"
  const vanDeze = gasten.filter((g) => vanMij.has(g.event_id as string))
  if (vanDeze.length === 0) return Response.json({ error: "Geen toegang" }, { status: 403 })

  // Wie al ja of nee zei, zet "verstuurd" of "niet verstuurd" niet terug.
  // Dat gebeurde wel: iedereen aanvinken en op "Save the Date verstuurd"
  // drukken wiste de antwoorden van wie al gereageerd had (Michiels
  // bevinding van 24 september 2026). Een antwoord verandert alleen als de
  // gast zelf opnieuw antwoordt, of als jij bewust komt of komt niet kiest.
  const terugzetten = waarde === "verstuurd" || waarde === "niet_verstuurd"
  const gereageerd = (g: (typeof vanDeze)[number]) => {
    const w = g[kolom] as string | null
    return w === "ja" || w === "nee"
  }
  const mag = vanDeze.filter((g) => !(terugzetten && gereageerd(g))).map((g) => g.id as string)
  const overgeslagen = vanDeze.length - mag.length
  if (mag.length === 0) {
    return Response.json({ success: true, bijgewerkt: 0, ids: [], overgeslagen })
  }

  // bijgewerkt_at zet de database zelf, via een trigger. Zie app/api/rsvp.
  const update: Record<string, unknown> = { [kolom]: waarde }
  // Een antwoord is ook een antwoord op de aanwezigheid; de cateraarslijst
  // rekent daarmee.
  if (waarde === "ja" || waarde === "nee") update.attending = waarde === "ja" ? "yes" : "no"

  // Welke kaart je stuurde, als er van een soort meer dan één is. Alleen een
  // kaart van een van deze bruiloften, anders zou je een vreemde kaart aan je
  // gasten kunnen hangen.
  const kaartKolom = product === "inv" ? "inv_kaart_id" : "std_kaart_id"
  if (typeof body?.kaart_id === "string" && body.kaart_id) {
    const { data: k } = await service
      .from("cards")
      .select("id, event_id")
      .eq("id", body.kaart_id)
      .single()
    if (k && vanMij.has(k.event_id as string)) update[kaartKolom] = k.id
  }

  let { error } = await service.from("rsvp").update(update).in("id", mag)
  // De kaartkolommen bestaan pas na migration_gekregen.sql. Mist die nog, dan
  // mag dat het verstuurd zetten niet kosten: dan zonder de kaart.
  if (error && kaartKolom in update) {
    delete update[kaartKolom]
    const opnieuw = await service.from("rsvp").update(update).in("id", mag)
    if (!opnieuw.error) console.warn("[gasten] bijgewerkt zonder", kaartKolom, "- migratie nog niet gedraaid?")
    error = opnieuw.error
  }
  if (error) {
    console.error("[gasten] patch:", error)
    return Response.json({ error: "Bijwerken mislukt" }, { status: 500 })
  }

  return Response.json({ success: true, bijgewerkt: mag.length, ids: mag, overgeslagen })
}
