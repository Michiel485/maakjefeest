import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase-server"
import { createServiceClient } from "@/lib/supabase"
import { SignOutButton } from "./SignOutButton"
import RsvpSection, { type RsvpRow } from "./RsvpSection"
import { eventSiteUrl, eventSiteLabel } from "@/lib/site-url"
import SlugEditor from "./SlugEditor"
import DeleteDraftButton from "./DeleteDraftButton"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"

type Event = {
  id: string
  slug: string
  title: string
  type: string
  status: string
  created_at: string
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

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-4 md:p-6"
      style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
    >
      {/* Text section */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>{typeLabel}</span>
          {isDraft ? (
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
              Concept
            </span>
          ) : (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </div>
        <h3
          className="text-lg font-mono"
          style={{ fontWeight: 700, color: CHARCOAL }}
        >
          {isDraft ? `sayingyes.nl/events/${event.slug}` : `${event.slug}.sayingyes.nl`}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: BODY }}>Opgeslagen op {date}</p>
        <div className="mt-2">
          <SlugEditor eventId={event.id} currentSlug={event.slug} isLive={!isDraft} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 md:flex-shrink-0">
        {isDraft && (
          <DeleteDraftButton eventId={event.id} />
        )}
        {!isDraft && (
          <a
            href={eventSiteUrl(event.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-center py-2 md:py-0 transition-colors"
            style={{ color: BODY }}
            title={eventSiteLabel(event.slug)}
          >
            Bekijken →
          </a>
        )}
        <Link
          href={`/bouwen?event_id=${event.id}`}
          className="text-sm font-semibold px-4 py-3 md:py-2 rounded-xl text-center transition-all hover:-translate-y-0.5 w-full md:w-auto"
          style={{ backgroundColor: CHARCOAL, color: IVORY }}
        >
          Verder bewerken
        </Link>
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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/inloggen")

  const service = createServiceClient()
  const { data: events } = await service
    .from("events")
    .select("id, slug, title, type, status, created_at")
    .eq("user_email", user.email!)
    .order("created_at", { ascending: false })

  const published = (events ?? []).filter((e: Event) => e.status === "published")
  const drafts    = (events ?? []).filter((e: Event) => e.status === "draft")
  const firstName = user.email?.split("@")[0] ?? "daar"

  let rsvps: RsvpRow[] = []
  if (published.length > 0) {
    const eventIds = published.map((e: Event) => e.id)
    const { data: rsvpData } = await service
      .from("rsvp")
      .select("id, event_id, submission_id, name, email, guest_type, dietary, is_primary, attending, message, song, overnachting, custom_answer, custom_answer_2, created_at")
      .in("event_id", eventIds)
      .order("created_at", { ascending: false })
    rsvps = (rsvpData ?? []) as RsvpRow[]
  }

  return (
    <div translate="no" className="min-h-screen" style={{ backgroundColor: IVORY }}>

      {/* Nav */}
      <header
        className="sticky top-0 z-10"
        style={{ backgroundColor: IVORY, borderBottom: `1px solid ${GOLD_LIGHT}` }}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
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

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* Welcome */}
        <div className="mb-12">
          <h1
            className="mb-2"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontWeight: 700,
              color: CHARCOAL,
            }}
          >
            Welkom, {firstName}
          </h1>
          <p className="text-sm" style={{ color: BODY }}>
            Hier vind je al jullie bruiloftsprojecten en RSVP-aanmeldingen.
          </p>
          {/* Thin gold rule */}
          <div className="flex items-center gap-3 mt-6">
            <div style={{ width: 32, height: 1, backgroundColor: GOLD_LIGHT }} />
            <svg width="6" height="6" viewBox="0 0 8 8" fill={GOLD_LIGHT}>
              <path d="M4 0 L8 4 L4 8 L0 4 Z" />
            </svg>
            <div style={{ flex: 1, height: 1, backgroundColor: GOLD_LIGHT }} />
          </div>
        </div>

        {/* Live websites */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <SectionLabel>Live bruiloftswebsites</SectionLabel>
            <Link
              href="/aanmaken"
              className="text-sm font-semibold transition-colors"
              style={{ color: GOLD }}
            >
              + Nieuwe aanmaken
            </Link>
          </div>

          {published.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
              >
                <svg className="w-5 h-5" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
                </svg>
              </div>
              <p className="text-sm mb-5" style={{ color: BODY }}>
                Nog geen live bruiloftswebsite. Bouw er een en publiceer hem voor eenmalig €49,99.
              </p>
              <Link
                href="/aanmaken"
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: CHARCOAL, color: IVORY }}
              >
                Start nu gratis
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {published.map((ev: Event) => <EventCard key={ev.id} event={ev} />)}
            </div>
          )}
        </section>

        {/* Drafts */}
        {drafts.length > 0 && (
          <section className="mb-10">
            <div className="mb-5">
              <SectionLabel>Opgeslagen concepten</SectionLabel>
            </div>
            <div className="flex flex-col gap-4">
              {drafts.map((ev: Event) => <EventCard key={ev.id} event={ev} isDraft />)}
            </div>
          </section>
        )}

        {/* RSVP */}
        <section>
          <div className="mb-5">
            <SectionLabel>RSVP-aanmeldingen</SectionLabel>
          </div>
          <RsvpSection
            rsvps={rsvps}
            events={published.map((e: Event) => ({ id: e.id, title: e.title }))}
          />
        </section>

      </main>
    </div>
  )
}
