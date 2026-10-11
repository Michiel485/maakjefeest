import type { Metadata } from "next"
import Link from "next/link"
import ResetGoogleTranslate from "@/components/ResetGoogleTranslate"
import Kop, { Ornament, Pijl, Vinkje } from "@/components/marketing/Kop"
import Voet from "@/components/marketing/Voet"
import NamenProef from "@/components/marketing/NamenProef"
import StartBalk from "@/components/marketing/StartBalk"
import { HUISHOUDENS, PORTO_RONDE } from "@/lib/papier"
import { DONKER, DONKER_KAART, DONKER_TEKST, DONKER_ZACHT, GOUD, GOUD_LICHT, GOUD_VLAK, INKT, IVOOR, IVOOR_KAART, KOP_FONT, TEKST, ZAND } from "@/components/marketing/stijl"
import { MARKETING_URL } from "@/lib/site-url"
import { getAllTips } from "@/lib/tips"
import { PLANS, PLAN_ORDER, RENEWAL_MONTHS, RENEWAL_PRICE, formatEur, planStartUrl, upgradeHint } from "@/lib/plans"
import CardReveal from "./kaart/[token]/card-reveal"
import { VOORBEELD, VOORBEELD_SITE_URL, voorbeeldKaart, voorbeeldOpening, voorbeeldStijl } from "@/lib/voorbeeld"

// De homepage van SayingYes (ontwerpronde, ronde 7, 2 oktober 2026). Sinds 11
// oktober 2026 eerst de boodschap: alles in één, voor minder dan de
// postzegels van papieren kaarten; daarna laten zien hoe het is om zo'n kaart
// te krijgen.
// Bovenaan typ je je namen en zie je een echte kaart; daaronder gaat de
// envelop open. De woorden uit de schrijfwijzer: de trouwkaart vooraan, de
// website als de grote broer erachter, want "trouwwebsite" wordt bijna niet
// gezocht en "digitale trouwkaart" wel.

const euro = (n: number) => formatEur(n).replace(",00", "")
const PRIJS_KAART = euro(PLANS.save_the_date.price)
const PRIJS_SITE = euro(PLANS.compleet.price)

// Alles in één, goedkoper dan papier (Michiel, 11 oktober 2026): dat is waar
// SayingYes om bekend moet staan, niet alleen de kaart
const TITEL = "Digitale trouwkaart, gastenlijst en trouwwebsite in één"
const OMSCHRIJVING = `Save the Date, trouwkaart, gastenlijst en trouwwebsite in één. Verstuur via WhatsApp, gasten reageren met één tik. Vanaf ${PRIJS_KAART}, eenmalig: goedkoper dan de postzegels.`

// De rekensom tegenover papier staat in lib/papier.ts. Een blok met de
// vergelijking stond hier kort onder de kop; dat was te veel (Michiel, 11
// oktober 2026).

export const metadata: Metadata = {
  // Absolute titel: de root-template zou er anders een tweede "| SayingYes" achter zetten
  title: { absolute: `${TITEL} | SayingYes` },
  description: OMSCHRIJVING,
  alternates: { canonical: MARKETING_URL },
  openGraph: {
    title: `${TITEL} | SayingYes`,
    description: OMSCHRIJVING,
    url: MARKETING_URL,
    siteName: "SayingYes",
    locale: "nl_NL",
    type: "website",
  },
}

