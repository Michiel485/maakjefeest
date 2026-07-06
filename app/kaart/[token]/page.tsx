export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import { buildCardDisplay, CARD_TYPE_LABEL } from "@/lib/cards"
import { fetchCardByToken } from "@/lib/cards-server"
import { eventSiteUrl } from "@/lib/site-url"
import CardReveal from "./card-reveal"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const data = await fetchCardByToken(token)
  if (!data) return { title: "Kaart niet gevonden" }

  const display = buildCardDisplay(data.card.type, data.card.template, data.card.content, data.event)
  const parts = [display.dateText, display.location].filter(Boolean).join(" • ")

  return {
    title: `${CARD_TYPE_LABEL[data.card.type]} — ${display.names}`,
    description: parts || display.message,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  }
}

export default async function KaartPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await fetchCardByToken(token)
  if (!data) notFound()

  const { card, event } = data
  const display = buildCardDisplay(card.type, card.template, card.content, event)
  const sc = getStyleConfig(event.style, {
    fontHero:       event.font_hero,
    fontInitials:   event.font_initials,
    fontFrameNames: event.font_frame_names,
    fontPageTitles: event.font_page_titles,
  })

  // Kijkteller (best effort; races zijn hier onbelangrijk)
  const supabase = createServiceClient()
  await supabase.rpc("increment_card_views", { card_token: token }).then(
    () => {},
    () => {}
  )

  const siteLive = event.status === "published"
  const siteUrl = siteLive ? eventSiteUrl(event.slug) : null
  // Scheidingstekens (zoals de | uit "M|L" op de site) horen niet op het zegel
  const initials =
    (event.initials && event.initials.replace(/[|/\\\-·.]/g, "").trim()) ||
    display.names
      .split(/\s*&\s*|\s+en\s+/i)
      .map((n) => n.trim().charAt(0).toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join("")

  return (
    <CardReveal
      display={display}
      initials={initials}
      sc={sc}
      siteUrl={siteUrl}
      rsvpUrl={siteUrl ? `${siteUrl}/RSVP` : null}
    />
  )
}
