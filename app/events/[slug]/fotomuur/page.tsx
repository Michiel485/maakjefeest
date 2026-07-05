export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import { maxPhotosPerEvent } from "@/lib/guest-photos"
import PhotoWall, { type GuestPhoto } from "./photo-wall"

export default async function FotomuurPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, nav_title, style, font_hero, font_initials, font_frame_names, font_page_titles, guest_photos_enabled"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event || !event.guest_photos_enabled) notFound()

  const { data: photos } = await supabase
    .from("guest_photos")
    .select("id, name, caption, url, created_at")
    .eq("event_id", event.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(maxPhotosPerEvent())

  const sc = getStyleConfig(event.style, {
    fontHero:       event.font_hero        as string | null,
    fontInitials:   event.font_initials    as string | null,
    fontFrameNames: event.font_frame_names as string | null,
    fontPageTitles: event.font_page_titles as string | null,
  })

  const basePath = process.env.NODE_ENV === "production" ? "" : `/events/${slug}`

  return (
    <PhotoWall
      photos={(photos ?? []) as GuestPhoto[]}
      uploadHref={`${basePath}/foto-delen`}
      sc={sc}
    />
  )
}
