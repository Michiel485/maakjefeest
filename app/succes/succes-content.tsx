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

// Teksten per pakket
const COPY: Record<Plan, { titel: string; tekst: string; primaireKnop: string }> = {
  save_the_date: {
    titel: "Jullie Save the Date staat klaar!",
    tekst: "Je betaling is ontvangen. Maak in het dashboard jullie Save the Date, kopieer de link en verstuur hem via WhatsApp naar jullie gasten.",
    primaireKnop: "Maak jullie Save the Date",
  },
  uitnodiging: {
    titel: "Jullie uitnodiging en RSVP staan klaar!",
    tekst: "Je betaling is ontvangen. Maak per gastengroep een trouwkaart in het dashboard; gasten reageren via jullie RSVP-pagina en jullie zien alles terug in het overzicht.",
    primaireKnop: "Maak jullie trouwkaarten",
  },
  compleet: {
    titel: "Gefeliciteerd! Je website is live!",
    tekst: "Je betaling is ontvangen en je trouwwebsite staat klaar. Deel hem met je gasten!",
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
      <h1 className="text-3xl font-extrabold mb-3" style={{ color: CHARCOAL }}>
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

      {plan !== "compleet" && (
        <p className="mt-6 text-xs leading-relaxed" style={{ color: "#9A8E82" }}>
          Later meer nodig? In het dashboard upgrade je naar een hoger pakket en betaal je alleen het verschil. Alles wat jullie maakten blijft staan.
        </p>
      )}

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
