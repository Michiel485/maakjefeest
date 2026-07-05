import type { Metadata } from "next"
import Link from "next/link"
import { getAllTips } from "@/lib/tips"
import { NavLoginButton } from "@/components/NavLoginButton"

export const metadata: Metadata = {
  title: "Tips & Gidsen — SayingYes",
  description: "Praktische tips en gidsen voor het maken van jullie trouwwebsite. Van inhoud tot stijl — alles wat je nodig hebt.",
  alternates: { canonical: "https://sayingyes.nl/tips" },
  openGraph: {
    title: "Tips & Gidsen — SayingYes",
    description: "Praktische tips en gidsen voor het maken van jullie trouwwebsite. Van inhoud tot stijl — alles wat je nodig hebt.",
    url: "https://sayingyes.nl/tips",
    siteName: "SayingYes",
    locale: "nl_NL",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "SayingYes — Tips & Gidsen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tips & Gidsen — SayingYes",
    description: "Praktische tips en gidsen voor het maken van jullie trouwwebsite. Van inhoud tot stijl — alles wat je nodig hebt.",
    images: ["/og-image.png"],
  },
}

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

export default function TipsPage() {
  const tips = getAllTips()

  return (
    <div style={{ backgroundColor: IVORY }} className="min-h-screen antialiased">

      {/* Navigatie */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 backdrop-blur-md border-b"
        style={{ backgroundColor: `${IVORY}EC`, borderColor: `${GOLD_LIGHT}50` }}
      >
        <Link
          href="/"
          className="text-2xl tracking-wide"
          style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600, textDecoration: "none" }}
        >
          SayingYes
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/tips" className="hidden sm:inline text-sm transition-opacity hover:opacity-70" style={{ color: BODY }}>
            Tips
          </Link>
          <NavLoginButton />
          <Link
            href="/aanmaken"
            className="hidden sm:inline-flex text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:opacity-85"
            style={{ backgroundColor: CHARCOAL, color: IVORY }}
          >
            Start gratis
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div style={{ width: 40, height: 1, backgroundColor: GOLD_LIGHT }} />
            <svg width="6" height="6" viewBox="0 0 8 8" fill={GOLD_LIGHT}><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
            <div style={{ width: 40, height: 1, backgroundColor: GOLD_LIGHT }} />
          </div>
          <h1
            className="mb-4"
            style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 700, color: CHARCOAL, lineHeight: 1.15 }}
          >
            Tips &amp; Gidsen
          </h1>
          <p className="text-base leading-relaxed max-w-lg mx-auto" style={{ color: BODY }}>
            Praktische gidsen die je helpen het meeste te halen uit jullie trouwwebsite.
          </p>
        </div>

        {/* Artikelkaarten */}
        {tips.length === 0 ? (
          <p className="text-center" style={{ color: BODY }}>Binnenkort verschijnen hier de eerste tips.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {tips.map(tip => (
              <Link
                key={tip.slug}
                href={`/tips/${tip.slug}`}
                className="group block rounded-2xl p-7 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ backgroundColor: "#FFFDF9", borderColor: `${GOLD_LIGHT}60`, textDecoration: "none" }}
              >
                <p className="text-xs mb-2 font-medium" style={{ color: GOLD, letterSpacing: "0.08em" }}>
                  {formatDate(tip.date)}
                </p>
                <h2
                  className="mb-2 transition-colors"
                  style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.45rem", fontWeight: 700, color: CHARCOAL, lineHeight: 1.25 }}
                >
                  {tip.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>
                  {tip.description}
                </p>
                <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold transition-opacity group-hover:opacity-70" style={{ color: GOLD }}>
                  Lees verder →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-xs border-t mt-16" style={{ borderColor: `${GOLD_LIGHT}30`, color: "#9A8E82" }}>
        <Link href="/" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: "#8A7E72", fontWeight: 600, textDecoration: "none" }}>SayingYes</Link>
        <span className="mx-3">·</span>
        <Link href="/privacy" className="hover:underline" style={{ color: "#9A8E82", textDecoration: "none" }}>Privacy</Link>
        <span className="mx-3">·</span>
        <Link href="/voorwaarden" className="hover:underline" style={{ color: "#9A8E82", textDecoration: "none" }}>Voorwaarden</Link>
      </footer>
    </div>
  )
}
