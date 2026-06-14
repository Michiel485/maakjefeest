import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Contact — SayingYes",
  description: "Neem contact op met SayingYes. Vragen, feedback of ideeën? We horen het graag.",
}

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#2A2218"
const DARK       = "#0E0C09"
const BODY       = "#5C5248"
const IVORY      = "#FAF7F2"

export default function ContactPage() {
  return (
    <div style={{ backgroundColor: IVORY, minHeight: "100vh" }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between" style={{ backgroundColor: IVORY, borderColor: "#E8DDD0" }}>
        <Link href="/" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem", fontWeight: 700, color: CHARCOAL, textDecoration: "none" }}>
          SayingYes
        </Link>
        <Link href="/" className="text-sm font-medium" style={{ color: GOLD, textDecoration: "none" }}>
          ← Terug naar home
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14 pb-24">

        <h1 className="mb-2" style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.75rem", fontWeight: 700, color: CHARCOAL, lineHeight: 1.15 }}>
          Contact
        </h1>
        <p className="mb-12 text-sm" style={{ color: "#8A7E72" }}>
          Heb je een vraag, opmerking of geweldig idee? We horen het graag.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">

          {/* Algemeen contact */}
          <div className="rounded-2xl p-7" style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOLD_BG }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.3rem", fontWeight: 700, color: CHARCOAL }}>
                Algemene vragen
              </h2>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: BODY }}>
              Heb je een vraag over je bruiloftswebsite, je account of de werking van het platform? Stuur ons een mailtje en we reageren zo snel mogelijk.
            </p>
            <a
              href="mailto:info@sayingyes.nl"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: GOLD }}
            >
              info@sayingyes.nl
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          {/* Ideeën */}
          <div className="rounded-2xl p-7" style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOLD_BG }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.3rem", fontWeight: 700, color: CHARCOAL }}>
                Deel je ideeën
              </h2>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: BODY }}>
              Heb je een idee dat ons platform naar een hoger niveau tilt? Of mis je een functie die jouw bruiloftswebsite nóg mooier zou maken? We lezen elk bericht en nemen goede ideeën serieus.
            </p>
            <a
              href="mailto:ideeen@sayingyes.nl"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: GOLD }}
            >
              ideeen@sayingyes.nl
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

        </div>

        {/* Bedrijfsgegevens */}
        <div className="rounded-2xl p-7" style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}>
          <h2 className="mb-5" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.3rem", fontWeight: 700, color: CHARCOAL }}>
            Bedrijfsgegevens
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm" style={{ color: BODY }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9A8E82" }}>Handelsnaam</p>
              <p style={{ color: CHARCOAL, fontWeight: 500 }}>SayingYes</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9A8E82" }}>Bedrijfsnaam</p>
              <p style={{ color: CHARCOAL, fontWeight: 500 }}>MvB Commerce</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9A8E82" }}>KVK-nummer</p>
              <p style={{ color: CHARCOAL, fontWeight: 500 }}>42079472</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9A8E82" }}>BTW-nummer</p>
              <p style={{ color: CHARCOAL, fontWeight: 500 }}>NL005478870B96</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9A8E82" }}>Adres</p>
              <p style={{ color: CHARCOAL, fontWeight: 500 }}>Theo Uden Masmanstraat 43</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9A8E82" }}>E-mail</p>
              <a href="mailto:info@sayingyes.nl" className="transition-opacity hover:opacity-70" style={{ color: GOLD, fontWeight: 500 }}>
                info@sayingyes.nl
              </a>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs border-t" style={{ backgroundColor: DARK, borderColor: "#1A1510", color: "#4A4030" }}>
        <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: "#8A7E72", fontWeight: 600 }}>SayingYes</span>
        <span className="mx-3" style={{ color: "#2A2218" }}>·</span>
        © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
