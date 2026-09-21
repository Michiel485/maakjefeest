import { createServiceClient } from "@/lib/supabase"
import { sendRSVPConfirmation, sendAdminRSVPNotification } from "@/lib/mail"
import { planAllows } from "@/lib/plans"
import { bezoekerIp, teVeelPogingen } from "@/lib/rem"
import {
  gastSleutel,
  gastStatus,
  heeftGereageerd,
  reis,
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

/** Een regel die al in de lijst staat, met alleen wat we nodig hebben. */
interface BestaandeRij {
  id: string
  voornaam: string | null
  achternaam: string | null
  name: string | null
  huishouden_id: string | null
  huishouden_naam: string | null
  std_status: string | null
  inv_status: string | null
  apparaat: string | null
  bron_token: string | null
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

  // ── Wat staat er al in de lijst? ──────────────────────────────────────────
  // Deze gast kan er al in staan: het bruidspaar heeft hem zelf ingetypt, of
  // hij heeft eerder op dit toestel geantwoord. In beide gevallen horen we
  // zijn regel bij te werken en er geen tweede naast te zetten. Anders maakt
  // de belofte "je gastenlijst vult zich vanzelf" er juist een lijst met
  // dubbelingen van, en dat is precies het werk dat wij zouden schelen.
  const apparaat = tekst(body.apparaat, 64)

  const { data: bestaand } = await supabase
    .from("rsvp")
    .select(
      "id, voornaam, achternaam, name, huishouden_id, huishouden_naam, std_status, inv_status, apparaat, bron_token"
    )
    .eq("event_id", event_id)

  const kolom = status === "voorlopig" ? "std_status" : "inv_status"

  const opSleutel = new Map<string, BestaandeRij>()
  for (const r of (bestaand ?? []) as BestaandeRij[]) {
    const sleutel = gastSleutel(r.voornaam ?? r.name ?? "", r.achternaam)
    if (!sleutel || opSleutel.has(sleutel)) continue
    // Hetzelfde toestel mag zijn eigen antwoord altijd corrigeren. Een regel
    // die het bruidspaar zelf intypte en waar nog geen antwoord op staat is
    // precies de regel die deze gast hoort te vullen. Een regel waarop al
    // iemand anders geantwoord heeft laten we met rust.
    const magBij = (apparaat && r.apparaat === apparaat) || !heeftGereageerd(reis(r[kolom]))
    if (magBij) opSleutel.set(sleutel, r)
  }

  const paren = schoon.map((g) => {
    const sleutel = gastSleutel(g.voornaamSchoon, g.achternaam)
    const rij = sleutel ? opSleutel.get(sleutel) : undefined
    // Eén bestaande regel kan maar één gast zijn, dus na een match is hij op.
    if (rij && sleutel) opSleutel.delete(sleutel)
    return { g, bestaand: rij ?? null }
  })

  // ── Past dit nog in de lijst? ─────────────────────────────────────────────
  // Alleen wat er echt bijkomt telt mee. Wie zijn eigen antwoord bijwerkt is
  // geen nieuwe gast.
  const erbij = paren.filter((p) => !p.bestaand).length
  if ((bestaand?.length ?? 0) + erbij > MAX_GASTEN_PER_EVENT) {
    return Response.json({ error: "De gastenlijst van deze bruiloft zit vol." }, { status: 400 })
  }

  // ── Heeft dit toestel eerder meer ingevuld dan nu? ────────────────────────
  // Iemand die eerst voor zichzelf en zijn partner antwoordde en daarna alleen
  // voor zichzelf, moet die partner kwijt kunnen. We wissen die regel niet:
  // hij kan door het bruidspaar zijn ingetypt, en een gast hoort niets uit hun
  // lijst te kunnen verwijderen. We zetten hem terug op verstuurd, dus op
  // "nog niets gehoord". Een regel die echt niet bestaat haalt het bruidspaar
  // er zelf uit, met de knop die er al is.
  const houden = new Set(paren.map((p) => p.bestaand?.id).filter(Boolean) as string[])
  const vervangt = apparaat
    ? ((bestaand ?? []) as BestaandeRij[]).some((r) => r.apparaat === apparaat)
    : false

  if (apparaat) {
    const terug = ((bestaand ?? []) as BestaandeRij[])
      .filter((r) => r.apparaat === apparaat && !houden.has(r.id))
      .map((r) => r.id)
    if (terug.length > 0) {
      await supabase
        .from("rsvp")
        // maybe betekent hier: nog geen antwoord. Zou attending blijven
        // staan op het oude ja, dan las de export hem als aanwezig.
        .update({ [kolom]: "verstuurd", apparaat: null, attending: "maybe" })
        .in("id", terug)
    }
  }

  // ── Wegschrijven ──────────────────────────────────────────────────────────
  // Iedereen die samen instuurt hoort bij hetzelfde huishouden. Dat is precies
  // wat een gezin is: één keer invullen, meerdere mensen. Stond er al een
  // huishouden van het bruidspaar, dan is dat de betere indeling en houden we
  // die aan, ook voor wie er nieuw bij komt.
  const submission_id = crypto.randomUUID()
  const alBekend = paren.find((p) => p.bestaand?.huishouden_id)?.bestaand
  const huishouden_id = alBekend?.huishouden_id ?? crypto.randomUUID()
  const huishouden_naam = alBekend?.huishouden_naam ?? schoon[0]?.naam ?? null

  function velden(g: (typeof schoon)[number]) {
    return {
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
        : { inv_status: g.attending === "no" ? "nee" : "ja" }),
      bron_token: bronToken,
      apparaat,
      ...(g.song != null ? { song: tekst(g.song, MAX_KORT) } : {}),
      ...(g.overnachting != null ? { overnachting: g.overnachting } : {}),
      ...(g.custom_answer != null ? { custom_answer: g.custom_answer } : {}),
      ...(g.custom_answer_2 != null ? { custom_answer_2: g.custom_answer_2 } : {}),
      ...(g.antwoorden ? { antwoorden: g.antwoorden } : {}),
    }
  }

  // Wie de uitnodiging beantwoordt heeft ook de Save the Date gehad, dus die
  // staat minstens op verstuurd. Een echt antwoord daarop overschrijven we
  // niet: dan zou de kolom liegen over wat de gast gezegd heeft.
  function stdErbij(p: { bestaand: BestaandeRij | null }) {
    if (status !== "definitief") return {}
    const nu = reis(p.bestaand?.std_status)
    return nu === "niet_verstuurd" ? { std_status: "verstuurd" } : {}
  }

  const rows = paren.map((p) => velden(p.g))
  let fout: { message: string } | null = null

  const nieuwe = paren
    .filter((p) => !p.bestaand)
    .map((p) => ({ event_id, submission_id, huishouden_id, huishouden_naam, ...velden(p.g), ...stdErbij(p) }))

  if (nieuwe.length > 0) {
    const { error } = await supabase.from("rsvp").insert(nieuwe)
    if (error) fout = error
  }

  // Bij een bestaande regel laten we het huishouden staan zoals het bruidspaar
  // het indeelde. Wij weten niet beter dan zij wie bij wie hoort.
  for (const p of paren) {
    if (!p.bestaand || fout) continue
    const { error } = await supabase
      .from("rsvp")
      .update({ submission_id, ...velden(p.g), ...stdErbij(p) })
      .eq("id", p.bestaand.id)
    if (error) fout = error
  }

  if (fout) {
    console.error("[rsvp] wegschrijven:", fout)
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
