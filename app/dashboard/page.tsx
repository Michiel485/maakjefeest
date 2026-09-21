import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase-server"

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
}
import { createServiceClient } from "@/lib/supabase"
import { SignOutButton } from "./SignOutButton"
import RsvpSection, { type RsvpRow } from "./RsvpSection"
import GuestPhotosSection, { type GuestPhotoRow, type GuestPhotoSettings } from "./GuestPhotosSection"
import { maxPhotosPerEvent } from "@/lib/guest-photos"
import CardsSection from "./CardsSection"
import type { CardRow } from "@/lib/cards"
import { eventSiteUrl, eventSiteLabel } from "@/lib/site-url"
import SlugEditor from "./SlugEditor"
import DeleteDraftButton from "./DeleteDraftButton"
import RenewalButton from "./RenewalButton"
import DeleteEventButton from "./DeleteEventButton"
import { PLANS, PLAN_ORDER, normalizePlan, planAllows, planRank, renewalAllowed, upgradePrice, formatEur } from "@/lib/plans"
import Bruiloft, { Altijd, NogNiets } from "./Bruiloft"
import Checklist from "./Checklist"
import DeadlineInstelling from "./Deadline"
import { huidigeFase } from "@/lib/fasen"
import { LEGE_STAND, type Stand } from "@/lib/dashboard-tegels"
import { GEEN_SIGNALEN, type Signalen } from "@/lib/checklist"
import { komtGast, reis } from "@/lib/gasten"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"
const SOFT       = "#9A8E82"

type Event = {
  id: string
  slug: string
  title: string
  type: string
  status: string
  datum?: string | null
  locatie?: string | null
  plan?: string | null
  created_at: string
  expires_at: string | null
  hero_image_url?: string | null
}

// Upgrade-knoppen naar elk hoger pakket, met het bij te betalen bedrag
function UpgradeLinks({ event }: { event: Event }) {
  const huidig = normalizePlan(event.plan)
  const hoger = PLAN_ORDER.filter((p) => planRank(p) > planRank(huidig))
  if (hoger.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {hoger.map((p) => {
        const bedrag = upgradePrice(huidig, p)
        return (
          <Link
            key={p}
            href={`/betalen?event_id=${event.id}&upgrade=${p}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}` }}
          >
            Upgrade naar {PLANS[p].label}{bedrag != null ? ` (+${formatEur(bedrag)})` : ""}
          </Link>
        )
      })}
    </div>
  )
}

const TYPE_LABEL: Record<string, string> = {
  bruiloft: "Bruiloft",
  verjaardag: "Verjaardag",
  evenement: "Evenement",
}

