import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig, formatDate } from "@/lib/event-styles"
import EventHomePreview, { type HomepageSettings } from "@/components/EventHomePreview"
import EventPageSection, { type PageData } from "./EventPageSection"

export const dynamic = "force-dynamic"

export default async function EventHomePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const basePath = process.env.NODE_ENV === "production" ? "" : `/events/${slug}`
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, type, title, datum, locatie, style, font_hero, font_initials, font_frame_names, font_page_titles, hero_image_url, hero_image_pos_x, hero_image_pos_y, hero_overlay, use_frame, frame_style, initials, frame_names, frame_location, frame_initials_size, frame_names_size, frame_date_size, frame_location_size, homepage_settings")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) {
    return (
      <div className="py-20 px-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagina niet gevonden</h1>
        <p className="text-sm text-gray-500">Deze eventwebsite bestaat niet of is nog niet gepubliceerd.</p>
      </div>
    )
  }

  const hs = event.homepage_settings as HomepageSettings | null
  const isSinglePage = hs?.pageMode === 'single'

  const { data: homePage } = await supabase
    .from("pages")
    .select("content")
    .eq("event_id", event.id)
    .eq("type", "Home")
    .eq("is_enabled", true)
    .single()

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
      rsvpHref={isSinglePage ? "#rsvp" : `${basePath}/RSVP`}
      sc={sc}
      homepageSettings={hs}
    />
  )

  if (!isSinglePage) {
    return homePreview
  }

  // Single-page mode: stack all enabled sections
  const { data: allPages } = await supabase
    .from("pages")
    .select("id, type, title, content, order")
    .eq("event_id", event.id)
    .eq("is_enabled", true)
    .order("order", { ascending: true })

  const otherPages = (allPages ?? []).filter((p) => p.type !== "Home") as PageData[]

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
    </>
  )
}
