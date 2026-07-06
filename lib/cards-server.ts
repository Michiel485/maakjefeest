// Server-side helpers voor digitale kaarten (gedeeld door pagina, og-image en download)

import { createServiceClient } from "./supabase"
import type { CardEventSource, CardRow } from "./cards"

export interface CardEventRow extends CardEventSource {
  slug: string
  status: string
  style: string
  initials: string | null
  font_hero: string | null
  font_initials: string | null
  font_frame_names: string | null
  font_page_titles: string | null
}

export interface CardWithEvent {
  card: CardRow
  event: CardEventRow
}

export async function fetchCardByToken(token: string): Promise<CardWithEvent | null> {
  const supabase = createServiceClient()

  const { data: card } = await supabase
    .from("cards")
    .select("id, event_id, type, template, share_token, content, view_count, created_at")
    .eq("share_token", token)
    .single()

  if (!card) return null

  const { data: event } = await supabase
    .from("events")
    .select(
      "title, frame_names, datum, locatie, hero_image_url, slug, status, style, initials, font_hero, font_initials, font_frame_names, font_page_titles"
    )
    .eq("id", card.event_id)
    .single()

  if (!event) return null

  return { card: card as CardRow, event: event as CardEventRow }
}
