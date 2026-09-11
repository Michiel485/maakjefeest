import type { Metadata } from "next"
import Link from "next/link"
import { PLANS, PLAN_ORDER, formatEur, planStartUrl, upgradeHint, type Plan } from "@/lib/plans"

export const metadata: Metadata = {
  title: "Waarmee wil je beginnen?",
  robots: { index: false, follow: true },
}

// Zelfde palet als het prijsblok op de homepage, zodat die twee één geheel zijn
const GOLD      = "#C5A059"
const DARK      = "#0E0C09"
const DARK_CARD = "#161209"
const IVORY     = "#FAF7F2"
const MUTED     = "#8A7E72"
const FEATURE   = "#B5A995"

// Per pakket één regel over wat je nu gaat doen, plus het woord op de knop.
// De opsomming eronder komt uit PLANS, zodat homepage en keuzepagina niet
// uit elkaar kunnen lopen.
const WAT_JE_DOET: Record<Plan, { uitleg: string; knop: string }> = {
  save_the_date: {
    uitleg: "Zet de datum alvast bij je gasten in de agenda.",
    knop: "Ontwerp een Save the Date",
  },
  uitnodiging: {
    uitleg: "Trouwkaarten per gastengroep waar gasten met één tik op reageren.",
    knop: "Ontwerp een trouwkaart",
  },
  compleet: {
    uitleg: "Kaarten, RSVP en een eigen trouwwebsite op één plek.",
    knop: "Bouw jullie trouwwebsite",
  },
}

function Check() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function StartPage() {
  return (
    <div style={{ backgroundColor: DARK }} className="min-h-screen antialiased">
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 border-b"
        style={{ backgroundColor: `${DARK}EC`, borderColor: "#2A2218" }}
      >
        <Link href="/" className="text-2xl tracking-wide" style={{ fontFamily: "var(--font-cormorant)", color: IVORY, fontWeight: 600, textDecoration: "none" }}>
          SayingYes
        </Link>
        <Link href="/inloggen" className="text-sm font-medium" style={{ color: MUTED, textDecoration: "none" }}>
          Inloggen
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
        {/* Zelfde koptooi als het prijsblok op de homepage */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div style={{ flex: 1, maxWidth: 72, height: 1, backgroundColor: "#2A2218" }} />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            Gratis starten
          </span>
          <svg width="7" height="7" viewBox="0 0 8 8" fill={GOLD} opacity="0.5">
            <path d="M4 0 L8 4 L4 8 L0 4 Z" />
          </svg>
          <div style={{ flex: 1, maxWidth: 72, height: 1, backgroundColor: "#2A2218" }} />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl mb-4 leading-tight" style={{ fontFamily: "var(--font-cormorant)", color: IVORY, fontWeight: 700 }}>
            Waarmee wil je beginnen?
          </h1>
          <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: MUTED }}>
            Begin klein of ga meteen compleet. Je betaalt pas als je verstuurt of publiceert, en upgraden kost later alleen het verschil.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-5">
          {PLAN_ORDER.map((p) => {
            const info = PLANS[p]
            const w = WAT_JE_DOET[p]
            const uitgelicht = p === "compleet"
            return (
              <div
                key={p}
                className="rounded-3xl p-7 flex flex-col relative overflow-hidden"
                style={{
                  backgroundColor: DARK_CARD,
                  border: `1px solid ${uitgelicht ? GOLD : "#2A2218"}`,
                  boxShadow: uitgelicht ? `0 0 0 1px ${GOLD}40, 0 20px 60px rgba(0,0,0,0.35)` : "none",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: GOLD }}>
                  {info.label}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span
                    className="leading-none"
                    style={{ fontFamily: "var(--font-cormorant)", fontSize: "3.25rem", fontWeight: 700, color: IVORY }}
                  >
                    {formatEur(info.price).replace(",00", "")}
                  </span>
                </div>
                <p className="text-xs" style={{ color: MUTED }}>{w.uitleg}</p>
                <p className="text-xs mt-1.5 mb-5 font-semibold" style={{ color: GOLD }}>{upgradeHint(p)}</p>
                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {info.features.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check />
                      <span className="text-sm leading-relaxed" style={{ color: FEATURE }}>{item}</span>
                    </li>
                  ))}
                </ul>
                {/* Hier zegt de knop wát je gaat maken; op de homepage staat
                    "Start gratis", maar op een keuzepagina wil je het verschil zien. */}
                <Link
                  href={planStartUrl(p)}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3.5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 text-center"
                  style={
                    uitgelicht
                      ? { backgroundColor: GOLD, color: DARK, boxShadow: `0 8px 32px ${GOLD}40` }
                      : { backgroundColor: "transparent", color: IVORY, border: `1px solid ${GOLD}60` }
                  }
                >
                  {w.knop}
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-center mb-10" style={{ color: "#4A4030" }}>
          Eenmalige betaling · Kaartpakketten zonder einddatum · Geen abonnement
        </p>

        <p className="text-center text-sm" style={{ color: MUTED }}>
          Twijfel je? Begin met een Save the Date. Alles wat je maakt blijft staan als je later meer wilt.{" "}
          <Link href="/digitale-uitnodiging" className="underline" style={{ color: GOLD }}>Lees hoe de digitale uitnodiging werkt</Link>
        </p>
      </main>
    </div>
  )
}
