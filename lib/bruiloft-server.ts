import { createServiceClient } from "@/lib/supabase"
import { planAllows } from "@/lib/plans"
import { komtGast, reis } from "@/lib/gasten"
import type { RsvpRow } from "@/app/dashboard/RsvpSection"
import type { GuestPhotoRow, GuestPhotoSettings } from "@/app/dashboard/GuestPhotosSection"
import type { CardRow } from "@/lib/cards"
import { GEEN_SIGNALEN, type Signalen } from "@/lib/checklist"

// Eén bruiloft ophalen, met alles wat het dashboard en zijn subpagina's ervan
// willen weten.
//
// Uit het klantreisgesprek van 21 september 2026: er is één bruiloft per
// account. Dit bestand is de enige plek die bepaalt welke rij dat is en hoe
// de stand wordt uitgerekend, zodat het dashboard, de instellingen en de
// checklist nooit drie verschillende antwoorden geven.
//
// Alles wat hier staat komt uit wat er echt gebeurd is, nooit uit de datum.

export interface Bruiloft {
  id: string
  slug: string
  title: string
  type: string
  status: string
  plan: string | null
  datum: string | null
  locatie: string | null
  created_at: string
  expires_at: string | null
  hero_image_url: string | null
  /**
   * Is er een website-ontwerp, los van of het pakket betaald is? De
   * kaartbouwer maakt dezelfde bruiloftrij aan met een lege content, dus
   * alleen een gevulde content betekent dat er in de websitebouwer is
   * gewerkt. Zonder dit zag het dashboard geen verschil tussen "nog geen
   * website" en "wel gebouwd, nog niet betaald".
   */
  heeftSite: boolean
  /** De naam die het bruidspaar zijn website-ontwerp gaf. */
  conceptNaam: string | null
}

export interface Extra {
  hoort_bij: string | null
  checklist: unknown
  deadline: unknown
  stand_frequentie: string
}

/** De stand van de bruiloft: alleen wat er echt is. */
export interface Stand {
  gasten: number
  komen: number
  nietKomen: number
  stil: number
  kinderen: number
  dieet: number
  allergie: number
  stdVerstuurd: number
  stdGereageerd: number
  invVerstuurd: number
  invGereageerd: number
  live: boolean
  magSite: boolean
  magRsvp: boolean
  magFotos: boolean
  fotos: number
  fotomuurAan: boolean
}

export interface BruiloftMetAlles {
  bruiloft: Bruiloft | null
  /** Alle bruiloften van dit account, voor als er onverhoopt meer dan één is. */
  alle: Bruiloft[]
  /** De bruiloft plus zijn ontwerpen (hoort_bij). */
  groep: Bruiloft[]
  extra: Record<string, Extra>
  rsvps: RsvpRow[]
  cards: CardRow[]
  cardsAvailable: boolean
  guestPhotos: GuestPhotoRow[]
  gpSettings: Record<string, GuestPhotoSettings>
  stand: Stand
  signalen: Signalen
}

const LEGE_STAND: Stand = {
  gasten: 0, komen: 0, nietKomen: 0, stil: 0, kinderen: 0, dieet: 0, allergie: 0,
  stdVerstuurd: 0, stdGereageerd: 0, invVerstuurd: 0, invGereageerd: 0,
  live: false, magSite: false, magRsvp: false, magFotos: false, fotos: 0, fotomuurAan: false,
}

/**
 * Wat het dashboard laat zien aan iemand die nog niet is ingelogd: niets van
 * niemand, maar wel de drie grijze tegels. Het lege dashboard is de
 * pakketkeuze, dus dat moet je kunnen zien voordat je een account hebt.
 */
export function leegResultaat(): BruiloftMetAlles {
  return {
    bruiloft: null,
    alle: [],
    groep: [],
    extra: {},
    rsvps: [],
    cards: [],
    cardsAvailable: false,
    guestPhotos: [],
    gpSettings: {},
    stand: LEGE_STAND,
    signalen: GEEN_SIGNALEN,
  }
}

