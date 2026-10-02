import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig, formatDate } from "@/lib/event-styles"
import EventHomePreview, { type HomepageSettings } from "@/components/EventHomePreview"
import EventPageSection, { type PageData } from "./EventPageSection"
import BackToTopButton from "@/components/BackToTopButton"
import Sectie from "@/components/site/Sectie"
import Verschijn from "@/components/site/Verschijn"
import AanmeldKnop from "@/components/site/AanmeldKnop"
import { sectieHeeftInhoud } from "@/lib/sectie-inhoud"
import { naDeDag } from "@/lib/na-de-dag"
import Begroeting from "@/components/site/Begroeting"
import Gastenboek, { type GastenboekBericht } from "@/components/site/Gastenboek"
import FotosNaDeDag from "@/components/site/FotosNaDeDag"
import { normalizePlan, publicPageTypes } from "@/lib/plans"
import { rijOfNiets } from "@/lib/db"

// Gecached en op de achtergrond verversd. Zo blijft een klantsite in de lucht
// als de database er even uit ligt, en is een druk bezochte kaartlink niet
// meteen honderden queries. Na activeren of publiceren wordt de pagina direct
// verversd met verversEvent().
export const revalidate = 60

// Leeg, maar verplicht: zonder generateStaticParams cachet Next een route met
// een dynamisch stuk in het pad helemaal niet, ook niet met revalidate erbij.
// Zie node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// generate-static-params.md. Niets vooraf renderen dus, maar wel bewaren zodra
// een pagina een keer is opgevraagd.
export async function generateStaticParams() {
  return []
}


