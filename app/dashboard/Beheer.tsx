import Link from "next/link"
import { eventSiteUrl, eventSiteLabel } from "@/lib/site-url"
import SlugEditor from "./SlugEditor"
import DeleteDraftButton from "./DeleteDraftButton"
import RenewalButton from "./RenewalButton"
import DeleteEventButton from "./DeleteEventButton"
import { PLANS, PLAN_ORDER, normalizePlan, planAllows, planRank, renewalAllowed, upgradePrice, formatEur } from "@/lib/plans"

// Het beheer van een ontwerp: wat er live staat, verlengen, het adres
// wijzigen, weggooien. Stond in het dashboard zelf; daar staat nu alleen nog
// wat belangrijk is, en dit staat onderaan als "Beheer".

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"
const SOFT       = "#9A8E82"

export type Event = {
  id: string
  slug: string
  title: string
  type: string
  status: string
  datum?: string | null
  locatie?: string | null
  plan?: string | null
  created_at: string
  expires_at: string | null
  hero_image_url?: string | null
}

// Upgrade-knoppen naar elk hoger pakket, met het bij te betalen bedrag
export function UpgradeLinks({ event }: { event: Event }) {
  const huidig = normalizePlan(event.plan)
  const hoger = PLAN_ORDER.filter((p) => planRank(p) > planRank(huidig))
  if (hoger.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {hoger.map((p) => {
        const bedrag = upgradePrice(huidig, p)
        return (
          <Link
            key={p}
            href={`/betalen?event_id=${event.id}&upgrade=${p}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}` }}
          >
            Upgrade naar {PLANS[p].label}{bedrag != null ? ` (+${formatEur(bedrag)})` : ""}
          </Link>
        )
      })}
    </div>
  )
}

const TYPE_LABEL: Record<string, string> = {
  bruiloft: "Bruiloft",
  verjaardag: "Verjaardag",
  evenement: "Evenement",
}

export function EventCard({ event, isDraft = false }: { event: Event; isDraft?: boolean }) {
  const typeLabel = TYPE_LABEL[event.type] ?? event.type
  const date = new Date(event.created_at).toLocaleDateString("nl-NL", {
    day: "numeric", month: "long", year: "numeric",
  })

  const expiresAt           = event.expires_at ? new Date(event.expires_at) : null
  const now                 = new Date()
  const daysUntilExpiry     = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
  const isSubscriptionExpired = event.status === "expired" || (daysUntilExpiry !== null && daysUntilExpiry <= 0)
  const isExpiringSoon      = !isSubscriptionExpired && daysUntilExpiry !== null && daysUntilExpiry <= 30

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-4 md:p-6"
      style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
    >
      {/* Text section */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>{typeLabel}</span>
          {!isDraft && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}` }}>
              {PLANS[normalizePlan(event.plan)].label}
            </span>
          )}
          {isDraft ? (
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
              Concept
            </span>
          ) : isSubscriptionExpired ? (
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
              Verlopen
            </span>
          ) : isExpiringSoon ? (
            <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
              Verloopt binnenkort
            </span>
          ) : (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </div>
        <h3
          className={planAllows(event.plan, "rsvp") ? "text-lg font-mono" : "text-lg"}
          style={{ fontWeight: 700, color: CHARCOAL }}
        >
          {planAllows(event.plan, "rsvp") ? `${event.slug}.sayingyes.nl` : event.title}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: BODY }}>Opgeslagen op {date}</p>
        {!isDraft && !renewalAllowed(event.plan) && (
          <p className="text-xs mt-0.5" style={{ color: BODY }}>
            Geen einddatum, jullie kaartlink blijft werken
          </p>
        )}
        {!isDraft && renewalAllowed(event.plan) && (
          <p className="text-xs mt-0.5" style={{ color: isSubscriptionExpired ? "#b45309" : isExpiringSoon ? "#b45309" : BODY }}>
            {!expiresAt
              ? "Vervaldatum niet ingesteld"
              : isSubscriptionExpired
              ? `Verlopen op ${expiresAt.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}`
              : `Geldig tot ${expiresAt.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}${isExpiringSoon ? `, nog ${daysUntilExpiry} dagen` : ""}`
            }
          </p>
        )}
        {/* Het webadres is alleen relevant als er een publieke pagina bij hoort */}
        {planAllows(event.plan, "rsvp") && (
          <div className="mt-2">
            <SlugEditor eventId={event.id} currentSlug={event.slug} isLive={!isDraft} />
          </div>
        )}
        {!isDraft && <UpgradeLinks event={event} />}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 md:flex-shrink-0 md:min-w-[200px]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          {isDraft && (
            <DeleteDraftButton eventId={event.id} />
          )}
          {!isDraft && !isSubscriptionExpired && planAllows(event.plan, "rsvp") && (
            <a
              href={eventSiteUrl(event.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-center py-2 md:py-0 transition-colors"
              style={{ color: BODY }}
              title={eventSiteLabel(event.slug)}
            >
              {planAllows(event.plan, "site") ? "Bekijken →" : "Bekijk RSVP-pagina →"}
            </a>
          )}
          {!isDraft && renewalAllowed(event.plan) && (
            <RenewalButton eventId={event.id} />
          )}
          <Link
            href={planAllows(event.plan, "site") ? `/bouwen?event_id=${event.id}` : `/kaart-maken?event_id=${event.id}`}
            className="text-sm font-semibold px-4 py-3 md:py-2 rounded-xl text-center transition-all hover:-translate-y-0.5 w-full md:w-auto"
            style={{ backgroundColor: CHARCOAL, color: IVORY }}
          >
            {planAllows(event.plan, "site") ? "Verder bewerken" : "Ontwerp aanpassen"}
          </Link>
        </div>
        {!isDraft && (
          <div className="flex flex-wrap items-center gap-4 pt-1" style={{ borderTop: `1px solid #E8D5A3` }}>
            <DeleteEventButton eventId={event.id} />
          </div>
        )}
      </div>
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-semibold uppercase tracking-[0.18em]"
      style={{ color: GOLD }}
    >
      {children}
    </h2>
  )
}

