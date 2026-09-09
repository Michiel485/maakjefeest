export const revalidate = 60

import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import EventPageSection, { type PageData } from "../EventPageSection"
import { publicPageTypes } from "@/lib/plans"

export default async function EventSubPage({
  params,
}: {
  params: Promise<{ slug: string; type: string }>
}) {
  const { slug, type } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, style, font_hero, font_initials, font_frame_names, font_page_titles, plan")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) notFound()

  const { data: page } = await supabase
    .from("pages")
    .select("id, type, title, content")
    .eq("event_id", event.id)
    .eq("type", type)
    .eq("is_enabled", true)
    .single<PageData>()

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
