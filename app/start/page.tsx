import type { Metadata } from "next"
import Link from "next/link"
import { PLANS, PLAN_ORDER, formatEur, planStartUrl, upgradeHint, type Plan } from "@/lib/plans"

export const metadata: Metadata = {
  title: "Waarmee wil je beginnen?",
  robots: { index: false, follow: true },
}

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"
const SUBTLE     = "#9A8E82"

// Eén zin per pakket over wat je meteen gaat doen; de rest staat op de kaart zelf
const WAT_JE_DOET: Record<Plan, { kop: string; uitleg: string; knop: string; icoon: string }> = {
  save_the_date: {
    icoon: "📅",
    kop: "Een Save the Date",
    uitleg: "Zet de datum alvast bij je gasten in de agenda. Je ontwerpt de kaart nu, gratis en zonder account, en verstuurt hem als link via WhatsApp.",
    knop: "Ontwerp een Save the Date",
  },
  uitnodiging: {
    icoon: "💌",
    kop: "Een digitale uitnodiging",
    uitleg: "Trouwkaarten per gastengroep waar gasten met één tik op reageren. Jullie zien de aanmeldingen en dieetwensen in een dashboard.",
    knop: "Ontwerp een trouwkaart",
  },
  compleet: {
    icoon: "✨",
    kop: "De complete trouwwebsite",
    uitleg: "Kaarten, RSVP en een eigen trouwwebsite met programma, informatie, cadeautips, fotogalerij en een live gastenfotomuur.",
    knop: "Bouw jullie trouwwebsite",
  },
}

export default function StartPage() {
  return (
    <div style={{ backgroundColor: IVORY }} className="min-h-screen antialiased">
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 border-b"
        style={{ backgroundColor: `${IVORY}EC`, borderColor: `${GOLD_LIGHT}50` }}
      >
        <Link href="/" className="text-2xl tracking-wide" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600, textDecoration: "none" }}>
          SayingYes
        </Link>
        <Link href="/inloggen" className="text-sm font-medium" style={{ color: BODY, textDecoration: "none" }}>
          Inloggen
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: GOLD }}>Gratis starten</p>
          <h1 className="text-4xl sm:text-5xl mb-4 leading-tight" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}>
            Waarmee wil je beginnen?
          </h1>
          <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: BODY }}>
            Begin klein of ga meteen compleet. Je betaalt pas als je verstuurt of publiceert, en upgraden kost later alleen het verschil.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {PLAN_ORDER.map((p) => {
            const info = PLANS[p]
            const w = WAT_JE_DOET[p]
            const uitgelicht = p === "compleet"
            return (
              <Link
                key={p}
                href={planStartUrl(p)}
                className="group flex flex-col rounded-3xl p-7 transition-all hover:-translate-y-1"
                style={{
                  backgroundColor: uitgelicht ? "#fff" : IVORY_CARD,
                  border: `1px solid ${uitgelicht ? GOLD : GOLD_LIGHT}`,
                  boxShadow: uitgelicht ? `0 16px 48px ${GOLD}25` : "none",
                  textDecoration: "none",
                }}
              >
                <span className="text-3xl mb-4" aria-hidden="true">{w.icoon}</span>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: GOLD }}>{info.label}</p>
                <h2 className="text-2xl mb-3 leading-tight" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}>
                  {w.kop}
                </h2>
                <p className="text-sm leading-relaxed flex-1" style={{ color: BODY }}>{w.uitleg}</p>
                <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
                  <p className="text-lg font-bold mb-1" style={{ color: CHARCOAL }}>
                    {formatEur(info.price).replace(",00", "")}{" "}
                    <span className="text-xs font-normal" style={{ color: SUBTLE }}>eenmalig</span>
                  </p>
                  <p className="text-xs leading-snug mb-5" style={{ color: SUBTLE }}>{upgradeHint(p)}</p>
                  <span
                    className="inline-flex items-center justify-center w-full gap-2 text-sm font-semibold px-5 py-3 rounded-xl transition-all group-hover:opacity-90"
                    style={uitgelicht ? { backgroundColor: CHARCOAL, color: IVORY } : { backgroundColor: GOLD_BG, color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}` }}
                  >
                    {w.knop}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-sm mt-10" style={{ color: SUBTLE }}>
          Twijfel je? Begin met een Save the Date. Alles wat je maakt blijft staan als je later meer wilt.{" "}
          <Link href="/digitale-uitnodiging" className="underline" style={{ color: GOLD }}>Lees hoe de digitale uitnodiging werkt</Link>
        </p>
      </main>
    </div>
  )
}
