"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { PLANS, PLAN_ORDER, isPlan, normalizePlan, upgradePrice, formatEur, type Plan } from "@/lib/plans"

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
  status: string
  plan?: string
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

function Pijl() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}

function Laadicoon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function PaymentCancelled({ event_id, upgrade }: { event_id: string; upgrade: string | null }) {
  const opnieuw = upgrade ? `/betalen?event_id=${event_id}&upgrade=${upgrade}` : `/betalen?event_id=${event_id}`
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
        Je betaling is geannuleerd of niet afgerond. Er is niets verloren: alles staat nog klaar.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Link
          href={opnieuw}
          className="flex-1 inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-2xl hover:-translate-y-0.5 transition-all"
          style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
        >
          Opnieuw proberen
        </Link>
        <Link
          href={upgrade ? "/dashboard" : `/bouwen?event_id=${event_id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-2xl hover:-translate-y-0.5 transition-all"
          style={{ backgroundColor: "#fff", color: BODY, border: `1px solid ${GOLD_LIGHT}` }}
        >
          {upgrade ? "Terug naar dashboard" : "Terug naar builder"}
        </Link>
      </div>
      <Link href="/" className="mt-8 text-sm" style={{ color: `${BODY}60` }}>
        Terug naar home
      </Link>
    </main>
  )
}

// Pakketkeuze: drie kaarten, de gekozen krijgt een gouden rand
function PakketKeuze({ gekozen, onKies }: { gekozen: Plan; onKies: (p: Plan) => void }) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      {PLAN_ORDER.map((p) => {
        const info = PLANS[p]
        const actief = gekozen === p
        return (
          <button
            key={p}
            type="button"
            onClick={() => onKies(p)}
            className="text-left rounded-2xl px-5 py-4 transition-all"
            style={{
              backgroundColor: actief ? "#fff" : "transparent",
              border: `2px solid ${actief ? GOLD : GOLD_LIGHT}`,
              boxShadow: actief ? `0 6px 24px ${GOLD}25` : "none",
              cursor: "pointer",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{info.label}</p>
                <p className="text-xs mt-0.5" style={{ color: BODY }}>{info.subtitel}</p>
              </div>
              <p className="text-base font-bold flex-shrink-0" style={{ color: CHARCOAL }}>{formatEur(info.price)}</p>
            </div>
            {actief && (
              <ul className="mt-3 space-y-1.5 text-xs" style={{ color: BODY }}>
                {info.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span style={{ color: GOLD, fontSize: "0.45rem", marginTop: 5 }}>✦</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </button>
        )
      })}
    </div>
  )
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const event_id   = searchParams.get("event_id")
  const fromMollie = searchParams.get("from") === "mollie"
  const upgradeParam = searchParams.get("upgrade")
  const upgradeTo: Plan | null = isPlan(upgradeParam) ? upgradeParam : null

  const [event, setEvent]               = useState<EventData | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [userEmail, setUserEmail]       = useState<string | null>(null)
  const [paymentOk, setPaymentOk]       = useState<boolean | null>(fromMollie ? null : false)
  const [paying, setPaying]             = useState(false)
  const [activatingFree, setActivatingFree] = useState(false)
  const [payError, setPayError]         = useState(false)

  // Pakketkeuze: uit de URL, anders wat de bezoeker op een landingspagina koos, anders compleet
  const [plan, setPlan] = useState<Plan>(() => {
    const uitUrl = searchParams.get("plan")
    if (isPlan(uitUrl)) return uitUrl
    try {
      const bewaard = localStorage.getItem("sayingyes_plan")
      if (isPlan(bewaard)) return bewaard
    } catch {}
    return "compleet"
  })

  // Discount
  const [codeInput, setCodeInput]       = useState("")
  const [discount, setDiscount]         = useState<DiscountResult | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pollRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptsRef = useRef(0)
  const MAX_ATTEMPTS = 5

  // Na Mollie: wachten tot de webhook het event heeft bijgewerkt
  function pollStatus() {
    if (!event_id) { setPaymentOk(false); setLoadingEvent(false); return }
    fetch(`/api/events/${event_id}`)
      .then(r => r.json())
      .then((data: EventData) => {
        setEvent(data)
        const klaar = upgradeTo
          ? normalizePlan(data.plan) === upgradeTo
          : data.status === "published"
        if (klaar) {
          window.location.href = `/succes?event_id=${event_id}${upgradeTo ? "&upgrade=1" : ""}`
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

  // Kortingscode opnieuw doorrekenen als het pakket wisselt
  function controleerCode(val: string, voorPlan: Plan) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) { setDiscount(null); return }
    setCheckingCode(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/discount?code=${encodeURIComponent(val.trim())}&plan=${voorPlan}`)
        const data: DiscountResult = await res.json()
        setDiscount(data)
      } catch {
        setDiscount({ valid: false, reason: "Kon code niet controleren" })
      } finally {
        setCheckingCode(false)
      }
    }, 500)
  }

  function handleCodeChange(val: string) {
    setCodeInput(val)
    setDiscount(null)
    controleerCode(val, plan)
  }

  function kiesPlan(p: Plan) {
    setPlan(p)
    try { localStorage.setItem("sayingyes_plan", p) } catch {}
    if (codeInput.trim()) { setDiscount(null); controleerCode(codeInput, p) }
  }

  function wisConcept() {
    localStorage.removeItem("sayingyes_draft")
    localStorage.removeItem("sayingyes_content")
    localStorage.removeItem("sayingyes_saved_event_id")
    localStorage.removeItem("sayingyes_plan")
  }

  async function handlePay() {
    if (!event_id || paying) return
    setPaying(true)
    setPayError(false)
    try {
      const body = upgradeTo
        ? { event_id, upgrade_to: upgradeTo }
        : { event_id, plan, ...(discount?.valid && codeInput ? { discount_code: codeInput.trim() } : {}) }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.url) {
        if (!upgradeTo) wisConcept()
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
        body: JSON.stringify({ event_id, code: codeInput.trim(), plan }),
      })
      if (res.ok) {
        wisConcept()
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
  if (fromMollie && paymentOk === false && event_id) return <PaymentCancelled event_id={event_id} upgrade={upgradeParam} />
  if (loadingEvent) return <Spinner />

  // ── Upgrade: alleen het verschil ────────────────────────────────────────
  if (upgradeTo) {
    const huidig = normalizePlan(event?.plan)
    const verschil = upgradePrice(huidig, upgradeTo)
    return (
      <main className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-24">
        <div className="mb-8">
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.25rem", fontWeight: 700, color: CHARCOAL, lineHeight: 1.15 }} className="mb-3">
            Upgrade jullie pakket
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: BODY }}>
            Jullie betalen alleen het verschil. Alles wat jullie al maakten blijft staan.
          </p>
        </div>

        {verschil == null ? (
          <div className="rounded-2xl p-6 text-sm" style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}`, color: BODY }}>
            Dit pakket is geen upgrade ten opzichte van jullie huidige pakket ({PLANS[huidig].label}).{" "}
            <Link href="/dashboard" className="underline" style={{ color: GOLD }}>Terug naar het dashboard</Link>
          </div>
        ) : (
          <>
            <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: `1px solid ${GOLD_LIGHT}` }}>
              <div className="px-5 py-3.5" style={{ backgroundColor: GOLD_BG }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Jouw upgrade</p>
              </div>
              <div className="px-5 py-5" style={{ backgroundColor: "#fff" }}>
                <div className="flex items-center justify-between text-sm mb-1" style={{ color: BODY }}>
                  <span>Huidig: {PLANS[huidig].label}</span>
                  <span>{formatEur(PLANS[huidig].price)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold mb-4" style={{ color: CHARCOAL }}>
                  <span>Nieuw: {PLANS[upgradeTo].label}</span>
                  <span>{formatEur(PLANS[upgradeTo].price)}</span>
                </div>
                <ul className="space-y-1.5 text-xs mb-4" style={{ color: BODY }}>
                  {PLANS[upgradeTo].features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span style={{ color: GOLD, fontSize: "0.45rem", marginTop: 5 }}>✦</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
                  <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Bij te betalen incl. BTW</p>
                  <p className="text-lg font-bold" style={{ color: CHARCOAL }}>{formatEur(verschil)}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full inline-flex items-center justify-center gap-2.5 font-semibold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: paying ? "none" : "0 8px 32px rgba(26,26,26,0.18)" }}
            >
              {paying ? (<><Laadicoon /> Doorsturen naar Mollie...</>) : (<>Betaal {formatEur(verschil)} <Pijl /></>)}
            </button>
            {payError && (
              <p className="text-xs text-center mt-3 text-red-500">
                Er is iets misgegaan. Probeer het opnieuw of mail naar{" "}
                <a href="mailto:info@sayingyes.nl" className="underline">info@sayingyes.nl</a>.
              </p>
            )}
            <p className="text-xs text-center mt-4" style={{ color: "#9A8E82" }}>
              Eenmalige betaling · Geen abonnement · Veilig via Mollie
            </p>
          </>
        )}
        <p className="text-center mt-8">
          <Link href="/dashboard" className="text-sm" style={{ color: `${BODY}80` }}>Terug naar dashboard</Link>
        </p>
      </main>
    )
  }

  // ── Eerste aankoop: pakket kiezen ───────────────────────────────────────
  const basePrice  = PLANS[plan].price
  const isFree     = discount?.valid && discount.type === "free"
  const finalPrice = discount?.valid && discount.finalAmount != null ? discount.finalAmount : basePrice
  const hasDiscount = discount?.valid && finalPrice < basePrice

  return (
    <main className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-24">

      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.25rem", fontWeight: 700, color: CHARCOAL, lineHeight: 1.15 }} className="mb-3">
          Kies jullie pakket
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: BODY }}>
          Begin klein of ga meteen compleet. Upgraden kan later altijd, voor het verschil.
        </p>
      </div>

      <PakketKeuze gekozen={plan} onKies={kiesPlan} />

      {/* Order summary */}
      <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: `1px solid ${GOLD_LIGHT}` }}>
        <div className="px-5 py-3.5" style={{ backgroundColor: GOLD_BG }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>Jouw bestelling</p>
        </div>
        <div className="px-5 py-5" style={{ backgroundColor: "#fff" }}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{PLANS[plan].label}</p>
              {event && (
                <p className="text-xs mt-0.5" style={{ color: BODY }}>
                  {plan === "save_the_date" ? "Kaartlink via sayingyes.nl" : `${event.slug}.sayingyes.nl`}
                </p>
              )}
              <p className="text-xs mt-2" style={{ color: BODY }}>{PLANS[plan].tagline}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {hasDiscount && (
                <p className="text-xs line-through mb-0.5" style={{ color: "#9A8E82" }}>{formatEur(basePrice)}</p>
              )}
              <p className="text-base font-bold" style={{ color: isFree ? "#15803D" : CHARCOAL }}>
                {isFree ? "Gratis" : formatEur(finalPrice)}
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
            <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Totaal incl. BTW</p>
            <p className="text-lg font-bold" style={{ color: isFree ? "#15803D" : CHARCOAL }}>
              {isFree ? "€0,00" : formatEur(finalPrice)}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-center mb-5 leading-relaxed font-semibold" style={{ color: BODY }}>
        Alles blijft aanpasbaar na betaling: teksten, stijl en zelfs jullie webadres. Log in via sayingyes.nl/inloggen om verder te bouwen.
      </p>

      {userEmail && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-5"
          style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: BODY }}>
            Factuur en bevestiging gaan naar{" "}
            <strong style={{ color: CHARCOAL }}>{userEmail}</strong>.
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
            {checkingCode && <span style={{ color: GOLD_LIGHT }}><Laadicoon /></span>}
            {discount?.valid && <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            {discount?.valid === false && <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
          </div>
        </div>
        {discount?.valid && (
          <p className="text-xs mt-1.5 font-semibold text-emerald-600">
            {isFree ? "Gratis activering toegepast!" : `${discount.label} toegepast, je betaalt ${formatEur(finalPrice)}`}
          </p>
        )}
        {discount?.valid === false && codeInput && (
          <p className="text-xs mt-1.5 text-red-500">{discount.reason ?? "Ongeldige kortingscode"}</p>
        )}
      </div>

      {isFree ? (
        <button
          onClick={handleActivateFree}
          disabled={activatingFree}
          className="w-full inline-flex items-center justify-center gap-2.5 font-semibold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          style={{ backgroundColor: "#15803D", color: "#fff", boxShadow: activatingFree ? "none" : "0 8px 32px rgba(21,128,61,0.25)" }}
        >
          {activatingFree ? (<><Laadicoon /> Activeren...</>) : (<>Gratis activeren <Pijl /></>)}
        </button>
      ) : (
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full inline-flex items-center justify-center gap-2.5 font-semibold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: paying ? "none" : "0 8px 32px rgba(26,26,26,0.18)" }}
        >
          {paying ? (<><Laadicoon /> Doorsturen naar Mollie...</>) : (<>Betaal nu {formatEur(finalPrice)} <Pijl /></>)}
        </button>
      )}

      {payError && (
        <p className="text-xs text-center mt-3 text-red-500">
          Er is iets misgegaan. Probeer het opnieuw of mail naar{" "}
          <a href="mailto:info@sayingyes.nl" className="underline">info@sayingyes.nl</a>.
        </p>
      )}

      {!isFree && (
        <>
          <p className="text-xs text-center mt-4" style={{ color: "#9A8E82" }}>
            Eenmalige betaling · Geen abonnement · Veilig via Mollie
          </p>
          <p className="text-xs text-center mt-2 leading-relaxed" style={{ color: "#9A8E82" }}>
            Door te betalen ga je akkoord met onze{" "}
            <Link href="/voorwaarden" className="underline" style={{ color: BODY }}>
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
