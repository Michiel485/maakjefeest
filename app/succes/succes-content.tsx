"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { eventSiteUrl, eventSiteLabel } from "@/lib/site-url"
import { PLANS, normalizePlan, type Plan } from "@/lib/plans"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

interface EventData {
  id: string
  slug: string
  title: string
  type: string
  plan?: string
}

// Teksten per pakket. Eerder toonde de pagina altijd "Je website is live",
// ook na het activeren van een Save the Date (Michiel, 24 september 2026).
const COPY: Record<Plan, { titel: string; tekst: string; primaireKnop: string }> = {
  save_the_date: {
    titel: "Jullie Save the Date is geactiveerd",
    tekst: "De link werkt nu voor je gasten. Kies in je dashboard de kaart en druk op Link voor je gasten; kopieer hem of stuur hem meteen via WhatsApp.",
    primaireKnop: "Naar je dashboard",
  },
  uitnodiging: {
    titel: "Jullie trouwkaart is geactiveerd",
    tekst: "De link werkt nu voor je gasten, en de Save the Date zit erbij. Kies in je dashboard de kaart en druk op Link voor je gasten. Wie antwoordt staat meteen in je gastenlijst.",
    primaireKnop: "Naar je dashboard",
  },
  compleet: {
    titel: "Gefeliciteerd! Je website is live",
    tekst: "Je trouwwebsite staat op internet, en de Save the Date en de trouwkaart zitten erbij. Deel het adres met je gasten.",
    primaireKnop: "Bekijk je website",
  },
}

export default function SuccesContent() {
  const searchParams = useSearchParams()
  const event_id  = searchParams.get("event_id")
  const isUpgrade = searchParams.get("upgrade") === "1"

  const [event, setEvent]         = useState<EventData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [siteLabel, setSiteLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!event_id) { setLoading(false); return }
    fetch(`/api/events/${event_id}`)
      .then((res) => res.json())
      .then((data) => { setEvent(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [event_id])

  useEffect(() => {
    if (!event) return
    setSiteLabel(eventSiteLabel(event.slug, window.location.host))
  }, [event])

  const plan: Plan = normalizePlan(event?.plan)
  const copy = COPY[plan]
  const siteUrl = event ? eventSiteUrl(event.slug) : null
  const whatsappText = event && siteUrl && plan === "compleet"
    ? encodeURIComponent(`Hé! Bekijk onze bruiloftswebsite voor ${event.title} hier: ${siteUrl}`)
    : ""

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="w-8 h-8 animate-spin" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  return (
    <main className="relative z-10 flex flex-col items-center text-center px-6 pt-10 pb-20 max-w-xl mx-auto">

      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
        style={{ backgroundColor: GOLD, boxShadow: `0 12px 32px ${GOLD}40` }}
      >
        <svg className="w-10 h-10" style={{ color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
        {isUpgrade ? "Upgrade gelukt" : "Betaling ontvangen"} · {PLANS[plan].label}
      </p>
      <h1 className="mb-3" style={{ color: CHARCOAL, fontFamily: "var(--font-cormorant)", fontSize: "clamp(2rem, 5vw, 2.6rem)", fontWeight: 600, lineHeight: 1.1 }}>
        {copy.titel}
      </h1>
      <p className="mb-10 leading-relaxed" style={{ color: BODY }}>
        {copy.tekst}
      </p>

      {siteUrl && plan !== "save_the_date" && (
        <div
          className="w-full rounded-2xl p-6 mb-8"
          style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}`, boxShadow: `0 4px 20px ${GOLD}15` }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: `${BODY}70` }}>
            {plan === "compleet" ? "Jouw website" : "RSVP-pagina voor jullie gasten"}
          </p>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-bold break-all transition-colors"
            style={{ color: GOLD }}
          >
            {siteLabel}
          </a>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {plan === "compleet" && siteUrl ? (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-2xl hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {copy.primaireKnop}
          </a>
        ) : (
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-2xl hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
          >
            {copy.primaireKnop}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        )}
        {whatsappText && (
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-2xl hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: "#25D366", color: "#fff", boxShadow: "0 4px 16px rgba(37,211,102,0.25)" }}
          >
            Deel via WhatsApp
          </a>
        )}
      </div>

      {plan === "compleet" && (
        <Link href="/dashboard" className="mt-4 text-sm font-semibold underline underline-offset-2" style={{ color: CHARCOAL }}>
          Naar je dashboard
        </Link>
      )}

      <ul className="mt-8 w-full text-left list-none p-0 m-0 flex flex-col gap-2.5 rounded-2xl px-5 py-4 text-sm leading-relaxed" style={{ backgroundColor: "#FBF5E8", border: `1px solid ${GOLD_LIGHT}`, color: BODY }}>
        <li><b style={{ color: CHARCOAL }}>Aanpassen kan altijd.</b> Ook na het versturen: je gasten zien de nieuwe versie zodra ze de link opnieuw openen.</li>
        <li><b style={{ color: CHARCOAL }}>Je gastenlijst vult zichzelf.</b> Wie antwoordt staat meteen in je dashboard.</li>
        {plan !== "compleet" && (
          <li><b style={{ color: CHARCOAL }}>Later meer nodig?</b> Dan betaal je alleen het verschil. Alles wat jullie maakten blijft staan.</li>
        )}
      </ul>

      <Link
        href="/"
        className="mt-8 text-sm transition-colors"
        style={{ color: `${BODY}60` }}
      >
        Terug naar home
      </Link>
    </main>
  )
}