// Veelgestelde vragen: zichtbaar op de pagina en als FAQPage-schema voor Google.
// De prijzen komen uit lib/plans.ts, zodat ze nooit uit de pas lopen.
const FAQ_ITEMS: [string, string][] = [
  [
    "Wat kost SayingYes?",
    `Een digitale Save the Date kost eenmalig ${PRIJS_KAART}, de trouwkaart met aanmelden en gastenlijst ${euro(PLANS.uitnodiging.price)}, en de complete trouwwebsite met alles erop en eraan ${PRIJS_SITE} voor een jaar. Upgraden kan altijd, je betaalt dan alleen het verschil. Ontwerpen is gratis: je betaalt pas als je jullie kaart verstuurt of de site live zet. Geen abonnement.`,
  ],
  [
    "Waarom digitaal in plaats van papier?",
    `Omdat het een fractie kost en meer doet. Alleen de postzegels voor ${HUISHOUDENS} papieren kaarten zijn al ${euro(PORTO_RONDE)} (PostNL, 2026), en met een Save the Date erbij het dubbele, nog zonder drukwerk en enveloppen. Een digitale kaart verstuur je via WhatsApp, gasten reageren met één tik, de gastenlijst vult zich vanzelf, en verander je iets, dan zien ze meteen de nieuwste versie.`,
  ],
  [
    "Kan ik papier en digitaal combineren?",
    "Ja. Veel stellen sturen een paar papieren kaarten naar de naaste familie. Zet daar de QR-code van jullie digitale kaart op: wie scant, komt op dezelfde kaart en meldt zich daar aan. Zo staat iedereen in één gastenlijst.",
  ],
  [
    "Hoe krijgen gasten de kaart?",
    "Als link, via WhatsApp of mail. Bij je gasten opent een envelop met lakzegel in jullie stijl, en daar is de kaart. Met de knop eronder laten ze meteen weten of ze erbij zijn, met hoeveel en met welke dieetwensen. Verander je later iets, dan zien ze via dezelfde link altijd de nieuwste versie.",
  ],
  [
    "Heb ik technische kennis nodig?",
    "Nee. Je typt jullie namen, kiest een ontwerp en past de tekst aan. Alles werkt vanaf je telefoon, dus je kunt op de bank verder. Een kaart staat in vijf minuten, een complete trouwwebsite in een kwartier.",
  ],
  [
    "Wat zit er in de trouwwebsite?",
    "Een eigen adres zoals jullienamen.sayingyes.nl, de opening met jullie foto of ontwerp, jullie verhaal, het programma als tijdlijn, praktische informatie met route, cadeautips, de ceremoniemeesters, aanmelden, foto's en een gastenboek. Plus de live fotomuur: gasten scannen een QR-code en hun foto's verschijnen op de muur en op een groot scherm. Bekijk de voorbeeldsite op sayingyes.nl/voorbeeld-site.",
  ],
  [
    "Is onze trouwwebsite privé?",
    "Jullie site verschijnt niet in Google en je kunt hem afschermen met een wachtwoord of een geheime vraag die alleen jullie gasten kennen.",
  ],
  [
    "Werkt het ook voor gasten uit het buitenland?",
    "Ja. De kaart maak je in het Nederlands, Engels, Duits, Frans, Spaans of Italiaans, en de website kunnen gasten in die talen lezen.",
  ],
  [
    "Hoe lang blijft alles online?",
    `De kaartpakketten hebben geen einddatum: jullie kaartlink blijft werken. De complete trouwwebsite staat een jaar online, en in elk geval tot een maand na jullie trouwdatum. Daarna verleng je als je wilt met ${RENEWAL_MONTHS} maanden voor ${euro(RENEWAL_PRICE)}, bijvoorbeeld om de foto's online te houden. Verlengen is nooit verplicht.`,
  ],
]

