import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Pagina niet gevonden",
  robots: { index: false, follow: true },
}

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

// Eigen 404 in huisstijl: houdt bezoekers (en Google) op de site met nuttige links
export default function NotFound() {
  return (
    <div style={{ backgroundColor: IVORY }} className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center antialiased">
      <div className="flex items-center justify-center gap-3 mb-8">
        <div style={{ width: 40, height: 1, backgroundColor: GOLD_LIGHT }} />
        <svg width="6" height="6" viewBox="0 0 8 8" fill={GOLD_LIGHT}><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
        <div style={{ width: 40, height: 1, backgroundColor: GOLD_LIGHT }} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-4" style={{ color: GOLD }}>
        404
      </p>
      <h1
        className="mb-4"
        style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, color: CHARCOAL, lineHeight: 1.15 }}
      >
        Deze pagina bestaat niet (meer)
      </h1>
      <p className="text-base leading-relaxed max-w-md mb-10" style={{ color: BODY }}>
        Misschien is de link verkeerd getypt, of is de pagina verhuisd. Geen zorgen, hier kun je verder.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: CHARCOAL, color: IVORY, textDecoration: "none" }}
        >
          Naar de homepage
        </Link>
        <Link
          href="/tips"
          className="inline-flex items-center justify-center text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "white", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, textDecoration: "none" }}
        >
          Tips & gidsen
        </Link>
        <Link
          href="/start"
          className="inline-flex items-center justify-center text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: GOLD, color: CHARCOAL, textDecoration: "none" }}
        >
          Gratis trouwsite starten
        </Link>
      </div>
    </div>
  )
}
