export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import { planAllows } from "@/lib/plans"
import { siteNamen } from "@/lib/site-opening"
import UploadForm from "./upload-form"

export default async function FotoDelenPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, nav_title, frame_names, style, font_hero, font_initials, font_frame_names, font_page_titles, guest_photos_enabled, guest_photos_moderation, plan"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event || !event.guest_photos_enabled || !planAllows(event.plan, "photos")) notFound()

  const sc = getStyleConfig(event.style, {
    fontHero:       event.font_hero        as string | null,
    fontInitials:   event.font_initials    as string | null,
    fontFrameNames: event.font_frame_names as string | null,
    fontPageTitles: event.font_page_titles as string | null,
  })

  const basePath = process.env.NODE_ENV === "production" ? "" : `/events/${slug}`

  return (
    <UploadForm
      eventId={event.id}
      // De namen van het ontwerp, net als in de mails; het veld Naam van de
      // site is weg (10 oktober 2026)
      eventTitle={siteNamen(event as { frame_names?: string | null; nav_title?: string | null; title?: string | null })}
      moderated={event.guest_photos_moderation === "approve"}
      wallHref={`${basePath}/fotomuur`}
      sc={sc}
    />
  )
}