// Alles wat er in zit, met het pakket waar het bij hoort. Elk pakket bevat de
// kleinere, dus de website heeft alles (lib/plans.ts).
const ALLES: { icoon: string; titel: string; tekst: string; prijs: string }[] = [
  { icoon: "agenda", titel: "Save the Date", tekst: "Zodat iedereen de datum vrijhoudt, met een knop die hem in de agenda zet.", prijs: PRIJS_KAART },
  { icoon: "kaart", titel: "Trouwkaart", tekst: "Per gastengroep: daggasten, avondgasten, en in zes talen.", prijs: euro(PLANS.uitnodiging.price) },
  { icoon: "lijst", titel: "Aanmelden en gastenlijst", tekst: "Wie komt, met hoeveel en welke dieetwensen. De lijst vult zich vanzelf.", prijs: "Gratis erbij" },
  { icoon: "bel", titel: "Herinneringen", tekst: "Met één knop een berichtje naar wie nog niet heeft gereageerd.", prijs: "Gratis erbij" },
  { icoon: "site", titel: "Trouwwebsite", tekst: "Programma, route, cadeautips en jullie verhaal op jullie eigen adres.", prijs: PRIJS_SITE },
  { icoon: "camera", titel: "Fotomuur", tekst: "Gasten scannen een QR-code en hun foto's verschijnen live op de muur.", prijs: PRIJS_SITE },
]

