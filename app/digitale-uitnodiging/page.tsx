import type { Metadata } from "next"
import Link from "next/link"
import { MARKETING_URL } from "@/lib/site-url"
import { NavLoginButton } from "@/components/NavLoginButton"
import { PLANS, PLAN_ORDER, formatEur, planStartUrl, upgradeHint } from "@/lib/plans"

const TITLE = "Digitale uitnodiging voor jullie bruiloft via WhatsApp"
const DESCRIPTION =
  "Digitale trouwkaart en Save the Date als envelop-link via WhatsApp. Gasten reageren met één tik, jullie zien alles in het dashboard. Vanaf €15, geen abonnement."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${MARKETING_URL}/digitale-uitnodiging` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${MARKETING_URL}/digitale-uitnodiging`,
    siteName: "SayingYes",
    locale: "nl_NL",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Digitale uitnodiging voor jullie bruiloft" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
}

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
const EMERALD    = "#07353A"
const TERRA      = "#D59C76"

// Veelgestelde vragen: zichtbaar op de pagina en als FAQPage-schema voor Google
const FAQ_ITEMS: [string, string][] = [
  [
    "Wanneer verstuur je een digitale uitnodiging voor je bruiloft?",
    "Een Save the Date stuur je 6 tot 12 maanden vooraf, zodat gasten de datum vrijhouden. De echte uitnodiging volgt 3 tot 4 maanden voor de bruiloft, met een RSVP-deadline van 4 tot 6 weken vooraf. Zo heb je op tijd de aantallen voor de locatie en de cateraar.",
  ],
  [
    "Hoe maak ik onderscheid tussen daggasten en avondgasten?",
    "Je maakt per gastengroep een eigen kaart: daggasten, avondgasten en receptiegasten krijgen elk hun eigen tijden en uitnodigingstekst. Zo weet iedereen precies om hoe laat hij verwacht wordt, zonder ongemakkelijke gesprekken.",
  ],
  [
    "Hoe verstuur ik de uitnodiging via WhatsApp?",
    "Je kopieert de link van de kaart en plakt hem in een WhatsApp-bericht of groepsapp. Bij je gasten opent een envelop met lakzegel in jullie stijl; daaronder staat de knop om te laten weten of ze komen. Je kunt de kaart ook als afbeelding downloaden voor Instagram of om te printen.",
  ],
  [
    "Moeten gasten een app installeren of een account maken?",
    "Nee. De kaart opent in de browser van hun telefoon en reageren gaat via een gewoon formulier: naam, aantal personen, dieetwensen. Ook voor opa en oma zonder ervaring met apps werkt het.",
  ],
  [
    "Wat als er iets verandert, bijvoorbeeld de tijd of de locatie?",
    "Je past de kaart aan in je dashboard en via dezelfde link zien alle gasten meteen de nieuwe versie. Geen herdruk, geen rondbelactie.",
  ],
  [
    "Is een digitale trouwkaart niet onpersoonlijk?",
    "De envelop-animatie met lakzegel en jullie eigen tekst maakt het juist een moment. Veel bruidsparen combineren: een papieren kaart voor op de koelkast bij de naaste familie, en de digitale versie voor het reageren en voor alle andere gasten.",
  ],
  [
    "Wat kost een digitale uitnodiging bij SayingYes?",
    "Een Save the Date kost eenmalig €15. Uitnodigingen per gastengroep met RSVP-pagina en dashboard kosten €25. De complete trouwwebsite met alles erop en eraan kost €49,99 voor een jaar. De kaartpakketten hebben geen einddatum. Upgraden kan altijd, je betaalt dan alleen het verschil. Ontwerpen is gratis; je betaalt pas als je de kaart verstuurt.",
  ],
]

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

