export const revalidate = 60

// Leeg, maar verplicht: zonder generateStaticParams cachet Next een route met
// een dynamisch stuk in het pad helemaal niet, ook niet met revalidate erbij.
// Zie node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// generate-static-params.md. Niets vooraf renderen dus, maar wel bewaren zodra
// een pagina een keer is opgevraagd.
export async function generateStaticParams() {
  return []
}


import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import EventPageSection, { type PageData } from "../EventPageSection"
import { publicPageTypes } from "@/lib/plans"
import { rijOfNiets } from "@/lib/db"

export default async function EventSubPage({
  params,
}: {
  params: Promise<{ slug: string; type: string }>
}) {
  const { slug, type } = await params
  const supabase = createServiceClient()

  const event = rijOfNiets(await supabase
    .from("events")
    .select("id, style, font_hero, font_initials, font_frame_names, font_page_titles, plan")
    .eq("slug", slug)
    .eq("status", "published")
    .single(), "Website")

  if (!event) notFound()

  const page = rijOfNiets(await supabase
    .from("pages")
    .select("id, type, title, content")
    .eq("event_id", event.id)
    .eq("type", type)
    .eq("is_enabled", true)
    .single<PageData>(), "Pagina")

  // Subpagina's die niet bij het pakket horen bestaan publiek niet
  if (!page || publicPageTypes(event.plan, [page]).length === 0) notFound()

  const sc = getStyleConfig(event.style, {
    fontHero:       event.font_hero        as string | null,
    fontInitials:   event.font_initials    as string | null,
    fontFrameNames: event.font_frame_names as string | null,
    fontPageTitles: event.font_page_titles as string | null,
  })

  return <EventPageSection page={page} sc={sc} eventId={event.id} />
}