function AllesIcoon({ soort }: { soort: string }) {
  const p = { fill: "none", stroke: GOUD, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" {...p}>
      {soort === "agenda" && <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /><path d="M12 13.2c-.9-1.1-2.6-.6-2.6.8 0 1.3 2.6 2.8 2.6 2.8s2.6-1.5 2.6-2.8c0-1.4-1.7-1.9-2.6-.8z" /></>}
      {soort === "kaart" && <><rect x="3" y="6" width="18" height="13" rx="1.5" /><path d="M3.5 6.5 12 13l8.5-6.5" /></>}
      {soort === "lijst" && <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></>}
      {soort === "bel" && <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></>}
      {soort === "site" && <><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="M3 8.5h18M6 6.5h.01M8.5 6.5h.01" /><path d="M7 12.5h10M7 15.5h6" /></>}
      {soort === "camera" && <><path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4z" /><circle cx="12" cy="13.5" r="3.2" /></>}
    </svg>
  )
}

export default function Home() {
  // De drie nieuwste artikelen: interne links vanaf de voorpagina naar de tips
  const laatsteTips = getAllTips().slice(0, 3)
  const demoSc = voorbeeldStijl()

  return (
    <div style={{ backgroundColor: IVOOR }} className="min-h-screen antialiased">
      <ResetGoogleTranslate />
      <Kop />

      {/* Wat we verkopen, voor Google: de drie pakketten met hun prijs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "SayingYes digitale trouwkaart en trouwwebsite",
            description: OMSCHRIJVING,
            brand: { "@type": "Brand", name: "SayingYes" },
            url: MARKETING_URL,
            offers: PLAN_ORDER.map((p) => ({
              "@type": "Offer",
              name: PLANS[p].label,
              price: PLANS[p].price.toFixed(2),
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
              url: `${MARKETING_URL}${planStartUrl(p)}`,
            })),
          }),
        }}
      />

      {/* ── 1. Typ jullie namen ── */}
      <section id="namen" className="px-6 pt-12 pb-14 sm:pt-16 sm:pb-20" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-6xl mx-auto">
          <NamenProef
            intro={
              <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>
                Digitale trouwkaart en trouwwebsite
              </p>
              <h1
                className="text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.05] mb-5 tracking-tight"
                style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700, textWrap: "balance" }}
              >
                Alles voor jullie bruiloft, <em style={{ fontStyle: "italic", color: GOUD }}>voor minder dan de postzegels.</em>
              </h1>
              <p className="text-base sm:text-lg leading-relaxed" style={{ color: TEKST }}>
                Save the Date, trouwkaart, gastenlijst en trouwwebsite in één. Verstuur via WhatsApp en gasten laten met één tik weten of ze komen. Vanaf {PRIJS_KAART}, eenmalig.
              </p>
            </div>
            }
          />
        </div>
      </section>

      {/* ── 2. De envelop (op de tweede plek, Michiel, 11 oktober 2026) ── */}
      <section className="py-16 sm:py-28 px-6" style={{ backgroundColor: ZAND }}>
        <div className="max-w-6xl mx-auto grid gap-8 lg:gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Zo komt hij aan</p>
            <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              Een envelop die opengaat
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: TEKST }}>
              Dit is wat jullie gasten zien als ze op de link tikken: een envelop met lakzegel in jullie stijl, de kaart erin, en eronder de knop om te laten weten of ze komen. Probeer het hiernaast, en tik daarna op Bekijk onze website.
            </p>
            <ul className="hidden lg:flex flex-col gap-3 mb-8">
              {[
                "Aanmelden met naam, aantal personen en dieetwensen, in drie stappen",
                "De trouwdag met één tik in de agenda van je gasten",
                "Een knop naar jullie website: de kaart gaat open als twee deuren",
                "Later iets veranderd? Dezelfde link laat altijd de nieuwste kaart zien",
              ].map((punt) => (
                <li key={punt} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: TEKST }}>
                  <Vinkje />
                  {punt}
                </li>
              ))}
            </ul>
            <Link href="/kaart-voorbeeld" className="hidden lg:inline text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>
              Bekijk de voorbeeldkaart op een hele pagina &rarr;
            </Link>
          </div>
          <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${GOUD_LICHT}`, boxShadow: "0 24px 60px rgba(0,0,0,0.12)" }}>
            {/* De kaart van Sophie en Daan (lib/voorbeeld.ts). De knop
                "Bekijk onze website" opent de kaart als twee deuren en gaat
                door naar hun voorbeeldsite, precies zoals bij een gast */}
            <CardReveal
              display={voorbeeldKaart()}
              initials={VOORBEELD.initialen}
              sc={demoSc}
              siteUrl={VOORBEELD_SITE_URL}
              siteOpening={voorbeeldOpening()}
              rsvpUrl={null}
              demo
              compact
            />
          </div>
        </div>
      </section>

      {/* ── 3. Van kaart naar website: de echte voorbeeldsite in een telefoon ── */}
      <section className="py-16 sm:py-28 px-6" style={{ backgroundColor: GOUD_VLAK }}>
        <div className="max-w-5xl mx-auto grid gap-8 lg:gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Van kaart naar website</p>
            <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              Dezelfde stijl, van envelop tot gastenboek
            </h2>
            {/* Op de telefoon een korte uitleg en dan meteen het telefoontje;
                de lange tekst en de punten alleen op de laptop (Michiel,
                2 oktober 2026) */}
            <p className="lg:hidden text-base leading-relaxed mb-6" style={{ color: TEKST }}>
              Achter de kaart staat als je wilt jullie hele website, in dezelfde kleuren en letters. Hieronder staat de echte site van Sophie en Daan. Scroll er doorheen.
            </p>
            <p className="hidden lg:block text-base leading-relaxed mb-6" style={{ color: TEKST }}>
              Begin met een Save the Date. Maak er later de trouwkaart van, met aanmelden en een gastenlijst. En zet er als je wilt de hele website achter: de kaart gaat als twee deuren open en daar staat jullie site, in dezelfde kleuren en letters. Hiernaast staat de echte site van Sophie en Daan. Scroll er doorheen.
            </p>
            <ul className="hidden lg:flex flex-col gap-3 mb-8">
              {[
                "De opening met jullie foto en het ontwerp van de kaart, met de dagen aftellen",
                "Jullie verhaal in momenten en het programma als getekende tijdlijn",
                "Route, dresscode, cadeautips en de ceremoniemeesters met WhatsApp",
                "Aanmelden in drie stappen, op de dag zelf de fotomuur, daarna het gastenboek",
              ].map((punt) => (
                <li key={punt} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: TEKST }}>
                  <Vinkje />
                  {punt}
                </li>
              ))}
            </ul>
            <p className="hidden lg:block text-sm leading-relaxed mb-8" style={{ color: TEKST }}>
              Vijftien stijlen, elk met zijn eigen kleuren en letters. Je kiest er een voor de kaart en de site samen, of een andere voor de site.
            </p>
            <div className="hidden lg:flex flex-wrap gap-x-6 gap-y-3">
              <Link href={VOORBEELD_SITE_URL} className="text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>
                Bekijk de voorbeeldsite op een hele pagina &rarr;
              </Link>
              <Link href="/trouwwebsite-maken" className="text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>
                Alles over de trouwwebsite &rarr;
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            {/* Een telefoon met de voorbeeldsite erin, live en scrollbaar.
                Zonder #home in het adres: die sprong trok op de telefoon de
                hele homepage mee naar beneden zodra het telefoontje laadde
                (Michiel, 4 oktober 2026) */}
            <div
              className="relative"
              style={{ width: 330, maxWidth: "100%", aspectRatio: "330 / 680", borderRadius: 44, border: `11px solid ${INKT}`, backgroundColor: INKT, boxShadow: "0 30px 60px rgba(0,0,0,0.22)", overflow: "hidden" }}
            >
              <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 z-10" style={{ width: 110, height: 22, borderRadius: "0 0 16px 16px", backgroundColor: INKT }} />
              <iframe
                src={VOORBEELD_SITE_URL}
                title="Voorbeeld van een trouwwebsite van SayingYes"
                loading="lazy"
                className="block w-full h-full"
                style={{ border: 0, borderRadius: 33, backgroundColor: demoSc.bodyBg }}
              />
            </div>
          </div>
          <div className="lg:hidden flex flex-col items-center gap-3 text-center">
            <Link href={VOORBEELD_SITE_URL} className="text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>
              Bekijk de voorbeeldsite op een hele pagina &rarr;
            </Link>
            <Link href="/trouwwebsite-maken" className="text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>
              Alles over de trouwwebsite &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Prijzen ── */}
      <section className="py-16 sm:py-28 px-6" style={{ backgroundColor: DONKER }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Prijzen</p>
            <h2 className="text-4xl sm:text-5xl mb-4 leading-tight" style={{ fontFamily: KOP_FONT, color: IVOOR, fontWeight: 700 }}>
              Begin klein, groei mee
            </h2>
            <p className="text-base leading-relaxed" style={{ color: DONKER_ZACHT }}>
              Drie pakketten, één product. Upgraden kan altijd: je betaalt alleen het verschil en alles blijft staan.
            </p>
          </div>

          {/* Op de telefoon drie regels, Compleet open en de andere twee na
              een tik; de drie kaarten onder elkaar waren drie schermen
              (Michiel, 2 oktober 2026) */}
          <div className="md:hidden flex flex-col gap-3 mb-5">
            {PLAN_ORDER.map((p) => {
              const info = PLANS[p]
              const uitgelicht = p === "compleet"
              return (
                <details
                  key={p}
                  open={uitgelicht}
                  className="rounded-2xl"
                  style={{ backgroundColor: DONKER_KAART, border: `1px solid ${uitgelicht ? GOUD : "#2A2218"}` }}
                >
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: GOUD }}>{info.label}</span>
                      <span className="block text-xs mt-1" style={{ color: DONKER_ZACHT }}>{info.subtitel}</span>
                    </span>
                    <span className="leading-none flex-shrink-0" style={{ fontFamily: KOP_FONT, fontSize: "1.9rem", fontWeight: 700, color: IVOOR }}>
                      {euro(info.price)}
                    </span>
                  </summary>
                  <div className="px-5 pb-5">
                    <p className="text-xs mb-4 font-semibold" style={{ color: GOUD }}>{upgradeHint(p)}</p>
                    <ul className="flex flex-col gap-2 mb-5">
                      {info.features.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <Vinkje />
                          <span className="text-sm leading-relaxed" style={{ color: DONKER_TEKST }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={planStartUrl(p)}
                      className="flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl"
                      style={uitgelicht ? { backgroundColor: GOUD, color: DONKER, textDecoration: "none" } : { backgroundColor: "transparent", color: IVOOR, border: `1px solid ${GOUD}80`, textDecoration: "none" }}
                    >
                      Start gratis
                    </Link>
                  </div>
                </details>
              )
            })}
          </div>
          <div className="hidden md:grid gap-4 md:grid-cols-3 mb-5">
            {PLAN_ORDER.map((p) => {
              const info = PLANS[p]
              const uitgelicht = p === "compleet"
              return (
                <div
                  key={p}
                  className="rounded-3xl p-7 flex flex-col relative overflow-hidden"
                  style={{
                    backgroundColor: DONKER_KAART,
                    border: `1px solid ${uitgelicht ? GOUD : "#2A2218"}`,
                    boxShadow: uitgelicht ? `0 0 0 1px ${GOUD}40, 0 20px 60px rgba(0,0,0,0.35)` : "none",
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: GOUD }}>{info.label}</p>
                  <span className="leading-none" style={{ fontFamily: KOP_FONT, fontSize: "3.25rem", fontWeight: 700, color: IVOOR }}>
                    {euro(info.price)}
                  </span>
                  <p className="text-xs mt-2" style={{ color: DONKER_ZACHT }}>{info.subtitel}</p>
                  <p className="text-xs mt-1.5 mb-5 font-semibold" style={{ color: GOUD }}>{upgradeHint(p)}</p>
                  <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                    {info.features.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Vinkje />
                        <span className="text-sm leading-relaxed" style={{ color: DONKER_TEKST }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={planStartUrl(p)}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                    style={uitgelicht ? { backgroundColor: GOUD, color: DONKER, boxShadow: `0 8px 32px ${GOUD}40`, textDecoration: "none" } : { backgroundColor: "transparent", color: IVOOR, border: `1px solid ${GOUD}60`, textDecoration: "none" }}
                  >
                    Start gratis
                  </Link>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-center" style={{ color: "#6B6052" }}>
            Eenmalig, geen abonnement. Kaartpakketten zonder einddatum. De website staat een jaar online en in elk geval tot een maand na de bruiloft; daarna verleng je als je wilt met {RENEWAL_MONTHS} maanden voor {euro(RENEWAL_PRICE)}.
          </p>
        </div>
      </section>

      {/* ── 5. Alles in één (na de prijzen, Michiel, 11 oktober 2026) ── */}
      <section id="alles" className="py-16 sm:py-24 px-6 scroll-mt-16" style={{ backgroundColor: ZAND }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Alles in één</p>
            <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700, textWrap: "balance" }}>
              Eén link, één overzicht, één prijs
            </h2>
            <Ornament />
          </div>
          {/* Op de telefoon twee naast elkaar, anders waren het zes schermvullende
              tegels onder elkaar */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {ALLES.map((a) => (
              <div key={a.titel} className="rounded-2xl p-4 sm:p-6 flex flex-col gap-2 sm:gap-3" style={{ backgroundColor: IVOOR_KAART, border: `1px solid ${GOUD_LICHT}` }}>
                <div className="flex items-center justify-between gap-3">
                  <AllesIcoon soort={a.icoon} />
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-right" style={{ color: GOUD }}>{a.prijs}</span>
                </div>
                <h3 className="m-0 text-lg sm:text-xl leading-tight" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>{a.titel}</h3>
                <p className="m-0 text-xs sm:text-sm leading-relaxed" style={{ color: TEKST }}>{a.tekst}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-8 mb-0" style={{ color: TEKST }}>
            Elk pakket bevat het kleinere: met de trouwwebsite heb je alles. Upgraden kan altijd, je betaalt alleen het verschil.
          </p>
        </div>
      </section>

      {/* ── 6. Waarom wij: onze eigen bruiloft ── */}
      <section className="py-16 sm:py-28 px-6" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Waarom SayingYes</p>
          <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
            Gebouwd voor onze eigen bruiloft
          </h2>
          <Ornament />
          <p className="text-base leading-relaxed mt-8 mb-5" style={{ color: TEKST }}>
            SayingYes begon als de trouwkaart en de website voor onze eigen bruiloft, op 24 mei 2026. We wilden geen papieren kaarten achterna bellen, geen lijstje in een spreadsheet, en geen foto&apos;s van gasten die nooit aankomen. Dus bouwden we het zelf: een kaart die via WhatsApp ging, een gastenlijst die zichzelf vulde, en een fotomuur op de dag zelf.
          </p>
          <p className="text-base leading-relaxed" style={{ color: TEKST }}>
            Alles wat je hier ziet hebben wij op onze eigen dag gebruikt. Mis je iets of werkt iets niet lekker? Antwoord op een van onze mails, wij lezen mee.
          </p>
          <p className="mt-8 text-sm" style={{ fontFamily: KOP_FONT, fontSize: "1.4rem", color: INKT }}>Michiel &amp; Lindsey</p>
        </div>
      </section>

      {/* ── 7. Veelgestelde vragen (+ FAQPage-schema) ── */}
      <section className="py-16 sm:py-28 px-6" style={{ backgroundColor: ZAND }}>
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
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Veelgestelde vragen</p>
            <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              Goed om te weten
            </h2>
            <Ornament />
          </div>
          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map(([vraag, antwoord]) => (
              <details key={vraag} className="group rounded-2xl border" style={{ backgroundColor: "#FFFDF9", borderColor: `${GOUD_LICHT}80` }}>
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 text-base font-semibold" style={{ color: INKT }}>
                  {vraag}
                  <span className="flex-shrink-0 text-xl leading-none transition-transform duration-300 group-open:rotate-45" style={{ color: GOUD }} aria-hidden="true">+</span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed" style={{ color: TEKST }}>{antwoord}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Tips ── */}
      <section className="py-16 sm:py-28 px-6" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Tips &amp; gidsen</p>
            <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              Slim voorbereid op jullie dag
            </h2>
            <Ornament />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {laatsteTips.map((tip, i) => (
              <Link
                key={tip.slug}
                href={`/tips/${tip.slug}`}
                className={`group ${i === 0 ? "flex" : "hidden md:flex"} flex-col rounded-2xl p-7 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                style={{ backgroundColor: "#FFFDF9", borderColor: `${GOUD_LICHT}60`, textDecoration: "none" }}
              >
                <h3 className="mb-3" style={{ fontFamily: KOP_FONT, fontSize: "1.35rem", fontWeight: 700, color: INKT, lineHeight: 1.25 }}>{tip.title}</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: TEKST }}>{tip.description}</p>
                <span className="inline-flex items-center gap-1 mt-5 text-xs font-semibold transition-opacity group-hover:opacity-70" style={{ color: GOUD }}>Lees verder &rarr;</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/tips" className="text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: GOUD, textDecoration: "none" }}>
              Alle tips &amp; gidsen &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. Slot ── */}
      <section className="py-20 sm:py-28 px-6 text-center" style={{ backgroundColor: IVOOR_KAART }}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-10"><Ornament /></div>
          <h2 className="text-4xl sm:text-5xl mb-5 leading-tight" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
            Begin met <em style={{ fontStyle: "italic", color: GOUD }}>jullie namen</em>
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: TEKST }}>
            Gratis ontwerpen, zonder account. Je betaalt pas als je de kaart verstuurt.
          </p>
          <Link
            href="/start"
            className="inline-flex items-center gap-2.5 text-base font-semibold px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
            style={{ backgroundColor: INKT, color: IVOOR, boxShadow: "0 8px 32px rgba(26,26,26,0.18)", textDecoration: "none" }}
          >
            Start gratis
            <Pijl />
          </Link>
          <p className="mt-5 text-xs tracking-wide" style={{ color: GOUD }}>
            Vanaf {PRIJS_KAART} &middot; Eenmalig &middot; Geen abonnement
          </p>
        </div>
      </section>

      <Voet />
      <StartBalk naId="namen" />
    </div>
  )
}