export default async function EventHomePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const basePath = process.env.NODE_ENV === "production" ? "" : `/events/${slug}`
  const supabase = createServiceClient()

  const event = rijOfNiets(await supabase
    .from("events")
    .select("id, type, title, datum, locatie, style, font_hero, font_initials, font_frame_names, font_page_titles, hero_image_url, hero_image_pos_x, hero_image_pos_y, hero_overlay, use_frame, frame_style, initials, frame_names, frame_location, frame_initials_size, frame_names_size, frame_date_size, frame_location_size, homepage_settings, plan")
    .eq("slug", slug)
    .eq("status", "published")
    .single(), "Website")

  if (!event) {
    return (
      <div className="py-20 px-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagina niet gevonden</h1>
        <p className="text-sm text-gray-500">Deze eventwebsite bestaat niet of is nog niet gepubliceerd.</p>
      </div>
    )
  }

  const hs = event.homepage_settings as HomepageSettings | null
  // Save the Date en Uitnodiging & RSVP zijn altijd één pagina; alleen Compleet
  // heeft losse subpagina's.
  const plan = normalizePlan(event.plan)
  const isCompleet = plan === "compleet"
  // Bij het pakket Save the Date hoort geen publieke pagina: de kaartlink is
  // het hele product en verwijst nergens naar de site.
  if (plan === "save_the_date") notFound()
  const isSinglePage = !isCompleet || hs?.pageMode === 'single'
  const rsvpHref = isSinglePage ? "#rsvp" : `${basePath}/RSVP`

  const homePage = rijOfNiets(await supabase
    .from("pages")
    .select("content")
    .eq("event_id", event.id)
    .eq("type", "Home")
    .eq("is_enabled", true)
    .single(), "Homepagina")

  const sc = getStyleConfig(event.style, {
    fontHero:       event.font_hero        as string | null,
    fontInitials:   event.font_initials    as string | null,
    fontFrameNames: event.font_frame_names as string | null,
    fontPageTitles: event.font_page_titles as string | null,
  })
  const c = homePage?.content ?? {}

  // Na de bruiloft: "Wij zijn getrouwd", geen aanmelden, de foto's bovenaan
  const voorbij = naDeDag(event.datum as string | null)
  const { data: gpEvent } = await supabase.from("events").select("guest_photos_enabled").eq("id", event.id).single()
  const fotomuurAan = isCompleet && ((gpEvent?.guest_photos_enabled as boolean | undefined) ?? false)

  // Het gastenboek: berichtjes met een vinkje van het bruidspaar. De kolom
  // bestaat pas na migration_gastenboek.sql; mist die, dan is het boek leeg.
  const { data: boekRijen } = await supabase
    .from("rsvp")
    .select("voornaam, name, message")
    .eq("event_id", event.id)
    .eq("bericht_openbaar", true)
    .order("created_at", { ascending: true })
    .limit(60)
  const gastenboek: GastenboekBericht[] = ((boekRijen ?? []) as { voornaam: string | null; name: string | null; message: string | null }[])
    .filter((r) => (r.message ?? "").trim())
    .map((r) => ({ naam: (r.voornaam ?? r.name ?? "").trim() || "Een gast", tekst: (r.message ?? "").trim() }))

  const homePreview = (
    <EventHomePreview
      title={event.title}
      datum={event.datum ?? null}
      datumFormatted={event.datum ? formatDate(event.datum) : null}
      locatie={event.locatie ?? null}
      heroImageUrl={event.hero_image_url ?? null}
      heroOverlay={event.hero_overlay ?? true}
      heroPosX={event.hero_image_pos_x ?? 50}
      heroPosY={event.hero_image_pos_y ?? 50}
      useFrame={event.use_frame ?? false}
      frameStyle={event.frame_style ?? null}
      initials={event.initials ?? null}
      frameNames={event.frame_names ?? null}
      frameLocation={event.frame_location ?? null}
      frameInitialsSize={event.frame_initials_size ?? undefined}
      frameNamesSize={event.frame_names_size ?? undefined}
      frameDateSize={event.frame_date_size ?? undefined}
      frameLocationSize={event.frame_location_size ?? undefined}
      homeTitle={typeof c.title === "string" ? c.title : null}
      homeBody={typeof c.body === "string" ? c.body : null}
      homeAlign={(c.align as "left" | "center" | "right") ?? "center"}
      homeTitleSize={typeof c.titleSize === "number" ? c.titleSize : undefined}
      homeBodySize={typeof c.bodySize === "number" ? c.bodySize : undefined}
      rsvpHref={rsvpHref}
      agendaHref={`${basePath}/agenda`}
      naDeDag={voorbij}
      fotosHref={fotomuurAan ? `${basePath}/fotomuur` : null}
      sc={sc}
      homepageSettings={hs}
    />
  )
  const begroeting = <Begroeting eventId={event.id} kleur={sc.accent} font={sc.fontFamily} />

  if (!isSinglePage) {
    return (
      <>
        {homePreview}
        {begroeting}
        {gastenboek.length > 0 && (
          <Sectie id="gastenboek" sc={sc} band>
            <Gastenboek berichten={gastenboek} sc={sc} />
          </Sectie>
        )}
      </>
    )
  }

  // Single-page mode: stack all enabled sections (per pakket gefilterd)
  const { data: allPages } = await supabase
    .from("pages")
    .select("id, type, title, content, order")
    .eq("event_id", event.id)
    .eq("is_enabled", true)
    .order("order", { ascending: true })

  // Lege secties staan er niet (lib/sectie-inhoud.ts); het menu laat ze ook weg
  const otherPages = publicPageTypes(plan, (allPages ?? []).filter((p) => p.type !== "Home") as PageData[])
    .filter((p) => sectieHeeftInhoud(p.type, p.content))
    // Na de dag hoeft niemand zich meer aan te melden
    .filter((p) => !(voorbij && p.type === "RSVP"))
  const metAanmelden = !voorbij && otherPages.some((p) => p.type === "RSVP")

  // Alle secties op een rij: na de dag eerst de foto's, en het gastenboek
  // als laatste (na de foto's van het bruidspaar)
  const secties: { id: string; inhoud: React.ReactNode }[] = []
  if (voorbij && fotomuurAan) {
    secties.push({ id: "fotos-van-de-dag", inhoud: <FotosNaDeDag sc={sc} fotomuurHref={`${basePath}/fotomuur`} delenHref={`${basePath}/foto-delen`} /> })
  }
  for (const page of otherPages) {
    secties.push({
      id: page.type.toLowerCase(),
      inhoud: (
        <EventPageSection
          page={page}
          sc={sc}
          eventId={event.id}
          event={{
            datum: event.datum ?? null,
            locatie: event.locatie ?? null,
            agendaHref: event.datum ? `${basePath}/agenda` : null,
            programmaHref: otherPages.some((p) => p.type === "Programma") ? "#programma" : null,
          }}
        />
      ),
    })
  }
  if (gastenboek.length > 0) {
    secties.push({ id: "gastenboek", inhoud: <Gastenboek berichten={gastenboek} sc={sc} /> })
  }

  return (
    <>
      <section id="home">
        {homePreview}
      </section>
      {/* Om en om een band met een iets andere tint; de opening telt als eerste, dus de eerste sectie erna is een band */}
      {secties.map((s, i) => (
        <Sectie key={s.id} id={s.id} sc={sc} band={i % 2 === 0} verschijn>
          {s.inhoud}
        </Sectie>
      ))}
      <Verschijn />
      {begroeting}
      {metAanmelden && <AanmeldKnop href="#rsvp" sc={sc} />}
      <BackToTopButton accentColor={sc.accent} />
    </>
  )
}