function EventCard({ event, isDraft = false }: { event: Event; isDraft?: boolean }) {
  const typeLabel = TYPE_LABEL[event.type] ?? event.type
  const date = new Date(event.created_at).toLocaleDateString("nl-NL", {
    day: "numeric", month: "long", year: "numeric",
  })

  const expiresAt           = event.expires_at ? new Date(event.expires_at) : null
  const now                 = new Date()
  const daysUntilExpiry     = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
  const isSubscriptionExpired = event.status === "expired" || (daysUntilExpiry !== null && daysUntilExpiry <= 0)
  const isExpiringSoon      = !isSubscriptionExpired && daysUntilExpiry !== null && daysUntilExpiry <= 30

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-4 md:p-6"
      style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
    >
      {/* Text section */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>{typeLabel}</span>
          {!isDraft && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}` }}>
              {PLANS[normalizePlan(event.plan)].label}
            </span>
          )}
          {isDraft ? (
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
              Concept
            </span>
          ) : isSubscriptionExpired ? (
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
              Verlopen
            </span>
          ) : isExpiringSoon ? (
            <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
              Verloopt binnenkort
            </span>
          ) : (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </div>
        <h3
          className={planAllows(event.plan, "rsvp") ? "text-lg font-mono" : "text-lg"}
          style={{ fontWeight: 700, color: CHARCOAL }}
        >
          {planAllows(event.plan, "rsvp") ? `${event.slug}.sayingyes.nl` : event.title}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: BODY }}>Opgeslagen op {date}</p>
        {!isDraft && !renewalAllowed(event.plan) && (
          <p className="text-xs mt-0.5" style={{ color: BODY }}>
            Geen einddatum, jullie kaartlink blijft werken
          </p>
        )}
        {!isDraft && renewalAllowed(event.plan) && (
          <p className="text-xs mt-0.5" style={{ color: isSubscriptionExpired ? "#b45309" : isExpiringSoon ? "#b45309" : BODY }}>
            {!expiresAt
              ? "Vervaldatum niet ingesteld"
              : isSubscriptionExpired
              ? `Verlopen op ${expiresAt.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}`
              : `Geldig tot ${expiresAt.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}${isExpiringSoon ? `, nog ${daysUntilExpiry} dagen` : ""}`
            }
          </p>
        )}
        {/* Het webadres is alleen relevant als er een publieke pagina bij hoort */}
        {planAllows(event.plan, "rsvp") && (
          <div className="mt-2">
            <SlugEditor eventId={event.id} currentSlug={event.slug} isLive={!isDraft} />
          </div>
        )}
        {!isDraft && <UpgradeLinks event={event} />}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 md:flex-shrink-0 md:min-w-[200px]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          {isDraft && (
            <DeleteDraftButton eventId={event.id} />
          )}
          {!isDraft && !isSubscriptionExpired && planAllows(event.plan, "rsvp") && (
            <a
              href={eventSiteUrl(event.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-center py-2 md:py-0 transition-colors"
              style={{ color: BODY }}
              title={eventSiteLabel(event.slug)}
            >
              {planAllows(event.plan, "site") ? "Bekijken →" : "Bekijk RSVP-pagina →"}
            </a>
          )}
          {!isDraft && renewalAllowed(event.plan) && (
            <RenewalButton eventId={event.id} />
          )}
          <Link
            href={planAllows(event.plan, "site") ? `/bouwen?event_id=${event.id}` : `/kaart-maken?event_id=${event.id}`}
            className="text-sm font-semibold px-4 py-3 md:py-2 rounded-xl text-center transition-all hover:-translate-y-0.5 w-full md:w-auto"
            style={{ backgroundColor: CHARCOAL, color: IVORY }}
          >
            {planAllows(event.plan, "site") ? "Verder bewerken" : "Ontwerp aanpassen"}
          </Link>
        </div>
        {!isDraft && (
          <div className="flex flex-wrap items-center gap-4 pt-1" style={{ borderTop: `1px solid #E8D5A3` }}>
            <DeleteEventButton eventId={event.id} />
          </div>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-semibold uppercase tracking-[0.18em]"
      style={{ color: GOLD }}
    >
      {children}
    </h2>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : undefined
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/inloggen")

  const service = createServiceClient()
  const { data: events } = await service
    .from("events")
    .select("id, slug, title, type, status, plan, created_at, expires_at, hero_image_url, datum, locatie")
    .eq("user_email", user.email!)
    .order("created_at", { ascending: false })

  const published = (events ?? []).filter((e: Event) => ["published", "expired"].includes(e.status))
  const drafts    = (events ?? []).filter((e: Event) => e.status === "draft")
  const firstName = user.email?.split("@")[0] ?? "daar"
  // Pakketrechten: RSVP-overzicht vanaf Uitnodiging & RSVP, fotomuur alleen bij Compleet
  // De gastenlijst hoort bij elk pakket: ook met alleen een Save the Date kun
  // je bijhouden wie je uitnodigt en wie voorlopig ja zei. Wat per pakket
  // verschilt is hoeveel er gevraagd wordt, niet of je een lijst hebt.
  const gastEvents  = published
  // Alleen deze pakketten hebben het volledige aanmeldformulier
  const rsvpEvents  = published.filter((e: Event) => planAllows(e.plan, "rsvp"))
  const photoEvents = published.filter((e: Event) => planAllows(e.plan, "photos"))

  let rsvps: RsvpRow[] = []
  // Gastenfotomuur: apart opgevraagd zodat het dashboard blijft werken zolang
  // de migratie (guest_photos) nog niet is gedraaid.
  let guestPhotos: GuestPhotoRow[] = []
  let gpSettings: Record<string, GuestPhotoSettings> = {}
  if (gastEvents.length > 0) {
    const { data: rsvpData } = await service
      .from("rsvp")
      .select("id, event_id, submission_id, name, voornaam, achternaam, email, telefoon, guest_type, dietary, allergie, is_primary, attending, message, song, overnachting, custom_answer, custom_answer_2, is_kind, leeftijd, status, std_status, inv_status, bron_token, huishouden_naam, created_at")
      .in("event_id", gastEvents.map((e: Event) => e.id))
      .order("created_at", { ascending: false })
    rsvps = (rsvpData ?? []) as RsvpRow[]
  }
  if (photoEvents.length > 0) {
    const eventIds = photoEvents.map((e: Event) => e.id)
    const { data: gpEvents } = await service
      .from("events")
      .select("id, guest_photos_enabled, guest_photos_moderation, style")
      .in("id", eventIds)
    if (gpEvents) {
      gpSettings = Object.fromEntries(
        gpEvents.map((e) => [
          e.id,
          {
            enabled: (e.guest_photos_enabled as boolean | null) ?? false,
            moderation: (e.guest_photos_moderation as "live" | "approve" | null) ?? "live",
            style: (e.style as string | null) ?? "roze",
          },
        ])
      )
      const { data: gpData } = await service
        .from("guest_photos")
        .select("id, event_id, name, caption, url, status, created_at")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
      guestPhotos = (gpData ?? []) as GuestPhotoRow[]
    }
  }

  // Digitale kaarten: voor alle events (ook concepten — een Save the Date
  // verstuur je juist vóór de site live is). Apart opgevraagd zodat het
  // dashboard blijft werken zolang de cards-migratie nog niet is gedraaid.
  let cards: CardRow[] = []
  let cardsAvailable = false
  const allEventIds = (events ?? []).map((e: Event) => e.id)
  if (allEventIds.length > 0) {
    const { data: cardData, error: cardError } = await service
      .from("cards")
      .select("id, event_id, type, template, share_token, content, view_count, created_at")
      .in("event_id", allEventIds)
      .order("created_at", { ascending: false })
    if (!cardError) {
      cardsAvailable = true
      cards = (cardData ?? []) as CardRow[]
    }
  }


  // ── Eén bruiloft, met onderdelen eronder ──────────────────────────────────
  // Uit het klantreisgesprek van 21 september 2026. Elk concept was een eigen
  // rij in events, en daardoor kreeg het dashboard een losse kolom per concept.
  // De kolom hoort_bij wijst een ontwerp naar zijn bruiloft; leeg betekent dat
  // de rij zelf een bruiloft is.
  //
  // Apart opgevraagd, zodat het dashboard blijft werken zolang
  // migration_klantreis.sql nog niet gedraaid is. Dezelfde voorzichtigheid als
  // bij de kaarten en de fotomuur hieronder.
  let extra: Record<
    string,
    { hoort_bij: string | null; checklist: unknown; deadline: unknown; stand_frequentie: string }
  > = {}
  if ((events ?? []).length > 0) {
    const { data: extraData, error: extraErr } = await service
      .from("events")
      .select("id, hoort_bij, checklist, deadline, stand_frequentie")
      .in("id", (events ?? []).map((e: Event) => e.id))
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

  const alle = events ?? []
  const hoofden = alle.filter((e: Event) => !extra[e.id]?.hoort_bij)
  // Wie live staat heeft betaald, dus die bruiloft is de belangrijkste. Daarna
  // de nieuwste. Met ?b= kiest de klant zelf, als hij er meer dan één heeft.
  const gesorteerd = [...hoofden].sort((a: Event, b: Event) => {
    const aLive = ["published", "expired"].includes(a.status) ? 0 : 1
    const bLive = ["published", "expired"].includes(b.status) ? 0 : 1
    if (aLive !== bLive) return aLive - bLive
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  const gekozenId = typeof params?.b === "string" ? params.b : null
  const bruiloft = gesorteerd.find((e: Event) => e.id === gekozenId) ?? gesorteerd[0] ?? null
  // De bruiloft zelf plus zijn ontwerpen.
  const groep = bruiloft
    ? alle.filter((e: Event) => e.id === bruiloft.id || extra[e.id]?.hoort_bij === bruiloft.id)
    : []
  const groepIds = new Set(groep.map((e: Event) => e.id))

  // ── De stand van deze bruiloft ────────────────────────────────────────────
  // Alles hieronder komt uit gegevens die we toch al ophaalden.
  let stand: Stand = LEGE_STAND
  let signalen: Signalen = GEEN_SIGNALEN
  let fase = huidigeFase(null)
  let checklistStand: unknown = null

  if (bruiloft) {
    const mijnRsvps = rsvps.filter((r) => groepIds.has(r.event_id))
    const mijnKaarten = cards.filter((c) => groepIds.has(c.event_id))
    const mijnFotos = guestPhotos.filter((f) => groepIds.has(f.event_id))
    const liveInGroep = groep.some((e: Event) => e.status === "published")
    const magSite = groep.some((e: Event) => planAllows(e.plan, "site"))

    const huishoudens = new Set(
      mijnRsvps.map((r) => (r.huishouden_naam ?? "").toLowerCase().trim() || r.id)
    ).size

    let komen = 0
    let nietKomen = 0
    let stil = 0
    for (const r of mijnRsvps) {
      const k = komtGast(reis(r.std_status), reis(r.inv_status))
      if (k === true) komen++
      else if (k === false) nietKomen++
      else stil++
    }

    const dl = (extra[bruiloft.id]?.deadline ?? null) as
      | { naam?: string; datum?: string; gedaan?: boolean }
      | null
    const deadlineOver =
      dl?.datum && !Number.isNaN(new Date(dl.datum).getTime())
        ? Math.round(
            (Date.UTC(
              new Date(dl.datum).getUTCFullYear(),
              new Date(dl.datum).getUTCMonth(),
              new Date(dl.datum).getUTCDate()
            ) -
              Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())) /
              86400000
          )
        : null

    stand = {
      datum: bruiloft.datum ?? null,
      locatie: bruiloft.locatie ?? null,
      live: liveInGroep,
      magSite,
      gasten: mijnRsvps.length,
      huishoudens,
      kinderen: mijnRsvps.filter((r) => r.is_kind === true).length,
      stdVerstuurd: mijnRsvps.filter((r) => reis(r.std_status) !== "niet_verstuurd").length,
      stdGereageerd: mijnRsvps.filter((r) => ["ja", "nee"].includes(reis(r.std_status))).length,
      invVerstuurd: mijnRsvps.filter((r) => reis(r.inv_status) !== "niet_verstuurd").length,
      invGereageerd: mijnRsvps.filter((r) => ["ja", "nee"].includes(reis(r.inv_status))).length,
      komen,
      nietKomen,
      stil,
      dieet: mijnRsvps.filter((r) => !!r.dietary).length,
      allergie: mijnRsvps.filter((r) => !!r.allergie).length,
      heeftStdKaart: mijnKaarten.some((c) => c.type === "save_the_date"),
      heeftInvKaart: mijnKaarten.some((c) => c.type === "trouwkaart"),
      stdKaartLink: mijnKaarten.find((c) => c.type === "save_the_date")?.share_token ?? null,
      invKaartLink: mijnKaarten.find((c) => c.type === "trouwkaart")?.share_token ?? null,
      deadlineNaam: dl?.naam ?? null,
      deadlineOver,
      deadlineGedaan: dl?.gedaan === true,
      fotos: mijnFotos.length,
      fotomuurAan: groep.some((e: Event) => gpSettings[e.id]?.enabled === true),
      ontwerpen: groep.length,
    }

    signalen = {
      datumGezet: !!bruiloft.datum,
      locatieGezet: !!bruiloft.locatie,
      gastenInLijst: stand.gasten,
      stdVerstuurd: stand.stdVerstuurd > 0,
      invVerstuurd: stand.invVerstuurd > 0,
      siteLive: liveInGroep && magSite,
      aanmeldingen: stand.komen + stand.nietKomen,
      aantallenDoorgegeven: stand.deadlineGedaan,
      fotos: stand.fotos,
    }

    fase = huidigeFase(bruiloft.datum ?? null, {
      stdVerstuurd: signalen.stdVerstuurd,
      invVerstuurd: signalen.invVerstuurd,
      aantallenDoorgegeven: signalen.aantallenDoorgegeven,
    })

    checklistStand = extra[bruiloft.id]?.checklist ?? null
  }

  return (
    <div translate="no" className="min-h-screen" style={{ backgroundColor: IVORY }}>

      {/* Nav */}
      <header
        className="sticky top-0 z-10"
        style={{ backgroundColor: IVORY, borderBottom: `1px solid ${GOLD_LIGHT}` }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl tracking-wide transition-opacity hover:opacity-70"
            style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600 }}
          >
            SayingYes
          </Link>
          <SignOutButton />
        </div>
      </header>

      {/* Breder dan de rest van de site: de gastenlijst heeft kolommen nodig
          en die vielen weg in de witruimte links en rechts. */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* ── Eén bruiloft, en wat er nu telt ──
            Hier stond een platte lijst van vijf secties die er altijd allemaal
            waren. Nu staat bovenaan de bruiloft met de fase waarin je zit, en
            zijn de secties hieronder de uitwerking. */}
        {!bruiloft ? (
          <NogNiets />
        ) : (
          <div className="flex flex-col gap-10">
            {/* Meer dan één bruiloft komt zelden voor, maar wie een oud concept
                heeft staan moet er wel bij kunnen. */}
            {gesorteerd.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[11px] font-semibold uppercase"
                  style={{ letterSpacing: "0.14em", color: SOFT }}
                >
                  Bruiloft
                </span>
                {gesorteerd.map((e: Event) => (
                  <Link
                    key={e.id}
                    href={`/dashboard?b=${e.id}`}
                    className="text-sm px-3 py-1.5 rounded-full"
                    style={
                      e.id === bruiloft.id
                        ? { backgroundColor: GOLD_BG, border: `1px solid ${GOLD}`, color: CHARCOAL, fontWeight: 600 }
                        : { border: `1px solid ${GOLD_LIGHT}`, color: BODY }
                    }
                  >
                    {e.title || "Naamloos"}
                    {e.status === "draft" && (
                      <span className="ml-1.5 text-[11px]" style={{ color: SOFT }}>
                        concept
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            <Bruiloft titel={bruiloft.title} fase={fase} stand={stand} />

            <Altijd gasten={stand.gasten} ontwerpen={stand.ontwerpen} magSite={stand.magSite} />

            <Checklist
              eventId={bruiloft.id}
              fase={fase}
              stand={checklistStand}
              signalen={signalen}
            />
          </div>
        )}

        {/* RSVP */}
        <section id="gasten" className="mb-10 scroll-mt-24">
          <div className="mb-5">
            <SectionLabel>RSVP-aanmeldingen</SectionLabel>
          </div>
          {/* De lijst staat er altijd. Wat er bij een kaartpakket nog niet in
              zit is het volledige aanmeldformulier met dieetwensen; dat zegt de
              regel hieronder, en de lijst zelf werkt gewoon. */}
          {rsvpEvents.length === 0 && published.length > 0 && (
            <div
              className="rounded-2xl p-6 mb-5 text-sm leading-relaxed"
              style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}`, color: BODY }}
            >
              Je gasten kunnen nu alleen laten weten of ze erbij zijn. Dieetwensen, een liedje en
              je eigen vragen horen bij het pakket <strong style={{ color: CHARCOAL }}>Uitnodiging &amp; RSVP</strong>.
              Upgraden gaat via de knop bij jullie kaart hierboven; alles wat jullie al maakten blijft staan.
            </div>
          )}
          <RsvpSection
            rsvps={rsvps}
            events={gastEvents.map((e: Event) => ({ id: e.id, title: e.title }))}
          />
        </section>

        {/* ── Aantallen naar de locatie ──
            Hoort bij de gastenlijst, want het gaat over dezelfde cijfers.
            Alleen zinvol als er een datum is om vanaf te rekenen. */}
        {bruiloft && bruiloft.datum && (
          <div className="mb-10">
            <DeadlineInstelling
              eventId={bruiloft.id}
              trouwdag={bruiloft.datum}
              deadline={extra[bruiloft.id]?.deadline ?? null}
              frequentie={extra[bruiloft.id]?.stand_frequentie ?? "wekelijks"}
              komen={stand.komen}
              stil={stand.stil}
            />
          </div>
        )}

        {/* Digitale kaarten */}
        {cardsAvailable && (events ?? []).length > 0 && (
          <section id="kaarten" className="mb-10 scroll-mt-24">
            <div className="mb-5">
              <SectionLabel>Digitale kaarten</SectionLabel>
            </div>
            <CardsSection
              events={(events ?? []).map((e: Event) => ({
                id: e.id,
                title: e.title,
                status: e.status,
                plan: normalizePlan(e.plan),
                heroImageUrl: e.hero_image_url ?? null,
              }))}
              cards={cards}
            />
          </section>
        )}

        {/* Gastenfotomuur */}
        {photoEvents.length > 0 && Object.keys(gpSettings).length > 0 && (
          <section id="fotos" className="mb-10 scroll-mt-24">
            <div className="mb-5">
              <SectionLabel>Gastenfotomuur</SectionLabel>
            </div>
            <div className="flex flex-col gap-6">
              {photoEvents.map((ev: Event) =>
                gpSettings[ev.id] ? (
                  <GuestPhotosSection
                    key={ev.id}
                    event={{ id: ev.id, title: ev.title, slug: ev.slug }}
                    settings={gpSettings[ev.id]}
                    photos={guestPhotos.filter((p) => p.event_id === ev.id)}
                    maxPhotos={maxPhotosPerEvent()}
                  />
                ) : null
              )}
            </div>
          </section>
        )}

        {/* ── Je ontwerpen ──
            Beheer: wat er live staat, wat concept is, en de knoppen om te
            verlengen, het adres te wijzigen of iets weg te gooien. Dit hoort
            onderaan: je komt er een paar keer, niet elke week. */}
        {groep.length > 0 && (
          <section id="ontwerpen" className="mb-10 scroll-mt-24">
            <div className="mb-5">
              <SectionLabel>Je ontwerpen</SectionLabel>
            </div>
            <div className="flex flex-col gap-4">
              {groep
                .filter((ev: Event) => ["published", "expired"].includes(ev.status))
                .map((ev: Event) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              {groep
                .filter((ev: Event) => ev.status === "draft")
                .map((ev: Event) => (
                  <EventCard key={ev.id} event={ev} isDraft />
                ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
