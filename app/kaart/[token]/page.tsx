export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { getStyleConfig } from "@/lib/event-styles"
import { buildCardDisplay, CARD_TYPE_LABEL } from "@/lib/cards"
import { fetchCardByToken } from "@/lib/cards-server"
import { eventSiteUrl } from "@/lib/site-url"
import { planAllows, PLANS, normalizePlan, formatEur } from "@/lib/plans"
import CardReveal from "./card-reveal"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const data = await fetchCardByToken(token)
  if (!data) return { title: "Kaart niet gevonden" }

  const geenIndex = { index: false, follow: false, googleBot: { index: false, follow: false } }

  // Nog niet geactiveerd: geen namen, datum of locatie prijsgeven, ook niet in
  // de voorvertoning die WhatsApp of Facebook van de link maakt.
  if (data.event.status !== "published" && data.event.status !== "expired") {
    return { title: "Kaart nog niet verstuurd", description: "Deze kaart is nog niet geactiveerd.", robots: geenIndex }
  }

  const display = buildCardDisplay(data.card.type, data.card.template, data.card.content, data.event)
  const parts = [display.dateText, display.location].filter(Boolean).join(" • ")

  return {
    title: `${CARD_TYPE_LABEL[data.card.type]} van ${display.names}`,
    description: parts || display.message,
    robots: geenIndex,
  }
}

// Nog niet betaald en niet de eigenaar: de kaartlink is het product, dus die
// werkt pas na activeren. Het bruidspaar zelf ziet wel een voorbeeld.
function NogNietActief({ plan }: { plan: string | null }) {
  const info = PLANS[normalizePlan(plan)]
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#FAF7F2" }}>
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#C5A059" }}>
          SayingYes
        </p>
        <h1 className="mb-3" style={{ fontFamily: "var(--font-cormorant)", fontSize: "2rem", fontWeight: 700, color: "#1A1A1A" }}>
          Deze kaart is nog niet verstuurd
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#5C5248" }}>
          Het bruidspaar werkt er nog aan. Zodra de kaart is geactiveerd, opent hier de envelop.
        </p>
        <Link
          href="/digitale-uitnodiging"
          className="inline-flex text-sm font-semibold px-6 py-3 rounded-xl"
          style={{ backgroundColor: "#1A1A1A", color: "#FAF7F2", textDecoration: "none" }}
        >
          Zelf zo&apos;n kaart maken vanaf {formatEur(info.price).replace(",00", "")}
        </Link>
      </div>
    </div>
  )
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

  // Is de kaart betaald? Zo niet, dan mag alleen het bruidspaar hem bekijken.
  const isBetaald = event.status === "published" || event.status === "expired"
  let isEigenaar = false
  if (!isBetaald) {
    try {
      const auth = await createClient()
      const { data: { user } } = await auth.auth.getUser()
      isEigenaar = Boolean(user?.email && user.email === event.user_email)
    } catch {
      isEigenaar = false
    }
    if (!isEigenaar) return <NogNietActief plan={event.plan} />
  }

  const display = buildCardDisplay(card.type, card.template, card.content, event)
  const sc = getStyleConfig(event.style, {
    fontHero:       event.font_hero,
    fontInitials:   event.font_initials,
    fontFrameNames: event.font_frame_names,
    fontPageTitles: event.font_page_titles,
  })

  // Kijkteller: alleen echte gasten tellen, geen eigen voorbeelden
  if (isBetaald) {
    const supabase = createServiceClient()
    await supabase.rpc("increment_card_views", { card_token: token }).then(
      () => {},
      () => {}
    )
  }

  // Knoppen onder de kaart volgen het pakket: Save the Date toont geen knoppen,
  // Uitnodiging & RSVP alleen de RSVP-knop, Compleet ook de site zelf.
  // De kaart blijft altijd werken, ook als een site is verlopen; de knoppen
  // naar die site verdwijnen dan wel, want die pagina's zijn offline.
  const siteLive = event.status === "published"
  const heeftSite = planAllows(event.plan, "site")
  const siteUrl = siteLive && heeftSite ? eventSiteUrl(event.slug) : null
  // Bij Uitnodiging & RSVP staat het formulier op de enige pagina die er is
  const rsvpUrl = siteLive && planAllows(event.plan, "rsvp")
    ? heeftSite ? `${eventSiteUrl(event.slug)}/RSVP` : `${eventSiteUrl(event.slug)}#rsvp`
    : null
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
      rsvpUrl={rsvpUrl}
      previewNotice={isEigenaar}
      siteVolgt={heeftSite && !siteLive}
    />
  )
}
