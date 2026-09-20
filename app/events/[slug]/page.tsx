import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig, formatDate } from "@/lib/event-styles"
import EventHomePreview, { type HomepageSettings } from "@/components/EventHomePreview"
import EventPageSection, { type PageData } from "./EventPageSection"
import BackToTopButton from "@/components/BackToTopButton"
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
      sc={sc}
      homepageSettings={hs}
    />
  )

  if (!isSinglePage) {
    return homePreview
  }

  // Single-page mode: stack all enabled sections (per pakket gefilterd)
  const { data: allPages } = await supabase
    .from("pages")
    .select("id, type, title, content, order")
    .eq("event_id", event.id)
    .eq("is_enabled", true)
    .order("order", { ascending: true })

  const otherPages = publicPageTypes(plan, (allPages ?? []).filter((p) => p.type !== "Home") as PageData[])

  return (
    <>
      <section id="home">
        {homePreview}
      </section>
      {otherPages.map((page) => (
        <section key={page.type} id={page.type.toLowerCase()} style={{ scrollMarginTop: 64 }}>
          <EventPageSection page={page} sc={sc} eventId={event.id} />
        </section>
      ))}
      <BackToTopButton accentColor={sc.accent} />
    </>
  )
}
