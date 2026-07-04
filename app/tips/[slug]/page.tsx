import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTip, getAllTips } from "@/lib/tips"
import { NavLoginButton } from "@/components/NavLoginButton"

export async function generateStaticParams() {
  return getAllTips().map(t => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const tip = await getTip(slug)
  if (!tip) return {}
  return {
    title: `${tip.title} — SayingYes`,
    description: tip.description,
    alternates: { canonical: `https://sayingyes.nl/tips/${slug}` },
    openGraph: { title: tip.title, description: tip.description, url: `https://sayingyes.nl/tips/${slug}` },
  }
}

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
}

export default async function TipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tip = await getTip(slug)
  if (!tip) notFound()

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

      <main className="max-w-2xl mx-auto px-6 py-16">

        {/* Terug */}
        <Link
          href="/tips"
          className="inline-flex items-center gap-1.5 text-sm mb-10 transition-opacity hover:opacity-70"
          style={{ color: GOLD, textDecoration: "none" }}
        >
          ← Alle tips
        </Link>

        {/* Artikel header */}
        <p className="text-xs font-medium mb-3" style={{ color: GOLD, letterSpacing: "0.08em" }}>
          {formatDate(tip.date)}
        </p>
        <h1
          className="mb-6"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, color: CHARCOAL, lineHeight: 1.2 }}
        >
          {tip.title}
        </h1>
        <p className="text-base leading-relaxed mb-10 pb-10 border-b" style={{ color: BODY, borderColor: `${GOLD_LIGHT}40` }}>
          {tip.description}
        </p>

        {/* Markdown inhoud */}
        <div
          className="prose-tip"
          style={{ color: BODY }}
          dangerouslySetInnerHTML={{ __html: tip.html }}
        />

        {/* CTA */}
        <div
          className="mt-14 rounded-2xl p-8 text-center border"
          style={{ backgroundColor: "#FFFDF9", borderColor: `${GOLD_LIGHT}60` }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div style={{ width: 32, height: 1, backgroundColor: GOLD_LIGHT }} />
            <svg width="5" height="5" viewBox="0 0 8 8" fill={GOLD_LIGHT}><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
            <div style={{ width: 32, height: 1, backgroundColor: GOLD_LIGHT }} />
          </div>
          <p className="mb-1 font-semibold" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.4rem", color: CHARCOAL }}>Klaar om te beginnen?</p>
          <p className="text-sm mb-5" style={{ color: BODY }}>Maak jullie trouwwebsite in een paar minuten aan.</p>
          <Link
            href="/aanmaken"
            className="inline-flex text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:opacity-85"
            style={{ backgroundColor: CHARCOAL, color: IVORY, textDecoration: "none" }}
          >
            Start gratis
          </Link>
        </div>
      </main>

      {/* Prose stijlen */}
      <style>{`
        .prose-tip h2 { font-family: var(--font-cormorant); font-size: 1.6rem; font-weight: 700; color: ${CHARCOAL}; margin: 2rem 0 0.75rem; line-height: 1.25; }
        .prose-tip p  { margin-bottom: 1.25rem; line-height: 1.8; font-size: 1rem; }
        .prose-tip ul { list-style: disc; padding-left: 1.4rem; margin-bottom: 1.25rem; }
        .prose-tip li { margin-bottom: 0.4rem; line-height: 1.7; }
        .prose-tip a  { color: ${GOLD}; text-decoration: underline; text-underline-offset: 3px; }
        .prose-tip strong { color: ${CHARCOAL}; font-weight: 600; }
      `}</style>

      <footer className="py-8 text-center text-xs border-t mt-8" style={{ borderColor: `${GOLD_LIGHT}30`, color: "#9A8E82" }}>
        <Link href="/" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: "#8A7E72", fontWeight: 600, textDecoration: "none" }}>SayingYes</Link>
        <span className="mx-3">·</span>
        <Link href="/tips" className="hover:underline" style={{ color: "#9A8E82", textDecoration: "none" }}>Tips</Link>
        <span className="mx-3">·</span>
        <Link href="/privacy" className="hover:underline" style={{ color: "#9A8E82", textDecoration: "none" }}>Privacy</Link>
      </footer>
    </div>
  )
}
