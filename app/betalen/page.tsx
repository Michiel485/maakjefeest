"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

const BASE_PRICE = 49.99

interface EventData {
  id: string
  slug: string
  title: string
  status: string
}

interface DiscountResult {
  valid: boolean
  type?: "free" | "fixed" | "percentage"
  finalAmount?: number
  label?: string
  reason?: string
}

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <svg className="w-8 h-8 animate-spin" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {label && <p className="text-sm" style={{ color: BODY }}>{label}</p>}
    </div>
  )
}

function PaymentCancelled({ event_id }: { event_id: string }) {
  return (
    <main className="relative z-10 flex flex-col items-center text-center px-6 pt-10 pb-20 max-w-xl mx-auto">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
        style={{ backgroundColor: "#FEF2F2", border: "2px solid #FECACA" }}
      >
        <svg className="w-9 h-9 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: CHARCOAL }}>Betaling niet voltooid</h1>
      <p className="mb-10 leading-relaxed text-sm" style={{ color: BODY }}>
        Je betaling is geannuleerd of niet afgerond. Je website staat nog klaar in de builder.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Link
          href={`/betalen?event_id=${event_id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-2xl hover:-translate-y-0.5 transition-all"
          style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
        >
          Opnieuw proberen
        </Link>
        <Link
          href={`/bouwen?event_id=${event_id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-2xl hover:-translate-y-0.5 transition-all"
          style={{ backgroundColor: "#fff", color: BODY, border: `1px solid ${GOLD_LIGHT}` }}
        >
          Terug naar builder
        </Link>
      </div>
      <Link href="/" className="mt-8 text-sm transition-colors" style={{ color: `${BODY}60` }}
        onMouseEnter={e => (e.currentTarget.style.color = BODY)}
        onMouseLeave={e => (e.currentTarget.style.color = `${BODY}60`)}
      >
        Terug naar home
      </Link>
    </main>
  )
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const event_id   = searchParams.get("event_id")
  const fromMollie = searchParams.get("from") === "mollie"

  const [event, setEvent]               = useState<EventData | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [userEmail, setUserEmail]       = useState<string | null>(null)
  const [paymentOk, setPaymentOk]       = useState<boolean | null>(fromMollie ? null : false)
  const [paying, setPaying]             = useState(false)
  const [activatingFree, setActivatingFree] = useState(false)
  const [payError, setPayError]         = useState(false)

  // Discount
  const [codeInput, setCodeInput]       = useState("")
  const [discount, setDiscount]         = useState<DiscountResult | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pollRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptsRef = useRef(0)
  const MAX_ATTEMPTS = 5

  function pollStatus() {
    if (!event_id) { setPaymentOk(false); setLoadingEvent(false); return }
    fetch(`/api/events/${event_id}`)
      .then(r => r.json())
      .then((data: EventData) => {
        setEvent(data)
        if (data.status === "published") {
          window.location.href = `/succes?event_id=${event_id}`
        } else if (attemptsRef.current < MAX_ATTEMPTS) {
          attemptsRef.current++
          pollRef.current = setTimeout(pollStatus, 2000)
        } else {
          setPaymentOk(false)
          setLoadingEvent(false)
        }
      })
      .catch(() => {
        if (attemptsRef.current < MAX_ATTEMPTS) {
          attemptsRef.current++
          pollRef.current = setTimeout(pollStatus, 2000)
        } else {
          setPaymentOk(false)
          setLoadingEvent(false)
        }
      })
  }

  function fetchEvent() {
    if (!event_id) { setLoadingEvent(false); return }
    fetch(`/api/events/${event_id}`)
      .then(r => r.json())
      .then((data: EventData) => { setEvent(data); setLoadingEvent(false) })
      .catch(() => setLoadingEvent(false))
  }

  useEffect(() => {
    if (fromMollie) pollStatus(); else fetchEvent()
    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event_id])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  function handleCodeChange(val: string) {
    setCodeInput(val)
    setDiscount(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) return
    setCheckingCode(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/discount?code=${encodeURIComponent(val.trim())}`)
        const data: DiscountResult = await res.json()
        setDiscount(data)
      } catch {
        setDiscount({ valid: false, reason: "Kon code niet controleren" })
      } finally {
        setCheckingCode(false)
      }
    }, 500)
  }

  async function handlePay() {
    if (!event_id || paying) return
    setPaying(true)
    setPayError(false)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id,
          ...(discount?.valid && codeInput ? { discount_code: codeInput.trim() } : {}),
        }),
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

  async function handleActivateFree() {
    if (!event_id || activatingFree || !discount?.valid || discount.type !== "free") return
    setActivatingFree(true)
    setPayError(false)
    try {
      const res = await fetch("/api/activate-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id, code: codeInput.trim() }),
      })
      if (res.ok) {
        localStorage.removeItem("sayingyes_draft")
        localStorage.removeItem("sayingyes_content")
        localStorage.removeItem("sayingyes_saved_event_id")
        window.location.href = `/succes?event_id=${event_id}`
      } else {
        setPayError(true)
        setActivatingFree(false)
      }
    } catch {
      setPayError(true)
      setActivatingFree(false)
    }
  }

  if (fromMollie && paymentOk === null) return <Spinner label="Betaling wordt geverifieerd..." />
  if (fromMollie && paymentOk === false && event_id) return <PaymentCancelled event_id={event_id} />
  if (loadingEvent) return <Spinner />

  const isFree     = discount?.valid && discount.type === "free"
  const finalPrice = discount?.valid && discount.finalAmount != null ? discount.finalAmount : BASE_PRICE
  const hasDiscount = discount?.valid && finalPrice < BASE_PRICE

  return (
    <main className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-24">

      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.25rem", fontWeight: 700, color: CHARCOAL, lineHeight: 1.15 }} className="mb-3">
          Bevestig je bestelling
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: BODY }}>
          Bekijk hieronder wat je afneemt voordat je doorgaat naar de betaling.
        </p>
      </div>

      {/* Order summary */}
      <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: `1px solid ${GOLD_LIGHT}` }}>
        <div className="px-5 py-3.5" style={{ backgroundColor: GOLD_BG }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Jouw bestelling</p>
        </div>
        <div className="px-5 py-5" style={{ backgroundColor: "#fff" }}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Bruiloftswebsite — 1 jaar live</p>
              {event && <p className="text-xs mt-0.5" style={{ color: BODY }}>{event.slug}.sayingyes.nl</p>}
              <ul className="mt-3 space-y-1.5 text-xs" style={{ color: BODY }}>
                {["Eigen subdomein (1 jaar online)", "Onbeperkte RSVP-aanmeldingen", "Fotogalerij & programma", "Altijd aanpasbaar via de builder"].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span style={{ color: GOLD, fontSize: "0.45rem" }}>✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-right flex-shrink-0">
              {hasDiscount && (
                <p className="text-xs line-through mb-0.5" style={{ color: "#9A8E82" }}>€{BASE_PRICE.toFixed(2).replace(".", ",")}</p>
              )}
              <p className="text-base font-bold" style={{ color: isFree ? "#15803D" : CHARCOAL }}>
                {isFree ? "Gratis" : `€${finalPrice.toFixed(2).replace(".", ",")}`}
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
            <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Totaal incl. BTW</p>
            <p className="text-lg font-bold" style={{ color: isFree ? "#15803D" : CHARCOAL }}>
              {isFree ? "€0,00" : `€${finalPrice.toFixed(2).replace(".", ",")}`}
            </p>
          </div>
        </div>
      </div>

      {/* Email confirmation */}
      {userEmail && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-5"
          style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: BODY }}>
            Factuur en bevestiging worden verstuurd naar{" "}
            <strong style={{ color: CHARCOAL }}>{userEmail}</strong>.{" "}
            Klopt dit niet?{" "}
            <Link href="/dashboard" className="underline transition-opacity hover:opacity-70" style={{ color: GOLD }}>
              Pas je account aan
            </Link>
            .
          </p>
        </div>
      )}

      {/* Discount code */}
      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
          Kortingscode
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="bijv. VRIEND2025"
            value={codeInput}
            onChange={e => handleCodeChange(e.target.value)}
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none uppercase tracking-wider"
            style={{ borderColor: discount?.valid ? "#10b981" : discount?.valid === false ? "#ef4444" : GOLD_LIGHT, color: CHARCOAL }}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {checkingCode && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: GOLD_LIGHT }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {discount?.valid && <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            {discount?.valid === false && <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
          </div>
        </div>
        {discount?.valid && (
          <p className="text-xs mt-1.5 font-semibold text-emerald-600">
            {isFree ? "Gratis activering toegepast!" : `${discount.label} toegepast — je betaalt €${finalPrice.toFixed(2).replace(".", ",")}`}
          </p>
        )}
        {discount?.valid === false && codeInput && (
          <p className="text-xs mt-1.5 text-red-500">{discount.reason ?? "Ongeldige kortingscode"}</p>
        )}
      </div>

      {/* CTA button */}
      {isFree ? (
        <button
          onClick={handleActivateFree}
          disabled={activatingFree}
          className="w-full inline-flex items-center justify-center gap-2.5 font-semibold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          style={{ backgroundColor: "#15803D", color: "#fff", boxShadow: activatingFree ? "none" : "0 8px 32px rgba(21,128,61,0.25)" }}
        >
          {activatingFree ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Activeren...
            </>
          ) : (
            <>
              Gratis activeren
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full inline-flex items-center justify-center gap-2.5 font-semibold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: paying ? "none" : "0 8px 32px rgba(26,26,26,0.18)" }}
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
              Betaal nu €{finalPrice.toFixed(2).replace(".", ",")}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </>
          )}
        </button>
      )}

      {payError && (
        <p className="text-xs text-center mt-3 text-red-500">
          Er is iets misgegaan. Probeer het opnieuw of neem contact op via{" "}
          <a href="mailto:info@sayingyes.nl" className="underline">info@sayingyes.nl</a>.
        </p>
      )}

      {!isFree && (
        <>
          <p className="text-xs text-center mt-4" style={{ color: "#9A8E82" }}>
            Eenmalige betaling · Geen abonnement · Veilig via Mollie
          </p>
          <p className="text-xs text-center mt-2 leading-relaxed" style={{ color: "#9A8E82" }}>
            Door te betalen bevestig je akkoord met onze{" "}
            <Link href="/voorwaarden" className="underline transition-opacity hover:opacity-70" style={{ color: BODY }}>
              Algemene Voorwaarden
            </Link>.
          </p>
        </>
      )}
    </main>
  )
}

export default function BetalenPage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: IVORY }}>
      <header className="relative z-10 flex items-center justify-between px-8 py-5 max-w-md mx-auto" style={{ borderBottom: `1px solid ${GOLD_LIGHT}` }}>
        <Link href="/" className="tracking-wide transition-opacity hover:opacity-70" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem", fontWeight: 600, color: CHARCOAL }}>
          SayingYes
        </Link>
      </header>
      <Suspense fallback={<Spinner />}>
        <CheckoutContent />
      </Suspense>
    </div>
  )
}
