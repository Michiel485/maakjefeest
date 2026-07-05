export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
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
      "id, title, nav_title, style, font_hero, font_initials, font_frame_names, font_page_titles, guest_photos_enabled, guest_photos_moderation"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event || !event.guest_photos_enabled) notFound()

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
      eventTitle={(event.nav_title as string | null) || event.title}
      moderated={event.guest_photos_moderation === "approve"}
      wallHref={`${basePath}/fotomuur`}
      sc={sc}
    />
  )
}
