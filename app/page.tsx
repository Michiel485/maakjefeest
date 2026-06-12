import Link from "next/link"
import { NavLoginButton } from "@/components/NavLoginButton"
import ResetGoogleTranslate from "@/components/ResetGoogleTranslate"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const SAND       = "#EDE6D8"
const BODY       = "#5C5248"
const DARK       = "#0E0C09"
const DARK_CARD  = "#161209"

function Ornament({ color = GOLD_LIGHT }: { color?: string }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div style={{ width: 56, height: 1, backgroundColor: color }} />
      <svg width="7" height="7" viewBox="0 0 8 8" fill={color}>
        <path d="M4 0 L8 4 L4 8 L0 4 Z" />
      </svg>
      <div style={{ width: 56, height: 1, backgroundColor: color }} />
    </div>
  )
}

function Check() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function Home() {
  return (
    <div style={{ backgroundColor: IVORY }} className="min-h-screen antialiased">
      <ResetGoogleTranslate />

      {/* ── Navigatie ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 backdrop-blur-md border-b"
        style={{ backgroundColor: `${IVORY}EC`, borderColor: `${GOLD_LIGHT}50` }}
      >
        <span
          className="text-2xl tracking-wide"
          style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600 }}
        >
          SayingYes
        </span>
        <div className="flex items-center gap-5">
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

      {/* ════════════════════════════════════════
          1. HERO — Filmische binnenkomer
      ════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Achtergrond foto */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/hero.png"
          alt="Bruiloft sfeer"
          className="absolute inset-0 w-full h-full object-cover object-center select-none"
          style={{ zIndex: 0 }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,8,5,0.30) 0%, rgba(10,8,5,0.15) 35%, rgba(10,8,5,0.70) 100%)",
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto py-20">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2 rounded-full mb-10 uppercase tracking-widest"
            style={{
              border: `1px solid rgba(232,213,163,0.4)`,
              backgroundColor: "rgba(10,8,5,0.55)",
              color: GOLD_LIGHT,
              backdropFilter: "blur(10px)",
            }}
          >
            <svg width="6" height="6" viewBox="0 0 8 8" fill={GOLD}>
              <path d="M4 0 L8 4 L4 8 L0 4 Z" />
            </svg>
            De meest complete trouwsite van Nederland
          </div>

          {/* Koptekst */}
          <h1
            className="text-5xl sm:text-6xl lg:text-[5.5rem] leading-[1.05] mb-8 tracking-tight"
            style={{
              fontFamily: "var(--font-cormorant)",
              color: "#FAF7F2",
              fontWeight: 700,
              textShadow: "0 2px 40px rgba(0,0,0,0.35)",
            }}
          >
            Jullie droom-trouwwebsite.
            <br />
            <em style={{ fontStyle: "italic", color: GOLD_LIGHT }}>In een handomdraai.</em>
          </h1>

          {/* Subtekst */}
          <p
            className="text-base sm:text-lg max-w-xl leading-relaxed mb-10"
            style={{ color: "rgba(248,240,228,0.88)", textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
          >
            Een prachtige, complete trouwsite bouwen was nog nooit zo leuk en eenvoudig. Jij kiest de stijl, wij zorgen voor de rest.
          </p>

          {/* CTA */}
          <Link
            href="/aanmaken"
            className="inline-flex items-center gap-3 text-base font-semibold px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 mb-5"
            style={{
              backgroundColor: GOLD,
              color: DARK,
              boxShadow: `0 8px 40px rgba(197,160,89,0.55)`,
            }}
          >
            Start gratis jullie ontwerp
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          <p className="text-sm" style={{ color: "rgba(232,213,163,0.75)" }}>
            De meest complete trouwsite van Nederland voor slechts{" "}
            <span style={{ color: GOLD_LIGHT, fontWeight: 600 }}>€49,99</span>
          </p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-60">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD_LIGHT} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════
          2. VISUAL SHOWROOM — Onze designs
      ════════════════════════════════════════ */}
      <section className="py-28 sm:py-32 px-6" style={{ backgroundColor: IVORY }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOLD }}>
              Onze unieke designs
            </p>
            <h2
              className="text-4xl sm:text-5xl leading-tight mb-6"
              style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}
            >
              Jullie website, jullie stijl
            </h2>
            <Ornament />
            <p className="mt-6 text-sm max-w-lg mx-auto leading-relaxed" style={{ color: BODY }}>
              Kies uit meerdere tijdloze thema's — volledig aanpasbaar naar jullie eigen smaak.
            </p>
          </div>

          {/* Grid */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 items-start">

            {/* Thema 1: Emerald Luxury */}
            <div
              className="group rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: IVORY_CARD }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/preview-emerald.jpg"
                  alt="Emerald Luxury thema"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#07353A" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BODY }}>
                    Emerald Luxury
                  </p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>
                  Gewaagd, modern en filmisch chique.
                </p>
              </div>
            </div>

            {/* Thema 2: Gold & Ivory — featured, elevated */}
            <div
              className="group rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl sm:-mt-6"
              style={{ border: `1.5px solid ${GOLD}`, backgroundColor: IVORY_CARD, boxShadow: `0 8px 40px rgba(197,160,89,0.15)` }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/preview-ivory.png"
                  alt="Gold & Ivory thema"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                {/* Populair badge */}
                <div
                  className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{ backgroundColor: GOLD, color: DARK }}
                >
                  Meest gekozen
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: GOLD }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BODY }}>
                    Gold &amp; Ivory
                  </p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>
                  Tijdloos, romantisch en botanisch elegant.
                </p>
              </div>
            </div>

            {/* Thema 3: Terracotta & Gold */}
            <div
              className="group rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: IVORY_CARD }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing/preview-terracotta.png"
                  alt="Terracotta & Gold thema"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#C07A52" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BODY }}>
                    Terracotta &amp; Gold
                  </p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>
                  Warm, Mediterraans en vol karakter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. BUILDER & DASHBOARD
      ════════════════════════════════════════ */}
      <section className="py-28 sm:py-32 px-6" style={{ backgroundColor: SAND }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Links: visuele CSS-mockup van de builder */}
          <div className="relative order-2 lg:order-1">
            <div
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: IVORY, border: `1px solid ${GOLD_LIGHT}` }}
            >
              {/* Titelbalk */}
              <div
                className="flex items-center gap-2 px-5 py-3 border-b"
                style={{ borderColor: `${GOLD_LIGHT}50`, backgroundColor: IVORY_CARD }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#E8C4B0" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#E8D5A3" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#C8D5B0" }} />
                <div
                  className="ml-auto text-xs font-semibold tracking-wide"
                  style={{ fontFamily: "var(--font-cormorant)", color: BODY }}
                >
                  SayingYes · Builder
                </div>
              </div>

              <div className="flex" style={{ minHeight: 280 }}>
                {/* Sidebar */}
                <div
                  className="flex-shrink-0 flex flex-col border-r py-3"
                  style={{ width: 160, borderColor: `${GOLD_LIGHT}40` }}
                >
                  {/* Secties */}
                  {[
                    { label: "Pagina's", sub: ["Home", "Programma", "RSVP", "Foto's"] },
                    { label: "Algemeen", sub: [] },
                    { label: "URL & Beveiliging", sub: [] },
                  ].map(({ label, sub }, i) => (
                    <div key={label}>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span
                          className="font-bold uppercase"
                          style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: i === 0 ? CHARCOAL : "#B0A090" }}
                        >
                          {label}
                        </span>
                        <svg style={{ width: 10, height: 10, color: "#B0A090" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={i === 0 ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                        </svg>
                      </div>
                      {i === 0 && sub.map((page) => (
                        <div
                          key={page}
                          className="flex items-center gap-1.5 mx-3 px-2 py-1.5 rounded-lg mb-0.5"
                          style={{ backgroundColor: page === "Home" ? `${GOLD}18` : "transparent" }}
                        >
                          <svg style={{ width: 8, height: 8, flexShrink: 0, color: page === "Home" ? GOLD : "#C8B8A0" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          <span style={{ fontSize: "0.62rem", color: page === "Home" ? CHARCOAL : "#B0A090", fontWeight: page === "Home" ? 600 : 400 }}>
                            {page}
                          </span>
                          {page === "Home" && (
                            <span className="ml-auto rounded-full px-1.5 py-0.5 text-white" style={{ fontSize: "0.45rem", backgroundColor: "#A8C090", fontWeight: 700 }}>aan</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Sub-items voor Home */}
                  <div className="mt-1 border-t pt-2 mx-3" style={{ borderColor: `${GOLD_LIGHT}40` }}>
                    {["Lay-out", "Headerfoto", "Tekstvelden"].map((s) => (
                      <div key={s} className="flex items-center gap-1.5 pl-5 py-1.5 rounded-lg mb-0.5">
                        <svg style={{ width: 7, height: 7, color: "#C8B8A0" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <span style={{ fontSize: "0.6rem", color: "#B0A090" }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview-vlak */}
                <div className="flex-1 p-4">
                  <div
                    className="rounded-2xl overflow-hidden flex flex-col"
                    style={{ backgroundColor: "#0D5058", minHeight: 234 }}
                  >
                    {/* Hero gradient stripe */}
                    <div
                      className="h-14 flex items-end justify-center pb-2"
                      style={{ background: "linear-gradient(160deg, #07353A, #0A4550)" }}
                    >
                      <div className="w-14 h-1 rounded-full" style={{ backgroundColor: "rgba(213,156,118,0.45)" }} />
                    </div>
                    {/* Content blokken */}
                    <div className="flex flex-col items-center gap-2 px-4 py-5">
                      <div className="w-14 h-4 rounded" style={{ backgroundColor: "rgba(213,156,118,0.65)" }} />
                      <div className="w-20 h-2.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.18)" }} />
                      <div className="w-16 h-2.5 rounded" style={{ backgroundColor: "rgba(213,156,118,0.32)" }} />
                      <div className="w-14 h-7 rounded-xl mt-2" style={{ backgroundColor: "rgba(213,156,118,0.75)" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div
              className="absolute -bottom-5 -right-3 sm:-right-5 rounded-2xl px-4 py-3 shadow-xl"
              style={{ backgroundColor: CHARCOAL, border: "1px solid #2A2218" }}
            >
              <p className="text-xs font-semibold" style={{ color: GOLD }}>Live preview</p>
              <p className="text-xs mt-0.5" style={{ color: "#8A7E72" }}>Zie wijzigingen direct</p>
            </div>
          </div>

          {/* Rechts: tekst */}
          <div className="flex flex-col gap-6 order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
              Super eenvoudig
            </p>
            <h2
              className="text-4xl sm:text-5xl leading-[1.08]"
              style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}
            >
              Ontwerpen<br />zonder stress.
            </h2>
            <div style={{ width: 48, height: 1, backgroundColor: GOLD_LIGHT }} />
            <p className="text-base leading-relaxed" style={{ color: BODY }}>
              Geen ingewikkelde systemen, maar een unieke, doordachte builder waarin je binnen een paar klikken alles aanpast. Zie live je wijzigingen en beheer moeiteloos je gasten op één centraal dashboard.
            </p>
            <ul className="flex flex-col gap-3 mt-1">
              {[
                "Live preview terwijl je bouwt",
                "Stijl, kleuren en lettertypen in één klik",
                "Gasten beheren op jullie eigen dashboard",
                "RSVP en dieetwensen automatisch bijgehouden",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check />
                  <span className="text-sm leading-relaxed" style={{ color: BODY }}>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="/aanmaken"
                className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
                style={{ backgroundColor: CHARCOAL, color: IVORY }}
              >
                Start gratis jullie ontwerp
              </Link>
              <Link
                href="/bouwen"
                className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                style={{ border: `1.5px solid ${GOLD_LIGHT}`, color: BODY }}
              >
                Bekijk een voorbeeld
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. USP GRID — Alles-in-één
      ════════════════════════════════════════ */}
      <section className="py-28 sm:py-32 px-6" style={{ backgroundColor: IVORY }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOLD }}>
              Alles inbegrepen
            </p>
            <h2
              className="text-4xl sm:text-5xl leading-tight mb-6"
              style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}
            >
              Eén platform.<br />Alles wat jullie nodig hebben.
            </h2>
            <Ornament />
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 rounded-3xl overflow-hidden"
            style={{ border: `1px solid ${GOLD_LIGHT}` }}
          >
            {[
              {
                path: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
                title: "Digitale RSVP Module",
                body: "Gasten melden zich digitaal aan. Intoleranties en dieetwensen stromen live binnen op jullie dashboard.",
              },
              {
                path: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
                title: "Slimme Meertaligheid",
                body: "Internationale gasten? Met één druk op de knop vertalen bezoekers de héle website direct naar hun eigen taal.",
              },
              {
                path: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
                title: "Privacy & Wachtwoord",
                body: "Scherm de dagindeling af met een wachtwoord of geheime vraag — met slimme 90% typefout-tolerantie.",
              },
              {
                path: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
                title: "Programma & Cadeautips",
                body: "Presenteer de dagindeling prachtig digitaal en voeg een stijlvol cadeautips-lijstje toe.",
              },
              {
                path: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
                title: "Gratis Fotogalerij",
                body: "Deel na de grote dag alle prachtige trouwfoto's in hoge kwaliteit gratis met jullie gasten.",
              },
              {
                path: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
                title: "Eigen Domeinnaam",
                body: "Geen subdomeinen, maar een échte eigen URL — bijv. www.bruiloft-naam.nl.",
              },
              {
                path: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
                title: "Altijd Flexibel",
                body: "Zelfs na publicatie passen jullie lay-out, teksten of URL op elk moment direct gratis aan.",
              },
            ].map(({ path, title, body }, i) => (
              <div
                key={title}
                className="p-7 flex flex-col gap-4 transition-colors duration-300 hover:brightness-95"
                style={{
                  borderRight: `1px solid ${GOLD_LIGHT}`,
                  borderBottom: `1px solid ${GOLD_LIGHT}`,
                  backgroundColor: i % 2 === 0 ? IVORY : IVORY_CARD,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
                >
                  <svg
                    style={{ width: "1.1rem", height: "1.1rem", color: GOLD }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={path} />
                  </svg>
                </div>
                <div>
                  <h3
                    className="mb-1.5"
                    style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL, fontSize: "1.1rem" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: BODY }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          5. PRICING — Transparant & eerlijk
      ════════════════════════════════════════ */}
      <section className="py-28 sm:py-32 px-6" style={{ backgroundColor: DARK }}>
        <div className="max-w-3xl mx-auto">
          {/* Ornament header */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <div style={{ flex: 1, maxWidth: 72, height: 1, backgroundColor: "#2A2218" }} />
            <svg width="7" height="7" viewBox="0 0 8 8" fill={GOLD} opacity="0.5">
              <path d="M4 0 L8 4 L4 8 L0 4 Z" />
            </svg>
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: GOLD }}
            >
              Transparante prijsstelling
            </span>
            <svg width="7" height="7" viewBox="0 0 8 8" fill={GOLD} opacity="0.5">
              <path d="M4 0 L8 4 L4 8 L0 4 Z" />
            </svg>
            <div style={{ flex: 1, maxWidth: 72, height: 1, backgroundColor: "#2A2218" }} />
          </div>

          <div className="text-center mb-12">
            <h2
              className="text-4xl sm:text-5xl mb-4 leading-tight"
              style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2", fontWeight: 700 }}
            >
              Eén eerlijke prijs.<br />Nooit verrassingen.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "#8A7E72" }}>
              De goedkoopste én meest complete trouwsite van Nederland.
            </p>
          </div>

          {/* Hoofdprijs card */}
          <div
            className="rounded-3xl p-10 text-center mb-5 relative overflow-hidden"
            style={{ backgroundColor: DARK_CARD, border: `1px solid #2A2218` }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${GOLD}0A 0%, transparent 70%)`,
              }}
            />

            <p
              className="text-xs font-semibold uppercase tracking-[0.2em] mb-5"
              style={{ color: GOLD }}
            >
              Een jaar live voor maar
            </p>

            {/* Prijs */}
            <div className="flex items-start justify-center gap-1 mb-2">
              <span
                className="text-2xl font-semibold mt-4"
                style={{ fontFamily: "var(--font-cormorant)", color: GOLD_LIGHT }}
              >
                €
              </span>
              <span
                className="leading-none"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "6rem",
                  fontWeight: 700,
                  color: "#FAF7F2",
                }}
              >
                49
              </span>
              <div className="mt-4">
                <span
                  className="text-3xl font-semibold"
                  style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2" }}
                >
                  ,99
                </span>
              </div>
            </div>
            <p className="text-sm mt-4 mb-10" style={{ color: "#4A4030" }}>
              Eenmalig · Geen stilzwijgende verlengingen
            </p>

            {/* Features */}
            <ul className="flex flex-col gap-3 text-left max-w-sm mx-auto mb-10">
              {[
                "De goedkoopste & meest complete optie van Nederland",
                "Inclusief eigen domeinnaam én alle premium features",
                "Loopt automatisch af — geen verrassing achteraf",
                "Na het eerste jaar verlengen wanneer jullie willen",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check />
                  <span className="text-sm leading-relaxed" style={{ color: "#8A7E72" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/aanmaken"
              className="inline-flex items-center gap-2.5 text-sm font-semibold px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
              style={{ backgroundColor: GOLD, color: DARK, boxShadow: `0 8px 32px ${GOLD}40` }}
            >
              Start nu gratis
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Verlengingskaart */}
          <div
            className="rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            style={{ backgroundColor: "#0A0805", border: `1px solid #2A2218` }}
          >
            <div className="flex-1">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: GOLD }}
              >
                Na het eerste jaar — Volledige vrijheid
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#8A7E72" }}>
                Verlengen wanneer jullie willen voor slechts{" "}
                <span style={{ color: "#FAF7F2", fontWeight: 600 }}>€22 per 6 maanden</span>.
                Ideaal om na de bruiloft de fotogalerij online te houden.
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p
                className="text-3xl font-bold leading-none"
                style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2" }}
              >
                €22
              </p>
              <p className="text-xs mt-1" style={{ color: "#4A4030" }}>
                per 6 maanden
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          6. SLUIT-CTA
      ════════════════════════════════════════ */}
      <section className="py-32 px-6 text-center" style={{ backgroundColor: IVORY }}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <Ornament />
          </div>
          <h2
            className="text-4xl sm:text-5xl mb-5 leading-tight"
            style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}
          >
            Klaar om jullie<br />
            <em style={{ fontStyle: "italic", color: GOLD }}>droombruiloft</em> te bouwen?
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: BODY }}>
            Start vandaag nog — jullie website is in minuten klaar.
          </p>
          <Link
            href="/aanmaken"
            className="inline-flex items-center gap-2.5 text-base font-semibold px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
            style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: "0 8px 32px rgba(26,26,26,0.18)" }}
          >
            Start gratis jullie ontwerp
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="mt-5 text-xs tracking-wide" style={{ color: GOLD }}>
            Eenmalig €49,99 · Geen maandelijkse kosten · Altijd online
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-8 text-center text-xs"
        style={{ backgroundColor: DARK, borderTop: "1px solid #1A1510", color: "#4A4030" }}
      >
        <span
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: "#8A7E72", fontWeight: 600 }}
        >
          SayingYes
        </span>
        <span className="mx-3" style={{ color: "#2A2218" }}>·</span>
        © {new Date().getFullYear()}
        <span className="mx-3" style={{ color: "#2A2218" }}>·</span>
        <a
          href="/privacy"
          className="hover:opacity-70 transition-opacity"
          style={{ color: "#4A4030", textDecoration: "none" }}
        >
          Privacy &amp; Cookies
        </a>
      </footer>
    </div>
  )
}