export async function laadBruiloft(email: string, gekozenId?: string | null): Promise<BruiloftMetAlles> {
  const service = createServiceClient()

  const { data: events } = await service
    .from("events")
    .select("id, slug, title, type, status, plan, created_at, expires_at, hero_image_url, datum, locatie, concept_naam")
    .eq("user_email", email)
    .order("created_at", { ascending: false })

  const alle = ((events ?? []) as Record<string, unknown>[]).map((e) => {
    const { concept_naam, ...rest } = e
    return {
      ...rest,
      // Wordt hieronder gevuld uit de paginatabel.
      heeftSite: false,
      conceptNaam: typeof concept_naam === "string" && concept_naam.trim() ? concept_naam : null,
    }
  }) as Bruiloft[]

  // Is er in de websitebouwer gewerkt? De pagina's staan in een eigen tabel.
  // De kaartbouwer maakt dezelfde bruiloft aan met alleen een lege Home, dus
  // een tweede pagina of een gevulde Home betekent: hier is een website.
  if (alle.length > 0) {
    const { data: paginas } = await service
      .from("pages")
      .select("event_id, type, content")
      .in("event_id", alle.map((e) => e.id))
    if (paginas) {
      const metSite = new Set<string>()
      for (const p of paginas) {
        const inhoud = p.content as Record<string, unknown> | null
        const gevuld = !!inhoud && Object.keys(inhoud).length > 0
        if (p.type !== "Home" || gevuld) metSite.add(p.event_id as string)
      }
      for (const e of alle) e.heeftSite = metSite.has(e.id)
    }
  }

  // De kolommen die pas na migration_klantreis.sql bestaan, apart opgevraagd
  // zodat het dashboard blijft werken zolang die nog niet gedraaid is.
  let extra: Record<string, Extra> = {}
  if (alle.length > 0) {
    const { data: extraData, error: extraErr } = await service
      .from("events")
      .select("id, hoort_bij, checklist, deadline, stand_frequentie")
      .in("id", alle.map((e) => e.id))
    if (!extraErr && extraData) {
      extra = Object.fromEntries(
        extraData.map((e) => [
          e.id as string,
          {
            hoort_bij: (e.hoort_bij as string | null) ?? null,
            checklist: e.checklist,
            deadline: e.deadline,
            stand_frequentie: (e.stand_frequentie as string | null) ?? "wekelijks",
          },
        ])
      )
    }
  }

  // Eén bruiloft. Wie live staat heeft betaald, dus die gaat voor; daarna de
  // nieuwste. Ontwerpen (hoort_bij) tellen niet als bruiloft.
  const hoofden = alle.filter((e) => !extra[e.id]?.hoort_bij)
  const gesorteerd = [...hoofden].sort((a, b) => {
    const aLive = ["published", "expired"].includes(a.status) ? 0 : 1
    const bLive = ["published", "expired"].includes(b.status) ? 0 : 1
    if (aLive !== bLive) return aLive - bLive
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  const bruiloft = gesorteerd.find((e) => e.id === gekozenId) ?? gesorteerd[0] ?? null
  const groep = bruiloft
    ? alle.filter((e) => e.id === bruiloft.id || extra[e.id]?.hoort_bij === bruiloft.id)
    : []
  const groepIds = groep.map((e) => e.id)

  let rsvps: RsvpRow[] = []
  let cards: CardRow[] = []
  let cardsAvailable = false
  let guestPhotos: GuestPhotoRow[] = []
  let gpSettings: Record<string, GuestPhotoSettings> = {}

  if (groepIds.length > 0) {
    // Alles wat alleen van de bruiloft afhangt tegelijk ophalen. Dit liep
    // eerst na elkaar, zes ritjes naar de database, en dat was het wachten
    // bij het terugkeren naar het dashboard (Michiel, 23 september 2026).
    // De adres- en kaartkolommen op rsvp bestaan pas na hun migratie, dus die
    // staan apart: mislukt zo'n vraag, dan weten we het gewoon niet en werkt
    // de rest door.
    const fotoIds = groep.filter((e) => planAllows(e.plan, "photos")).map((e) => e.id)
    const leeg = Promise.resolve({ data: null as Record<string, unknown>[] | null, error: null as unknown })
    const [rsvpRes, adresRes, kaartIdRes, cardRes, gpEventsRes, gpDataRes] = await Promise.all([
      service
        .from("rsvp")
        .select(
          "id, event_id, submission_id, name, voornaam, achternaam, email, telefoon, guest_type, dietary, allergie, is_primary, attending, message, song, overnachting, custom_answer, custom_answer_2, is_kind, leeftijd, status, std_status, inv_status, bron_token, huishouden_naam, created_at"
        )
        .in("event_id", groepIds)
        .order("created_at", { ascending: false }),
      service.from("rsvp").select("id, adres").in("event_id", groepIds),
      service.from("rsvp").select("id, std_kaart_id, inv_kaart_id").in("event_id", groepIds),
      service
        .from("cards")
        .select("id, event_id, type, template, share_token, content, view_count, created_at")
        .in("event_id", groepIds)
        .order("created_at", { ascending: true }),
      fotoIds.length > 0
        ? service.from("events").select("id, guest_photos_enabled, guest_photos_moderation, style").in("id", fotoIds)
        : leeg,
      fotoIds.length > 0
        ? service
            .from("guest_photos")
            .select("id, event_id, name, caption, url, status, created_at")
            .in("event_id", fotoIds)
            .order("created_at", { ascending: false })
        : leeg,
    ])

    rsvps = (rsvpRes.data ?? []) as RsvpRow[]

    if (!adresRes.error && adresRes.data) {
      const per = new Map(adresRes.data.map((a) => [a.id as string, (a.adres as string | null) ?? null]))
      rsvps = rsvps.map((r) => (per.has(r.id) ? { ...r, adres: per.get(r.id) ?? null } : r))
    }

    if (!kaartIdRes.error && kaartIdRes.data) {
      const per = new Map(kaartIdRes.data.map((k) => [k.id as string, k]))
      rsvps = rsvps.map((r) => {
        const k = per.get(r.id)
        return k
          ? { ...r, std_kaart_id: (k.std_kaart_id as string | null) ?? null, inv_kaart_id: (k.inv_kaart_id as string | null) ?? null }
          : r
      })
    }

    if (!cardRes.error) {
      cardsAvailable = true
      cards = (cardRes.data ?? []) as CardRow[]
    }

    if (gpEventsRes.data) {
      gpSettings = Object.fromEntries(
        gpEventsRes.data.map((e) => [
          e.id as string,
          {
            enabled: (e.guest_photos_enabled as boolean | null) ?? false,
            moderation: (e.guest_photos_moderation as "live" | "approve" | null) ?? "live",
            style: (e.style as string | null) ?? "roze",
          },
        ])
      )
      guestPhotos = (gpDataRes.data ?? []) as GuestPhotoRow[]
    }
  }

  // ── De stand ──────────────────────────────────────────────────────────────
  let stand: Stand = LEGE_STAND
  let signalen: Signalen = GEEN_SIGNALEN

  if (bruiloft) {
    let komen = 0, nietKomen = 0, stil = 0
    for (const r of rsvps) {
      const k = komtGast(reis(r.std_status), reis(r.inv_status))
      if (k === true) komen++
      else if (k === false) nietKomen++
      else stil++
    }
    const live = groep.some((e) => e.status === "published")
    const magSite = groep.some((e) => planAllows(e.plan, "site"))
    const magRsvp = groep.some((e) => planAllows(e.plan, "rsvp"))
    const magFotos = groep.some((e) => planAllows(e.plan, "photos"))
    const stdVerstuurd = rsvps.filter((r) => reis(r.std_status) !== "niet_verstuurd").length
    const invVerstuurd = rsvps.filter((r) => reis(r.inv_status) !== "niet_verstuurd").length

    stand = {
      gasten: rsvps.length,
      komen, nietKomen, stil,
      kinderen: rsvps.filter((r) => r.is_kind === true).length,
      dieet: rsvps.filter((r) => !!r.dietary).length,
      allergie: rsvps.filter((r) => !!r.allergie).length,
      stdVerstuurd,
      stdGereageerd: rsvps.filter((r) => ["ja", "nee"].includes(reis(r.std_status))).length,
      invVerstuurd,
      invGereageerd: rsvps.filter((r) => ["ja", "nee"].includes(reis(r.inv_status))).length,
      live, magSite, magRsvp, magFotos,
      fotos: guestPhotos.length,
      fotomuurAan: groep.some((e) => gpSettings[e.id]?.enabled === true),
    }

    const dl = (extra[bruiloft.id]?.deadline ?? null) as { gedaan?: boolean } | null
    signalen = {
      datumGezet: !!bruiloft.datum,
      locatieGezet: !!bruiloft.locatie,
      gastenInLijst: stand.gasten,
      stdVerstuurd: stdVerstuurd > 0,
      invVerstuurd: invVerstuurd > 0,
      siteLive: live && magSite,
      aanmeldingen: komen + nietKomen,
      aantallenDoorgegeven: dl?.gedaan === true,
      fotos: stand.fotos,
    }
  }

  return { bruiloft, alle, groep, extra, rsvps, cards, cardsAvailable, guestPhotos, gpSettings, stand, signalen }
}

/** "Bruiloft van Sophie & Daan", of iets bruikbaars als de namen ontbreken. */
export function bruiloftNaam(b: Bruiloft | null): string {
  if (!b) return "Jullie bruiloft"
  const naam = (b.title ?? "").trim()
  if (!naam) return "Jullie bruiloft"
  return /^bruiloft van/i.test(naam) ? naam : `Bruiloft van ${naam}`
}
