import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { NavLoginButton } from "@/components/NavLoginButton"
import ResetGoogleTranslate from "@/components/ResetGoogleTranslate"
import { MARKETING_URL } from "@/lib/site-url"
import { getAllTips } from "@/lib/tips"
import { PLANS, PLAN_ORDER, formatEur } from "@/lib/plans"

export const metadata: Metadata = {
  // Absolute titel: de root-template zou er anders een tweede "| SayingYes" achter zetten
  title: { absolute: "Digitale trouwkaart, Save the Date en trouwwebsite | SayingYes" },
  description: "Digitale uitnodiging voor jullie bruiloft via WhatsApp, met RSVP en een eigen trouwwebsite. Gratis starten, vanaf €15. Save the Date, trouwkaarten en gastenfotomuur.",
  alternates: {
    canonical: MARKETING_URL,
  },
  openGraph: {
    title: "Digitale trouwkaart, Save the Date en trouwwebsite | SayingYes",
    description: "Digitale uitnodiging voor jullie bruiloft via WhatsApp, met RSVP en een eigen trouwwebsite. Gratis starten, vanaf €15.",
    url: MARKETING_URL,
  },
}

// Veelgestelde vragen: zichtbaar op de pagina én als FAQPage-schema voor Google
const FAQ_ITEMS: [string, string][] = [
  [
    "Wat kost SayingYes?",
    "Je kiest zelf hoe groot je begint. Een digitale Save the Date kost eenmalig €15, uitnodigingen met RSVP-pagina en dashboard €25, en de complete trouwwebsite met alles erop en eraan €49,99 voor een jaar. Upgraden kan altijd, je betaalt dan alleen het verschil. Ontwerpen is gratis: je betaalt pas als je jullie kaart verstuurt of de site publiceert. Geen abonnement.",
  ],
  [
    "Heb ik technische kennis nodig?",
    "Nee. Je kiest een thema, vult jullie namen, datum en teksten in en de site staat. Alles werkt vanaf je telefoon, dus je kunt ook op de bank verder bouwen. Een complete trouwwebsite staat gemiddeld binnen een kwartier.",
  ],
  [
    "Krijgen we een eigen webadres?",
    "Ja. Jullie kiezen zelf een adres zoals jullienamen.sayingyes.nl. Makkelijk te onthouden voor gasten en mooi op de uitnodiging.",
  ],
  [
    "Kunnen gasten zich aanmelden via de website?",
    "Ja, met het RSVP-formulier. Gasten geven aan of ze komen, met hoeveel personen, of ze daggast of avondgast zijn en welke dieetwensen ze hebben. Jullie zien alles in één overzicht en exporteren het met één klik voor de locatie of cateraar.",
  ],
  [
    "Is onze trouwwebsite privé?",
    "Jullie site verschijnt niet in Google en je kunt hem afschermen met een wachtwoord of een geheime vraag die alleen jullie gasten kennen.",
  ],
  [
    "Wat zijn de digitale Save the Date en trouwkaarten?",
    "Kaarten die je als link via WhatsApp verstuurt. Bij je gasten opent een envelop met lakzegel in jullie stijl, met een knop om direct te laten weten of ze komen. Je maakt per gastengroep een eigen kaart met eigen tijden en tekst, en kunt later nog alles aanpassen. Je kunt ze los kopen vanaf €15 of als onderdeel van de complete trouwwebsite.",
  ],
  [
    "Hoe werkt de gastenfotomuur?",
    "Gasten scannen een QR-code op hun tafel en zetten hun foto's direct op jullie fotomuur, met een persoonlijke boodschap. Op een groot scherm of beamer loopt ondertussen een live slideshow. Achteraf download je alles als zip of maak je er een collage van.",
  ],
  [
    "Kunnen we de website na publicatie nog aanpassen?",
    "Ja, altijd. Teksten, foto's, programma, stijl en zelfs het webadres pas je op elk moment aan, ook vanaf je telefoon. Wijzigingen staan direct live.",
  ],
  [
    "Werkt de site ook voor gasten uit het buitenland?",
    "Ja. Jullie gasten kunnen de website bekijken in het Nederlands, Engels, Duits, Frans, Spaans of Italiaans.",
  ],
  [
    "Hoe lang blijft alles online?",
    "De kaartpakketten hebben geen einddatum: jullie kaartlink blijft werken. De complete trouwwebsite staat een jaar online, en in elk geval tot een maand na jullie trouwdatum. Je krijgt ruim op tijd een mail als dat afloopt. Wil je de site langer online houden, bijvoorbeeld voor de fotogalerij, dan verleng je met zes maanden voor €22. Verlengen is nooit verplicht.",
  ],
]

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
  // De drie nieuwste artikelen: interne links vanaf de voorpagina naar de tips
  const laatsteTips = getAllTips().slice(0, 3)

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
          <Link href="/digitale-uitnodiging" className="hidden sm:inline text-sm transition-opacity hover:opacity-70" style={{ color: BODY }}>
            Digitale uitnodiging
          </Link>
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

      {/* ════════════════════════════════════════
          1. HERO — Filmische binnenkomer
      ════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Achtergrond foto: geoptimaliseerde JPEG via next/image, met priority voor een snelle LCP */}
        <Image
          src="/marketing/hero.jpg"
          alt="Bruidspaar op hun trouwdag"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center select-none"
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
            Digitale trouwkaart, Save the Date
            <br />
            <em style={{ fontStyle: "italic", color: GOLD_LIGHT }}>en jullie eigen trouwwebsite.</em>
          </h1>

          {/* Subtekst */}
          <p
            className="text-base sm:text-lg max-w-xl leading-relaxed mb-10"
            style={{ color: "rgba(248,240,228,0.88)", textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
          >
            Verstuur jullie uitnodiging via WhatsApp, laat gasten met één tik reageren en zet alles voor jullie grote dag op één plek. Begin met een kaart, groei door naar de complete site.
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
            Digitale kaart vanaf <span style={{ color: GOLD_LIGHT, fontWeight: 600 }}>€15</span>, de complete trouwwebsite voor{" "}
            <span style={{ color: GOLD_LIGHT, fontWeight: 600 }}>€49,99</span>
          </p>
          <p className="text-xs mt-2" style={{ color: "rgba(232,213,163,0.5)" }}>
            Gratis starten, pas betalen als je 100% tevreden bent
          </p>

          {/* Apparaat indicator */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" style={{ color: "rgba(232,213,163,0.55)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
                </svg>
                <span className="text-xs">Desktop</span>
              </div>
              <div style={{ width: 1, height: 12, backgroundColor: "rgba(232,213,163,0.2)" }} />
              <div className="flex items-center gap-1.5" style={{ color: "rgba(232,213,163,0.55)" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01" strokeWidth={2.5} />
                </svg>
                <span className="text-xs">Telefoon</span>
              </div>
            </div>
            <p className="text-xs" style={{ color: "rgba(232,213,163,0.7)" }}>
              ✦ Volledig te bouwen vanaf je telefoon. Of pak je laptop erbij voor de ultieme bouwervaring.
            </p>
          </div>
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
              Kies uit meerdere tijdloze thema&apos;s, volledig aanpasbaar naar jullie eigen smaak.
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
                <Image
                  src="/marketing/theme-emerald.webp"
                  alt="Emerald Luxury thema voor een trouwwebsite"
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
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

            {/* Thema 2: Gold & Ivory */}
            <div
              className="group rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl sm:-mt-6"
              style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: IVORY_CARD }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                <Image
                  src="/marketing/theme-ivory.webp"
                  alt="Gold & Ivory thema voor een trouwwebsite"
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
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
                <Image
                  src="/marketing/theme-terracotta.webp"
                  alt="Terracotta & Gold thema voor een trouwwebsite"
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
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
          2b. UNIEKE EXTRA'S — fotomuur & digitale kaarten
      ════════════════════════════════════════ */}
      <section
        className="py-28 sm:py-32 px-6"
        style={{ background: "linear-gradient(160deg, #07353A 0%, #0A4550 60%, #0D5058 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: "#D59C76" }}>
              Nergens anders te vinden
            </p>
            <h2
              className="text-4xl sm:text-5xl leading-tight mb-6"
              style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2", fontWeight: 700 }}
            >
              De extra&apos;s die jullie dag<br />onvergetelijk maken
            </h2>
            <Ornament color="#D59C76" />
            <p className="mt-6 text-sm max-w-xl mx-auto leading-relaxed" style={{ color: "#B8CBC9" }}>
              Bij SayingYes krijgen jullie meer dan een trouwsite. Twee functies die gasten
              niet snel vergeten. En ze zitten er gewoon bij.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Live gastenfotomuur */}
            <div
              className="rounded-3xl p-8 sm:p-10 flex flex-col gap-5"
              style={{ backgroundColor: "#0D4A52", border: "1px solid #D59C7640" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: "#D59C7620", border: "1px solid #D59C7640" }}
              >
                📸
              </div>
              <h3
                className="text-2xl sm:text-3xl"
                style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2", fontWeight: 700 }}
              >
                Live gastenfotomuur
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#E8DDD0" }}>
                Jullie gasten scannen een QR-code op hun tafel en hun foto&apos;s verschijnen
                met een persoonlijke boodschap live op jullie eigen fotomuur en in een slideshow
                op groot scherm. Foto&apos;s van de dag, oude herinneringen of gekke momenten:
                alles komt samen op één muur.
              </p>
              <ul className="flex flex-col gap-2.5 text-sm" style={{ color: "#E8DDD0" }}>
                {[
                  "Print-klare QR-kaart in de stijl van jullie site",
                  "Live slideshow voor op een beamer of tv",
                  "Foto's eerst goedkeuren als jullie dat willen",
                  "Achteraf alles downloaden als zip of fotocollage",
                ].map((punt) => (
                  <li key={punt} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#D59C76" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {punt}
                  </li>
                ))}
              </ul>
              <Link
                href="/tips/fotos-verzamelen-bruiloft-qr-code"
                className="mt-2 text-sm font-semibold transition-opacity hover:opacity-80 self-start"
                style={{ color: "#D59C76", textDecoration: "none" }}
              >
                Lees hoe een fotomuur met QR-code werkt →
              </Link>
            </div>

            {/* Digitale kaarten */}
            <div
              className="rounded-3xl p-8 sm:p-10 flex flex-col gap-5"
              style={{ backgroundColor: "#0D4A52", border: "1px solid #D59C7640" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: "#D59C7620", border: "1px solid #D59C7640" }}
              >
                💌
              </div>
              <h3
                className="text-2xl sm:text-3xl"
                style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2", fontWeight: 700 }}
              >
                Digitale Save the Date &amp; Uitnodigingen
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#E8DDD0" }}>
                Verstuur jullie kaart als link via WhatsApp: bij je gasten opent een envelop met
                lakzegel in jullie stijl, en daar is de kaart. Met de RSVP-knop laten gasten meteen
                weten dat ze erbij zijn, en jullie zien alles terug in het dashboard. Los te koop
                vanaf €15, of als onderdeel van de complete trouwwebsite. Geen drukwerk, geen
                postzegels, wel dat &quot;wow&quot;-momentje.
              </p>
              <ul className="flex flex-col gap-2.5 text-sm" style={{ color: "#E8DDD0" }}>
                {[
                  "Envelop-animatie in jullie eigen themastijl",
                  "Directe knoppen naar jullie trouwsite en RSVP",
                  "Aparte kaarten per gastengroep, met eigen tijden",
                  "Kaart later aangepast? Via dezelfde link zien je gasten altijd de nieuwste versie",
                  "Zie hoe vaak jullie kaart bekeken is",
                ].map((punt) => (
                  <li key={punt} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#D59C76" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {punt}
                  </li>
                ))}
              </ul>
              <Link
                href="/digitale-uitnodiging"
                className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 self-start"
                style={{ backgroundColor: "#D59C76", color: "#07353A", textDecoration: "none" }}
              >
                Alles over de digitale uitnodiging →
              </Link>
              <Link
                href="/kaart-voorbeeld"
                className="text-sm font-semibold transition-opacity hover:opacity-80 self-start"
                style={{ color: "#D59C76", textDecoration: "none" }}
              >
                Bekijk een voorbeeldkaart →
              </Link>
              <Link
                href="/tips/digitale-trouwkaart-versturen-whatsapp"
                className="text-sm font-semibold transition-opacity hover:opacity-80 self-start"
                style={{ color: "#D59C76", textDecoration: "none" }}
              >
                Lees: digitale trouwkaart versturen via WhatsApp →
              </Link>
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
              Geen ingewikkelde systemen, maar een unieke, doordachte builder waarin je binnen een paar klikken alles aanpast, vanaf je desktop én rechtstreeks op je telefoon. Zie live je wijzigingen en beheer moeiteloos je gasten op één centraal dashboard.
            </p>
            <ul className="flex flex-col gap-3 mt-1">
              {[
                "Live preview terwijl je bouwt",
                "Stijl, kleuren en lettertypen in één klik",
                "Volledig te bouwen op desktop én telefoon",
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
                title: "Unieke Digitale RSVP",
                body: "Vergeet saaie ja/nee-kaarten. Vraag gasten naar dieetwensen, overnachting, hun verzoeknummer voor de DJ of stel zelf unieke vragen toe. Alle antwoorden stromen live binnen op jullie persoonlijke dashboard.",
              },
              {
                path: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
                title: "Privacy & Wachtwoord",
                body: "Scherm jullie héle trouwwebsite in één klap af met een persoonlijk wachtwoord of geheime vraag. Dankzij slimme 90% typefout-tolerantie komen gasten er altijd gemakkelijk in, maar blijven ongenode pottenkijkers buiten.",
              },
              {
                path: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
                title: "Kies je Eigen Subdomein",
                body: "Geen cryptische, onleesbare links. Jullie kiezen zelf een uniek en herkenbaar webadres, bijvoorbeeld jullienamen.sayingyes.nl. Strak, chic en supermakkelijk te onthouden voor alle gasten.",
              },
              {
                path: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
                title: "Slimme Meertaligheid",
                body: "Internationale gasten op de uitnodigingslijst? Geen stress. Met één druk op de knop vertalen buitenlandse bezoekers de complete website direct naar hun eigen taal.",
              },
              {
                path: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
                title: "Programma & Cadeautips",
                body: "Presenteer de dagindeling prachtig visueel en overzichtelijk. Voeg een stijlvol cadeautip-lijstje of digitale envelop toe, zodat gasten vooraf precies weten hoe ze jullie écht blij kunnen maken.",
              },
              {
                path: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
                title: "Gratis Fotogalerij",
                body: "Deel na de grote dag moeiteloos alle magische momenten. Upload trouwfoto's in hoge kwaliteit en geef gasten gratis toegang om herinneringen te bekijken en direct te downloaden.",
              },
              {
                path: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
                title: "Altijd Flexibel",
                body: "Plannen gewijzigd? Geen paniek. Zelfs na publicatie passen jullie de lay-out, teksten of URL op elk moment aan, ook snel even vanaf de telefoon. Staat iets niet goed? In een paar tikken opgelost.",
              },
              {
                path: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3M9 21h.008v.008H9V21zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
                title: "Smartphone-Proof",
                body: "Onze websites zijn mobile-first ontworpen. Route, dresscode, programma: alles laadt razendsnel en ziet er op elke smartphone spectaculair uit. En de builder zelf? Die gebruik je volledig op je telefoon, zodat je overal en altijd aanpassingen kunt doen.",
              },
              {
                path: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
                title: "Export voor Locatie & Cateraar",
                body: "Geen gedoe met handmatig overtypen in Excel. Met één muisklik exporteren jullie alle RSVP-antwoorden, dieetwensen en hotelovernachtingen naar een overzichtelijk bestand, direct klaar voor ceremoniemeester, locatie of cateraar.",
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
              Begin klein.<br />Groei mee met jullie planning.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "#8A7E72" }}>
              Drie pakketten, één product. Upgraden kan altijd: je betaalt alleen het verschil en alles blijft staan.
            </p>
          </div>

          {/* Drie pakketten */}
          <div className="grid gap-4 md:grid-cols-3 mb-5">
            {PLAN_ORDER.map((p) => {
              const info = PLANS[p]
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
                  {uitgelicht && (
                    <span
                      className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: GOLD, color: DARK }}
                    >
                      Alles erop en eraan
                    </span>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: GOLD }}>
                    {info.label}
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span
                      className="leading-none"
                      style={{ fontFamily: "var(--font-cormorant)", fontSize: "3.25rem", fontWeight: 700, color: "#FAF7F2" }}
                    >
                      {formatEur(info.price).replace(",00", "")}
                    </span>
                  </div>
                  <p className="text-xs mb-5" style={{ color: "#8A7E72" }}>{info.moment}</p>
                  <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                    {info.features.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check />
                        <span className="text-sm leading-relaxed" style={{ color: "#B5A995" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/aanmaken?plan=${p}`}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                    style={
                      uitgelicht
                        ? { backgroundColor: GOLD, color: DARK, boxShadow: `0 8px 32px ${GOLD}40` }
                        : { backgroundColor: "transparent", color: "#FAF7F2", border: `1px solid ${GOLD}60` }
                    }
                  >
                    Start gratis
                  </Link>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-center mb-10" style={{ color: "#4A4030" }}>
            Eenmalige betaling · Kaartpakketten zonder einddatum · Geen abonnement
          </p>

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
                Daarna: volledige vrijheid
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#8A7E72" }}>
                De complete trouwwebsite staat minimaal een jaar online en in elk geval tot een maand na de bruiloft, daarna loopt hij automatisch af. Geen verrassingen.
                Willen jullie hem langer online houden? Verleng per 6 maanden voor{" "}
                <span style={{ color: "#FAF7F2", fontWeight: 600 }}>€22</span>.
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
          5b. VEELGESTELDE VRAGEN (+ FAQPage-schema)
      ════════════════════════════════════════ */}
      <section className="py-28 sm:py-32 px-6" style={{ backgroundColor: SAND }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ_ITEMS.map(([vraag, antwoord]) => ({
                "@type": "Question",
                name: vraag,
                acceptedAnswer: { "@type": "Answer", text: antwoord },
              })),
            }),
          }}
        />
        <style>{`summary::-webkit-details-marker { display: none; }`}</style>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOLD }}>
              Veelgestelde vragen
            </p>
            <h2
              className="text-4xl sm:text-5xl leading-tight mb-6"
              style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}
            >
              Alles wat je wilt weten
            </h2>
            <Ornament />
          </div>

          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map(([vraag, antwoord]) => (
              <details
                key={vraag}
                className="group rounded-2xl border"
                style={{ backgroundColor: "#FFFDF9", borderColor: `${GOLD_LIGHT}80` }}
              >
                <summary
                  className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 text-base font-semibold"
                  style={{ color: CHARCOAL }}
                >
                  {vraag}
                  <span
                    className="flex-shrink-0 text-xl leading-none transition-transform duration-300 group-open:rotate-45"
                    style={{ color: GOLD }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed" style={{ color: BODY }}>
                  {antwoord}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          5c. LAATSTE TIPS (interne links naar de artikelen)
      ════════════════════════════════════════ */}
      <section className="py-24 sm:py-28 px-6" style={{ backgroundColor: IVORY }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOLD }}>
              Tips &amp; gidsen
            </p>
            <h2
              className="text-4xl sm:text-5xl leading-tight mb-6"
              style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}
            >
              Slim voorbereid op jullie grote dag
            </h2>
            <Ornament />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {laatsteTips.map((tip) => (
              <Link
                key={tip.slug}
                href={`/tips/${tip.slug}`}
                className="group flex flex-col rounded-2xl p-7 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ backgroundColor: "#FFFDF9", borderColor: `${GOLD_LIGHT}60`, textDecoration: "none" }}
              >
                <h3
                  className="mb-3"
                  style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.35rem", fontWeight: 700, color: CHARCOAL, lineHeight: 1.25 }}
                >
                  {tip.title}
                </h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: BODY }}>
                  {tip.description}
                </p>
                <span className="inline-flex items-center gap-1 mt-5 text-xs font-semibold transition-opacity group-hover:opacity-70" style={{ color: GOLD }}>
                  Lees verder →
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/tips"
              className="text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: GOLD, textDecoration: "none" }}
            >
              Alle tips &amp; gidsen →
            </Link>
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
            Start vandaag nog: jullie website is in minuten klaar.
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
            Vanaf €15 · Eenmalig · Geen abonnement
          </p>
          <p className="mt-2 text-xs" style={{ color: BODY }}>
            Gratis starten, pas betalen als je 100% tevreden bent
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
        <span className="mx-3" style={{ color: "#2A2218" }}>·</span>
        <a
          href="/contact"
          className="hover:opacity-70 transition-opacity"
          style={{ color: "#4A4030", textDecoration: "none" }}
        >
          Contact
        </a>
        <span className="mx-3" style={{ color: "#2A2218" }}>·</span>
        <a
          href="/voorwaarden"
          className="hover:opacity-70 transition-opacity"
          style={{ color: "#4A4030", textDecoration: "none" }}
        >
          Algemene Voorwaarden
        </a>
      </footer>
    </div>
  )
}
