import { createServiceClient } from "@/lib/supabase"
import { sendRSVPConfirmation, sendAdminRSVPNotification } from "@/lib/mail"
import { planAllows } from "@/lib/plans"
import { bezoekerIp, teVeelPogingen } from "@/lib/rem"
import {
  gastSleutel,
  gastStatus,
  volledigeNaam,
  MAX_BERICHT,
  MAX_EMAIL,
  MAX_GASTEN_PER_EVENT,
  MAX_KIND_LEEFTIJD,
  MAX_KORT,
  MAX_NAAM,
  MAX_PERSONEN_PER_INZENDING,
  MAX_TELEFOON,
  type GastStatus,
} from "@/lib/gasten"

// Aanmelden. Eén endpoint voor de trouwsite en voor de kaart, want wat een
// gast invult moet op beide plekken hetzelfde zijn en in dezelfde lijst
// belanden. Twee bijna gelijke wegen lopen binnen een maand uit elkaar.
//
// Twee standen:
// - voorlopig: alleen of iemand komt, van een Save the Date. Een zachte
//   reservering, en daarom ook toegestaan bij een pakket zonder RSVP.
// - definitief: het hele formulier. Vraagt het pakket Uitnodiging & RSVP.

interface GuestInput {
  // De website stuurt nog name; de kaart stuurt voornaam en achternaam. Met
  // een achternaam erbij zijn twee gasten die allebei Sanne heten wel uit
  // elkaar te houden, en dat scheelt dubbele regels in de lijst.
  name?: string
  voornaam?: string
  achternaam?: string
  email?: string
  telefoon?: string
  guest_type?: string
  is_kind?: boolean
  leeftijd?: number | null
  dietary?: string
  allergie?: string
  is_primary: boolean
  attending?: string
  message?: string
  song?: string
  overnachting?: boolean | null
  custom_answer?: boolean
  custom_answer_2?: boolean
  antwoorden?: Record<string, string | boolean>
}

/** Tekst afkappen en leegte als null teruggeven. */
function tekst(waarde: unknown, max: number): string | null {
  if (typeof waarde !== "string") return null
  const v = waarde.trim()
  return v ? v.slice(0, max) : null
}

/** Leeftijd van een kind; buiten bereik telt als niet opgegeven. */
function leeftijd(waarde: unknown): number | null {
  if (typeof waarde !== "number" || !Number.isFinite(waarde)) return null
  const n = Math.round(waarde)
  return n >= 0 && n <= MAX_KIND_LEEFTIJD ? n : null
}