function Check({ color = GOLD }: { color?: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Pijl() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}

export default function DigitaleUitnodigingPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  }

  return (
    <div style={{ backgroundColor: IVORY }} className="min-h-screen antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

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
            href="/kaart-maken?type=trouwkaart"
            className="hidden sm:inline-flex text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:opacity-85"
            style={{ backgroundColor: CHARCOAL, color: IVORY }}
          >
            Start gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 sm:pt-28 sm:pb-24" style={{ backgroundColor: EMERALD }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-6" style={{ color: TERRA }}>
            Digitale trouwkaart en Save the Date
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl leading-[1.08] mb-6"
            style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2", fontWeight: 700 }}
          >
            Digitale uitnodiging voor jullie bruiloft,
            <br />
            <em style={{ fontStyle: "italic", color: TERRA }}>verstuurd via WhatsApp</em>
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10" style={{ color: "#E8DDD0" }}>
            Bij jullie gasten opent een envelop met lakzegel in jullie stijl. Eén tik en ze laten weten of ze komen, met hoeveel en met welke dieetwensen. Jullie zien alles terug in het dashboard. Geen drukwerk, geen postzegels, geen appjes achterna.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/kaart-maken?type=trouwkaart"
              className="inline-flex items-center gap-2.5 text-base font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
              style={{ backgroundColor: TERRA, color: EMERALD, boxShadow: "0 8px 32px rgba(213,156,118,0.35)" }}
            >
              Maak jullie uitnodiging gratis
              <Pijl />
            </Link>
            <Link
              href="/kaart-voorbeeld"
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-4 rounded-2xl transition-all hover:opacity-85"
              style={{ color: "#FAF7F2", border: `1px solid ${TERRA}80`, textDecoration: "none" }}
            >
              Bekijk hoe gasten hem ontvangen
            </Link>
          </div>
          <p className="text-xs mt-5" style={{ color: "#E8DDD0", opacity: 0.75 }}>
            Vanaf €15 · Eenmalig · Betalen pas als je verstuurt
          </p>
        </div>
      </section>

      {/* Zo werkt het */}
      <section className="py-24 px-6" style={{ backgroundColor: IVORY }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Ornament />
            <h2 className="text-3xl sm:text-4xl mt-6 mb-3" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}>
              Zo werkt de digitale uitnodiging
            </h2>
            <p className="text-base" style={{ color: BODY }}>Drie stappen, een kwartier werk.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["1", "Maak de kaart", "Kies klassiek of met foto, vul jullie namen, datum en locatie in en pas de tekst aan. Per gastengroep een eigen kaart met eigen tijden: daggasten, avondgasten, receptie."],
              ["2", "Verstuur de link", "Kopieer de link en plak hem in WhatsApp, een groepsapp of een mail. Of download de kaart als afbeelding voor Instagram en de koelkast."],
              ["3", "Gasten reageren met één tik", "De envelop opent, de kaart verschijnt, en met de RSVP-knop laten gasten weten of ze komen. Jullie zien aantallen en dieetwensen direct in het dashboard."],
            ].map(([nr, kop, tekst]) => (
              <div key={nr} className="rounded-3xl p-8" style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5 text-sm font-bold" style={{ backgroundColor: GOLD, color: DARK }}>
                  {nr}
                </div>
                <h3 className="text-xl mb-3" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}>{kop}</h3>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>{tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waarom digitaal */}
      <section className="py-24 px-6" style={{ backgroundColor: SAND }}>
        <div className="max-w-5xl mx-auto grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: GOLD }}>Digitaal of papier?</p>
            <h2 className="text-3xl sm:text-4xl mb-5 leading-tight" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}>
              Een uitnodiging die werkt, niet alleen mooi is
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: BODY }}>
              Een papieren kaart is prachtig, maar het echte werk begint erna: wie heeft gereageerd, wie is vegetariër, wie komt met kinderen? Bij een digitale uitnodiging zit dat ingebouwd. En verandert er iets, dan zien gasten via dezelfde link altijd de nieuwste versie.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "Gasten reageren met één tik: naam, aantal personen, dieetwensen",
                "Aparte kaarten voor daggasten, avondgasten en receptiegasten, met eigen tijden",
                "Eigen uitnodigingstekst per kaart, later nog aan te passen",
                "Kijkteller: zie wie de kaart heeft geopend en wie je nog even moet appen",
                "Ook als afbeelding te downloaden om te printen of te delen",
                "Groeit mee: dezelfde link wordt later jullie complete trouwwebsite",
              ].map((punt) => (
                <li key={punt} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: BODY }}>
                  <Check />
                  {punt}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl p-8 sm:p-10" style={{ backgroundColor: EMERALD }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: TERRA }}>Voorbeeldtekst avondgasten</p>
            <p className="text-lg leading-relaxed mb-6" style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2", fontStyle: "italic" }}>
              &ldquo;Overdag zeggen we ja, maar het echte feest begint als jij binnenkomt. Kom zaterdag 12 juni vanaf 20:30 uur met ons dansen bij Landgoed Duno in Doorwerth.&rdquo;
            </p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#E8DDD0" }}>
              Meer voorbeelden, van formeel tot losjes, staan in ons artikel met trouwkaartteksten per gastengroep.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/tips/trouwkaart-tekst-daggasten-avondgasten" className="text-sm font-semibold" style={{ color: TERRA, textDecoration: "none" }}>
                Trouwkaart tekst: voorbeelden voor dag- en avondgast →
              </Link>
              <Link href="/tips/wat-zet-je-op-een-trouwkaart" className="text-sm font-semibold" style={{ color: TERRA, textDecoration: "none" }}>
                Wat zet je op een trouwkaart? →
              </Link>
              <Link href="/tips/digitale-trouwkaart-versturen-whatsapp" className="text-sm font-semibold" style={{ color: TERRA, textDecoration: "none" }}>
                Digitale trouwkaart versturen via WhatsApp →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pakketten */}
      <section className="py-24 px-6" style={{ backgroundColor: DARK }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: GOLD }}>Kies wat bij jullie moment past</p>
            <h2 className="text-3xl sm:text-4xl mb-3" style={{ fontFamily: "var(--font-cormorant)", color: "#FAF7F2", fontWeight: 700 }}>
              Begin met een kaart, groei door naar de complete site
            </h2>
            <p className="text-base" style={{ color: "#8A7E72" }}>
              Upgraden kan altijd: je betaalt alleen het verschil en alles blijft staan.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PLAN_ORDER.map((p) => {
              const info = PLANS[p]
              const uitgelicht = p === "uitnodiging"
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
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: GOLD }}>{info.label}</p>
                  <p className="leading-none mb-1" style={{ fontFamily: "var(--font-cormorant)", fontSize: "3.25rem", fontWeight: 700, color: "#FAF7F2" }}>
                    {formatEur(info.price).replace(",00", "")}
                  </p>
                  <p className="text-xs" style={{ color: "#8A7E72" }}>{info.subtitel}</p>
                  <p className="text-xs mt-1.5 mb-5 font-semibold" style={{ color: GOLD }}>{upgradeHint(p)}</p>
                  <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                    {info.features.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check />
                        <span className="text-sm leading-relaxed" style={{ color: "#B5A995" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={planStartUrl(p)}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                    style={uitgelicht ? { backgroundColor: GOLD, color: DARK } : { backgroundColor: "transparent", color: "#FAF7F2", border: `1px solid ${GOLD}60` }}
                  >
                    Start gratis
                  </Link>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-center mt-8" style={{ color: "#4A4030" }}>
            Eenmalige betaling · Kaartpakketten zonder einddatum · Geen abonnement
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6" style={{ backgroundColor: IVORY }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Ornament />
            <h2 className="text-3xl sm:text-4xl mt-6" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}>
              Veelgestelde vragen over de digitale uitnodiging
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map(([vraag, antwoord]) => (
              <details key={vraag} className="group rounded-2xl px-6 py-5" style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}>
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base font-semibold" style={{ color: CHARCOAL }}>
                  {vraag}
                  <span className="text-xl transition-transform group-open:rotate-45" style={{ color: GOLD }}>+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: BODY }}>{antwoord}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center" style={{ backgroundColor: GOLD_BG }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 700 }}>
            Klaar om jullie gasten uit te nodigen?
          </h2>
          <p className="text-base mb-8" style={{ color: BODY }}>
            Maak de kaart gratis, bekijk de voorvertoning en betaal pas als je hem verstuurt.
          </p>
          <Link
            href="/kaart-maken?type=trouwkaart"
            className="inline-flex items-center gap-2.5 text-base font-semibold px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
            style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: "0 8px 32px rgba(26,26,26,0.18)" }}
          >
            Start gratis
            <Pijl />
          </Link>
          <p className="mt-5 text-xs" style={{ color: GOLD }}>Vanaf €15 · Eenmalig · Geen abonnement</p>
        </div>
      </section>

      <footer className="py-8 text-center text-xs border-t" style={{ borderColor: `${GOLD_LIGHT}30`, color: "#9A8E82", backgroundColor: IVORY }}>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/" style={{ color: "#9A8E82" }}>Home</Link>
          <Link href="/tips" style={{ color: "#9A8E82" }}>Tips</Link>
          <Link href="/kaart-voorbeeld" style={{ color: "#9A8E82" }}>Voorbeeldkaart</Link>
          <Link href="/privacy" style={{ color: "#9A8E82" }}>Privacy</Link>
          <Link href="/voorwaarden" style={{ color: "#9A8E82" }}>Voorwaarden</Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} SayingYes</p>
      </footer>
    </div>
  )
}
