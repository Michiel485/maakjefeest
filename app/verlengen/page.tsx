"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

const BASE_PRICE = 22.00

interface DiscountResult {
  valid: boolean
  type?: "free" | "fixed" | "percentage"
  finalAmount?: number
  label?: string
  reason?: string
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

function RenewalContent() {
  const searchParams = useSearchParams()
  const event_id = searchParams.get("event_id")

  const [eventSlug, setEventSlug] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState("")
  const [discount, setDiscount]   = useState<DiscountResult | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)
  const [paying, setPaying]       = useState(false)
  const [payError, setPayError]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!event_id) return
    fetch(`/api/events/${event_id}`)
      .then(r => r.json())
      .then(data => { if (data.slug) setEventSlug(data.slug) })
      .catch(() => {})
  }, [event_id])

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
        // "free" codes don't apply to renewals
        if (data.valid && data.type === "free") {
          setDiscount({ valid: false, reason: "Deze code is niet geldig voor verlengingen" })
        } else {
          setDiscount(data)
        }
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
      const res = await fetch("/api/checkout/renewal", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          event_id,
          ...(discount?.valid && codeInput ? { discount_code: codeInput.trim() } : {}),
        }),
      })
      const json = await res.json()
      if (json.url) {
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

  const finalPrice  = discount?.valid && discount.finalAmount != null ? discount.finalAmount : BASE_PRICE
  const hasDiscount = discount?.valid && finalPrice < BASE_PRICE

  return (
    <main className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-24">

      <div className="mb-8">
        <Link href="/dashboard" className="text-sm mb-6 inline-flex items-center gap-1.5 transition-colors" style={{ color: `${BODY}80` }}>
          ← Terug naar dashboard
        </Link>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.25rem", fontWeight: 700, color: CHARCOAL, lineHeight: 1.15 }} className="mb-3 mt-4">
          Verleng jullie abonnement
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: BODY }}>
          Verleng met 6 maanden en houd jullie bruiloftswebsite online.
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
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Verlenging — 6 maanden extra</p>
              {eventSlug && (
                <p className="text-xs mt-0.5" style={{ color: BODY }}>{eventSlug}.sayingyes.nl</p>
              )}
              <ul className="mt-3 space-y-1.5 text-xs" style={{ color: BODY }}>
                {[
                  "6 maanden langer online",
                  "Alle inhoud en RSVP's blijven behouden",
                  "Onbeperkt aanpasbaar via de builder",
                  "Nieuwe einddatum direct zichtbaar in dashboard",
                ].map(item => (
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
              <p className="text-base font-bold" style={{ color: CHARCOAL }}>
                €{finalPrice.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
            <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Totaal incl. BTW</p>
            <p className="text-lg font-bold" style={{ color: CHARCOAL }}>
              €{finalPrice.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
      </div>

      {/* Discount code */}
      <div className="mb-6">
        <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: GOLD }}>
          Kortingscode
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={codeInput}
            onChange={e => handleCodeChange(e.target.value.toUpperCase())}
            placeholder="CODE"
            className="flex-1 px-4 py-3 rounded-xl text-sm font-mono uppercase outline-none transition-all"
            style={{
              border: `1.5px solid ${discount?.valid ? "#16A34A" : discount?.valid === false && codeInput ? "#DC2626" : GOLD_LIGHT}`,
              backgroundColor: "#fff",
              color: CHARCOAL,
            }}
          />
        </div>
        {checkingCode && (
          <p className="text-xs mt-2" style={{ color: BODY }}>Controleren...</p>
        )}
        {!checkingCode && discount?.valid && (
          <p className="text-xs mt-2 font-medium" style={{ color: "#16A34A" }}>
            ✓ {discount.label ?? `Korting toegepast`}
          </p>
        )}
        {!checkingCode && discount?.valid === false && codeInput && (
          <p className="text-xs mt-2" style={{ color: "#DC2626" }}>
            {discount.reason ?? "Ongeldige kortingscode"}
          </p>
        )}
      </div>

      {/* Pay button */}
      {payError && (
        <p className="text-sm mb-4 text-center" style={{ color: "#DC2626" }}>
          Er ging iets mis. Probeer het opnieuw.
        </p>
      )}
      <button
        onClick={handlePay}
        disabled={paying || !event_id}
        className="w-full font-bold py-4 rounded-2xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        style={{
          backgroundColor: CHARCOAL,
          color: IVORY,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}
      >
        {paying ? "Doorsturen naar betaling..." : `Betalen — €${finalPrice.toFixed(2).replace(".", ",")}`}
      </button>

      <p className="text-xs text-center mt-4" style={{ color: `${BODY}80` }}>
        Betaling verloopt veilig via Mollie. Na betaling wordt jullie website direct verlengd.
      </p>
    </main>
  )
}

export default function VerlengenPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: IVORY }}>
      <Suspense fallback={<Spinner />}>
        <RenewalContent />
      </Suspense>
    </div>
  )
}