export async function POST(request: Request) {
  let body: {
    event_id?: string
    /** De kaartlink waarop dit is ingevuld. Daarmee weten we de bruiloft, de
     *  gastengroep en de taal, zonder dat de gast iets hoeft te kiezen. */
    bron_token?: string
    /** Onzichtbaar kenmerk uit de browser, om een tweede inzending van
     *  dezelfde persoon te herkennen. */
    apparaat?: string
    status?: string
    guests: GuestInput[]
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige JSON body" }, { status: 400 })
  }

  const { guests } = body
  if (!Array.isArray(guests) || guests.length === 0) {
    return Response.json({ error: "guests is verplicht" }, { status: 400 })
  }

  if (guests.length > MAX_PERSONEN_PER_INZENDING) {
    return Response.json(
      { error: `Je kunt maximaal ${MAX_PERSONEN_PER_INZENDING} personen per keer aanmelden.` },
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

  const supabase = createServiceClient()

  // ── Om welke bruiloft gaat dit? ───────────────────────────────────────────
  // Via de kaartlink als die is meegegeven, anders via het event_id dat de
  // trouwsite meestuurt.
  let event_id = tekst(body.event_id, 64)
  let groepUitKaart: string | null = null

  const bronToken = tekst(body.bron_token, 64)
  if (bronToken) {
    const { data: card } = await supabase
      .from("cards")
      .select("event_id, content")
      .eq("share_token", bronToken)
      .single()
    if (!card) return Response.json({ error: "Deze kaart bestaat niet" }, { status: 404 })
    event_id = card.event_id as string
    const inhoud = card.content as { guestType?: string } | null
    groepUitKaart = inhoud?.guestType ?? null
  }

  if (!event_id) {
    return Response.json({ error: "event_id of bron_token is verplicht" }, { status: 400 })
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title, user_email, plan")
    .eq("id", event_id)
    .eq("status", "published")
    .single()

  if (!event) {
    return Response.json({ error: "Event niet gevonden of niet gepubliceerd" }, { status: 404 })
  }

  // ── Mag dit? ──────────────────────────────────────────────────────────────
  // Een voorlopig ja of nee mag altijd: dat hoort bij de Save the Date en is
  // juist bedoeld om de gastenlijst te vullen. Het volledige formulier vraagt
  // het pakket Uitnodiging & RSVP, want anders komen er aanmeldingen binnen
  // die het bruidspaar niet kan zien.
  const status: GastStatus = gastStatus(body.status)
  if (status === "definitief" && !planAllows(event.plan, "rsvp")) {
    return Response.json({ error: "Aanmelden is niet beschikbaar voor dit event" }, { status: 404 })
  }

  // ── Namen ─────────────────────────────────────────────────────────────────
  const schoon: (GuestInput & { naam: string; voornaamSchoon: string })[] = []
  for (const g of guests) {
    const voornaam = tekst(g.voornaam, MAX_NAAM) ?? tekst(g.name, MAX_NAAM)
    if (!voornaam) return Response.json({ error: "Vul van iedereen de naam in." }, { status: 400 })
    const achternaam = tekst(g.achternaam, MAX_NAAM)
    schoon.push({
      ...g,
      voornaamSchoon: voornaam,
      naam: volledigeNaam(voornaam, achternaam).slice(0, MAX_NAAM * 2),
    })
  }

  // ── Past dit nog in de lijst? ─────────────────────────────────────────────
  const apparaat = tekst(body.apparaat, 64)
  const { count: aantalNu } = await supabase
    .from("rsvp")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event_id)

  // Wie zijn eigen antwoord bijwerkt telt niet als nieuwe gast, dus dat kijken
  // we hieronder pas na. Zonder apparaat is elke inzending nieuw.
  if (!apparaat && (aantalNu ?? 0) + schoon.length > MAX_GASTEN_PER_EVENT) {
    return Response.json(
      { error: "De gastenlijst van deze bruiloft zit vol." },
      { status: 400 }
    )
  }

  // ── Heeft dit toestel al eerder ingevuld? ─────────────────────────────────
  // Dan werken we dat antwoord bij in plaats van er een tweede naast te
  // zetten. Dat vangt verreweg de meest voorkomende dubbel af: "heb ik dit al
  // gedaan?" En de gast kan zich zo bedenken zonder ons te mailen.
  let vervangt = false
  if (apparaat) {
    const { data: eerder } = await supabase
      .from("rsvp")
      .select("id")
      .eq("event_id", event_id)
      .eq("apparaat", apparaat)
      .limit(1)
    vervangt = (eerder?.length ?? 0) > 0
    if (vervangt) {
      await supabase.from("rsvp").delete().eq("event_id", event_id).eq("apparaat", apparaat)
    } else if ((aantalNu ?? 0) + schoon.length > MAX_GASTEN_PER_EVENT) {
      return Response.json({ error: "De gastenlijst van deze bruiloft zit vol." }, { status: 400 })
    }
  }

  // ── Wegschrijven ──────────────────────────────────────────────────────────
  // Iedereen die samen instuurt hoort bij hetzelfde huishouden. Dat is precies
  // wat een gezin is: één keer invullen, meerdere mensen.
  const submission_id = crypto.randomUUID()
  const huishouden_id = crypto.randomUUID()
  const huishouden_naam = schoon[0]?.naam ?? null

  const rows = schoon.map((g) => ({
    event_id,
    submission_id,
    huishouden_id,
    huishouden_naam,
    name: g.naam,
    voornaam: g.voornaamSchoon,
    achternaam: tekst(g.achternaam, MAX_NAAM),
    email: tekst(g.email, MAX_EMAIL),
    telefoon: tekst(g.telefoon, MAX_TELEFOON),
    attending: tekst(g.attending, 20) ?? "yes",
    is_primary: g.is_primary,
    guest_type: tekst(g.guest_type, 40) ?? groepUitKaart ?? "daggast",
    is_kind: g.is_kind === true,
    leeftijd: g.is_kind === true ? leeftijd(g.leeftijd) : null,
    dietary: tekst(g.dietary, MAX_KORT),
    allergie: tekst(g.allergie, MAX_KORT),
    message: tekst(g.message, MAX_BERICHT),
    status,
    // Een gast die via een kaart reageert heeft die kaart per definitie
    // gekregen, dus de reis van dat product springt meteen naar ja of nee.
    ...(status === "voorlopig"
      ? { std_status: g.attending === "no" ? "nee" : "ja" }
      : { inv_status: g.attending === "no" ? "nee" : "ja", std_status: "verstuurd" }),
    bron_token: bronToken,
    apparaat,
    ...(g.song != null ? { song: tekst(g.song, MAX_KORT) } : {}),
    ...(g.overnachting != null ? { overnachting: g.overnachting } : {}),
    ...(g.custom_answer != null ? { custom_answer: g.custom_answer } : {}),
    ...(g.custom_answer_2 != null ? { custom_answer_2: g.custom_answer_2 } : {}),
    ...(g.antwoorden ? { antwoorden: g.antwoorden } : {}),
  }))

  const { error } = await supabase.from("rsvp").insert(rows)

  if (error) {
    console.error("[rsvp] insert:", error)
    return Response.json({ error: "Kon aanmelding niet opslaan" }, { status: 500 })
  }

  // ── Mails ─────────────────────────────────────────────────────────────────
  // Alleen bij een volledige aanmelding. Een voorlopig ja op een Save the Date
  // is geen moment voor een bevestigingsmail met dieetwensen erin, en het
  // bruidspaar wil daar geen mail per gast van.
  if (status === "definitief") {
    const eventTitle = (event.title as string) ?? "het evenement"
    const guestPayload = rows.map((r) => ({
      name: r.name,
      attending: r.attending,
      guest_type: r.guest_type,
      dietary: r.dietary,
      song: (r as { song?: string | null }).song ?? null,
      overnachting: (r as { overnachting?: boolean | null }).overnachting ?? null,
      message: r.message,
    }))
    const hoofdgast = schoon.find((g) => g.is_primary) ?? schoon[0]
    const hoofdEmail = tekst(hoofdgast.email, MAX_EMAIL)

    if (hoofdEmail) {
      await sendRSVPConfirmation({
        toEmail: hoofdEmail,
        primaryName: hoofdgast.naam,
        eventTitle,
        guests: guestPayload,
      })
    }
    if (event.user_email) {
      await sendAdminRSVPNotification({
        toEmail: event.user_email as string,
        eventTitle,
        primaryName: hoofdgast.naam,
        guests: guestPayload,
      })
    }
  }

  return Response.json(
    { success: true, count: schoon.length, bijgewerkt: vervangt, sleutel: gastSleutel(schoon[0].voornaamSchoon, schoon[0].achternaam) },
    { status: 201 }
  )
}
