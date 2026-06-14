"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

interface EventData {
  id: string
  slug: string
  title: string
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <svg className="w-8 h-8 animate-spin" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  )
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const event_id = searchParams.get("event_id")

  const [event, setEvent]       = useState<EventData | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [paying, setPaying]     = useState(false)
  const [payError, setPayError] = useState(false)

  useEffect(() => {
    if (!event_id) { setLoadingEvent(false); return }
    fetch(`/api/events/${event_id}`)
      .then(res => res.json())
      .then(data => { setEvent(data); setLoadingEvent(false) })
      .catch(() => setLoadingEvent(false))
  }, [event_id])

  async function handlePay() {
    if (!event_id || paying) return
    setPaying(true)
    setPayError(false)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id }),
      })
      const json = await res.json()
      if (json.url) {
        localStorage.removeItem("sayingyes_draft")
        localStorage.removeItem("sayingyes_content")
        localStorage.removeItem("sayingyes_saved_event_id")
        window.location.href = json.url
      } else {
        setPayError(true)
        setPaying(false)
      }
    } catch {
      setPayError(true)
      setPaying(false)
    }
  }

  if (loadingEvent) return <Spinner />

  return (
    <main className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-24">

      <div className="mb-8">
        <h1
          className="mb-3"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.25rem", fontWeight: 700, color: CHARCOAL, lineHeight: 1.15 }}
        >
          Bevestig je bestelling
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: BODY }}>
          Bekijk hieronder wat je afneemt voordat je doorgaat naar de betaling.
        </p>
      </div>

      {/* Order summary */}
      <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: `1px solid ${GOLD_LIGHT}` }}>
        <div className="px-5 py-3.5" style={{ backgroundColor: GOLD_BG }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
            Jouw bestelling
          </p>
        </div>

        <div className="px-5 py-5" style={{ backgroundColor: "#fff" }}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                Bruiloftswebsite — 1 jaar live
              </p>
              {event && (
                <p className="text-xs mt-0.5" style={{ color: BODY }}>
                  {event.slug}.sayingyes.nl
                </p>
              )}
              <ul className="mt-3 space-y-1.5 text-xs" style={{ color: BODY }}>
                {[
                  "Eigen subdomein (1 jaar online)",
                  "Onbeperkte RSVP-aanmeldingen",
                  "Fotogalerij & programma",
                  "Altijd aanpasbaar via de builder",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span style={{ color: GOLD, fontSize: "0.45rem" }}>✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-base font-bold flex-shrink-0" style={{ color: CHARCOAL }}>
              €49,99
            </p>
          </div>

          <div
            className="pt-4 flex items-center justify-between"
            style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}
          >
            <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
              Totaal incl. BTW
            </p>
            <p className="text-lg font-bold" style={{ color: CHARCOAL }}>
              €49,99
            </p>
          </div>
        </div>
      </div>

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={paying}
        className="w-full inline-flex items-center justify-center gap-2.5 font-semibold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
        style={{
          backgroundColor: CHARCOAL,
          color: IVORY,
          boxShadow: paying ? "none" : "0 8px 32px rgba(26,26,26,0.18)",
        }}
      >
        {paying ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Doorsturen naar Mollie...
          </>
        ) : (
          <>
            Betaal nu €49,99
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </>
        )}
      </button>

      {payError && (
        <p className="text-xs text-center mt-3 text-red-500">
          Er is iets misgegaan. Probeer het opnieuw of neem contact op via{" "}
          <a href="mailto:info@sayingyes.nl" className="underline">info@sayingyes.nl</a>.
        </p>
      )}

      <p className="text-xs text-center mt-4" style={{ color: "#9A8E82" }}>
        Eenmalige betaling · Geen abonnement · Veilig via Mollie
      </p>
      <p className="text-xs text-center mt-2 leading-relaxed" style={{ color: "#9A8E82" }}>
        Door te betalen bevestig je akkoord met onze{" "}
        <Link href="/voorwaarden" className="underline transition-opacity hover:opacity-70" style={{ color: BODY }}>
          Algemene Voorwaarden
        </Link>
        .
      </p>

    </main>
  )
}

export default function BetalenPage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: IVORY }}>
      <header
        className="relative z-10 flex items-center justify-between px-8 py-5 max-w-md mx-auto"
        style={{ borderBottom: `1px solid ${GOLD_LIGHT}` }}
      >
        <Link
          href="/"
          className="tracking-wide transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem", fontWeight: 600, color: CHARCOAL }}
        >
          SayingYes
        </Link>
      </header>
      <Suspense fallback={<Spinner />}>
        <CheckoutContent />
      </Suspense>
    </div>
  )
}
