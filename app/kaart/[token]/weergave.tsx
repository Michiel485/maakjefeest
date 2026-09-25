// Wat een gast of het bruidspaar te zien krijgt zodra vaststaat dat het mag.
// Gedeeld door de publieke kaartlink en de voorbeeldweergave voor de eigenaar.
//
// Waarom twee routes en niet een: de publieke pagina is gecached, en een
// gecachte pagina mag geen cookie lezen. Next weigert dat met "page changed
// from static to dynamic at runtime". De eigenaarscontrole hoort dus in een
// eigen, ongecachte route. Dat is ook logisch: honderd gasten openen dezelfde
// link, het bruidspaar kijkt een keer.

import Link from "next/link"
import { getStyleConfig, isStyle } from "@/lib/event-styles"
import { kaartKleuren } from "@/lib/kaart-paletten"
import { buildCardDisplay } from "@/lib/cards"
import type { CardWithEvent } from "@/lib/cards-server"
import { eventSiteUrl } from "@/lib/site-url"
import { planAllows, PLANS, normalizePlan, formatEur } from "@/lib/plans"
import { aanmeldStand } from "@/lib/gasten"
import CardReveal from "./card-reveal"
import KaartKijkTeller from "@/components/KaartKijkTeller"

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

export function KaartWeergave({
  data,
  isEigenaar,
  telMee = false,
}: {
  data: CardWithEvent
  isEigenaar: boolean
  // Alleen de publieke kaartlink telt mee in de kijkteller; een voorbeeld niet
  telMee?: boolean
}) {
  const { card, event } = data
  const display = buildCardDisplay(card.type, card.template, card.content, event)
  // De kleuren van de kaart: die van de website, of een eigen palet
  const sc = kaartKleuren(getStyleConfig(isStyle(card.content.stijl) ? card.content.stijl : event.style, {
    fontHero:       event.font_hero,
    fontInitials:   event.font_initials,
    fontFrameNames: event.font_frame_names,
    fontPageTitles: event.font_page_titles,
  }), card.content.kleur)

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
      .split(/\s*&\s*|\s+en\s+|\r?\n/i)
      .map((n) => n.trim().charAt(0).toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join("")

  return (
    <>
      {telMee && <KaartKijkTeller token={card.share_token} />}
      <CardReveal
        display={display}
        initials={initials}
        sc={sc}
        siteUrl={siteUrl}
        rsvpUrl={rsvpUrl}
        agendaUrl={event.datum ? `/kaart/${card.share_token}/agenda` : null}
        aanmeldStand={aanmeldStand(card.content.aanmelden)}
        bronToken={card.share_token}
        previewNotice={isEigenaar}
        siteVolgt={heeftSite && !siteLive}
      />
    </>
  )
}

export { NogNietActief }
