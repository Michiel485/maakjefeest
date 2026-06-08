import Link from "next/link"
import { NavLoginButton } from "@/components/NavLoginButton"
import ResetGoogleTranslate from "@/components/ResetGoogleTranslate"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"
const DARK       = "#0E0C09"
const DARK_CARD  = "#161209"

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-10">
      <div style={{ width: 64, height: 1, backgroundColor: GOLD_LIGHT }} />
      <svg width="10" height="10" viewBox="0 0 10 10" fill={GOLD}>
        <path d="M5 0 L10 5 L5 10 L0 5 Z" />
      </svg>
      <div style={{ width: 64, height: 1, backgroundColor: GOLD_LIGHT }} />
    </div>
  )
}

export default function Home() {
  return (
    <div style={{ backgroundColor: IVORY }} className="min-h-screen antialiased">
      <ResetGoogleTranslate />

      {/* ── Nav ── */}
      <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <span
          className="text-2xl tracking-wide"
          style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600 }}
        >
          Saying Yes
        </span>
        <div className="flex items-center gap-6">
          <NavLoginButton />
          <Link
            href="/aanmaken"
            className="hidden sm:inline-flex text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            style={{ backgroundColor: CHARCOAL, color: IVORY }}
          >
            Start gratis
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-12 pb-28 px-6 overflow-hidden">

        {/* Very subtle warm glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 20%, ${GOLD_BG} 0%, transparent 70%)`,
          }}
        />

        <div className="relative flex flex-col items-center text-center max-w-3xl mx-auto">

          {/* Pricing badge */}
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full mb-8 tracking-wide"
            style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: GOLD_BG, color: GOLD }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M5 0 L10 5 L5 10 L0 5 Z" />
            </svg>
            Eenmalig €39,99 voor 1 jaar — Geen onverwachte abonnementskosten
          </div>

          {/* H1 */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl leading-[1.08] mb-8 tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}
          >
            Jullie unieke verhaal,<br />
            vertaald naar een<br />
            digitaal{" "}
            <em style={{ color: GOLD, fontStyle: "italic" }}>meesterwerk</em>.
          </h1>

          {/* Ornament */}
          <div className="flex items-center gap-3 mb-8">
            <div style={{ width: 48, height: 1, backgroundColor: GOLD_LIGHT }} />
            <svg width="8" height="8" viewBox="0 0 8 8" fill={GOLD_LIGHT}>
              <path d="M4 0 L8 4 L4 8 L0 4 Z" />
            </svg>
            <div style={{ width: 48, height: 1, backgroundColor: GOLD_LIGHT }} />
          </div>

          {/* Sub */}
          <p
            className="text-lg sm:text-xl max-w-2xl leading-relaxed mb-10"
            style={{ color: BODY }}
          >
            Ontwerp in enkele minuten een adembenemende bruiloftwebsite die een jaar lang straalt.
            Deel het programma, verzamel RSVP&apos;s en beheer alle felicitaties in jullie persoonlijke
            dashboard. Verlengen na een jaar kan flexibel voor slechts{" "}
            <span style={{ color: CHARCOAL, fontWeight: 600 }}>€17,99 per 6 maanden</span>.
          </p>

          {/* CTA group */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
            <Link
              href="/aanmaken"
              className="inline-flex items-center gap-2.5 text-base font-semibold px-10 py-4 rounded-2xl transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: CHARCOAL,
                color: IVORY,
                boxShadow: "0 8px 32px rgba(26,26,26,0.18)",
              }}
            >
              Start nu gratis
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/bouwen"
              className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-4 rounded-2xl transition-all"
              style={{
                border: `1.5px solid ${GOLD_LIGHT}`,
                color: BODY,
                backgroundColor: "transparent",
              }}
            >
              Bekijk een voorbeeld
            </Link>
          </div>
          <p className="text-xs tracking-wide" style={{ color: GOLD }}>Geen account nodig om te starten</p>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <GoldDivider />
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-3"
            style={{ color: GOLD }}
          >
            Alles inbegrepen
          </p>
          <h2
            className="text-3xl sm:text-4xl"
            style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}
          >
            Eén platform. Alles wat jullie nodig hebben.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              ),
              title: "RSVP & Dashboard",
              body: "Gasten melden zich aan via een stijlvol formulier. Bekijk aanmeldingen live in jullie persoonlijke dashboard en exporteer de lijst.",
              tags: ["Aanmelden", "Overzicht", "Export"],
            },
            {
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              ),
              title: "Programma & Informatie",
              body: "Deel het tijdschema van jullie grote dag, van ceremonie tot avondfeest. Voeg praktische informatie en een routebeschrijving toe.",
              tags: ["Ceremonie", "Diner", "Feest"],
            },
            {
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              ),
              title: "Cadeaulijst & Foto's",
              body: "Zet jullie cadeauwensen op de website en upload een galerij met foto's. Alles op één plek, stijlvol gepresenteerd.",
              tags: ["Cadeaus", "Foto's", "Lijst"],
            },
          ].map(({ icon, title, body, tags }) => (
            <div
              key={title}
              className="rounded-3xl p-8 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: IVORY_CARD,
                border: `1px solid ${GOLD_LIGHT}`,
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_LIGHT}` }}
              >
                {icon}
              </div>
              <div>
                <h3
                  className="text-lg mb-2"
                  style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL, fontSize: "1.2rem" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>{body}</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_LIGHT}` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-6" style={{ backgroundColor: DARK }}>
        <div className="max-w-4xl mx-auto text-center">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: GOLD }}
          >
            Simpel &amp; snel
          </p>
          <h2
            className="text-3xl sm:text-4xl mb-16"
            style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2", fontWeight: 700 }}
          >
            In drie stappen live
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              {
                n: "01",
                title: "Vul jullie gegevens in",
                body: "Vul de namen, trouwdatum en locatie in. We zetten jullie bruiloftswebsite direct voor jullie klaar.",
              },
              {
                n: "02",
                title: "Bouw jullie website",
                body: "Personaliseer de pagina's: welkomsttekst, programma, RSVP-formulier en praktische informatie.",
              },
              {
                n: "03",
                title: "Deel met jullie gasten",
                body: "Betaal eenmalig €39,99 en zet jullie website live op een eigen subdomein. Een jaar lang online.",
              },
            ].map(({ n, title, body }) => (
              <div
                key={n}
                className="rounded-3xl p-8 flex flex-col gap-5"
                style={{ backgroundColor: DARK_CARD, border: `1px solid #2A2218` }}
              >
                <span
                  className="text-4xl font-black leading-none"
                  style={{ fontFamily: "var(--font-cormorant)", color: GOLD, opacity: 0.7 }}
                >
                  {n}
                </span>
                <h3 className="text-base font-semibold" style={{ color: "#FAF7F2" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8A7E72" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing highlight ── */}
      <section className="py-24 px-6" style={{ backgroundColor: IVORY }}>
        <div className="max-w-2xl mx-auto text-center">
          <GoldDivider />
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: GOLD }}
          >
            Transparante prijsstelling
          </p>
          <h2
            className="text-3xl sm:text-4xl mb-6"
            style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}
          >
            Eén eerlijke prijs.<br />Nooit verrassingen.
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: BODY }}>
            Jullie bruiloftswebsite is een jaar lang online voor een eenmalig bedrag van{" "}
            <span style={{ color: CHARCOAL, fontWeight: 700 }}>€39,99</span>. Wil je daarna verlengen?
            Dat kan flexibel voor slechts <span style={{ color: CHARCOAL, fontWeight: 700 }}>€17,99 per 6 maanden</span>.
            Geen verborgen kosten, geen abonnementen.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div
              className="flex-1 rounded-2xl p-6 text-left"
              style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Lancering</p>
              <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL }}>€39,99</p>
              <p className="text-xs" style={{ color: BODY }}>Eenmalig · 1 jaar online · Alles inbegrepen</p>
            </div>
            <div
              className="flex-1 rounded-2xl p-6 text-left"
              style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Verlenging</p>
              <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL }}>€17,99</p>
              <p className="text-xs" style={{ color: BODY }}>Per 6 maanden · Flexibel opzegbaar</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="relative overflow-hidden py-28 px-6 text-center" style={{ backgroundColor: DARK }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 60% at 50% 100%, #2A1F0A 0%, transparent 70%)` }}
        />
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div style={{ width: 40, height: 1, backgroundColor: "#2A2218" }} />
            <svg width="8" height="8" viewBox="0 0 8 8" fill={GOLD} opacity="0.5">
              <path d="M4 0 L8 4 L4 8 L0 4 Z" />
            </svg>
            <div style={{ width: 40, height: 1, backgroundColor: "#2A2218" }} />
          </div>
          <h2
            className="text-4xl sm:text-5xl mb-5 leading-tight"
            style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2", fontWeight: 700 }}
          >
            Klaar om jullie bruiloft<br />te bouwen?
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: "#8A7E72" }}>
            Start vandaag nog — jullie website is in minuten klaar.
          </p>
          <Link
            href="/aanmaken"
            className="inline-flex items-center gap-2.5 text-base font-semibold px-10 py-4 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: GOLD, color: DARK, boxShadow: `0 8px 32px ${GOLD}40` }}
          >
            Start nu gratis
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="mt-5 text-xs tracking-wide" style={{ color: "#4A4030" }}>
            Eenmalig €39,99 · Geen maandelijkse kosten · Altijd online
          </p>
        </div>
      </section>

      <footer className="py-8 text-center text-xs" style={{ backgroundColor: DARK, borderTop: "1px solid #1A1510", color: "#4A4030" }}>
        <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: "#8A7E72", fontWeight: 600 }}>Saying Yes</span>
        <span className="mx-3" style={{ color: "#2A2218" }}>·</span>
        © {new Date().getFullYear()}
        <span className="mx-3" style={{ color: "#2A2218" }}>·</span>
        <a href="/privacy" className="hover:opacity-70 transition-opacity" style={{ color: "#4A4030", textDecoration: "none" }}>Privacy &amp; Cookies</a>
      </footer>
    </div>
  )
}
