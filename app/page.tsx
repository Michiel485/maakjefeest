import type { Metadata } from "next"
import Link from "next/link"
import ResetGoogleTranslate from "@/components/ResetGoogleTranslate"
import Kop, { Ornament, Pijl, Vinkje } from "@/components/marketing/Kop"
import Voet from "@/components/marketing/Voet"
import NamenProef from "@/components/marketing/NamenProef"
import { DONKER, DONKER_KAART, DONKER_TEKST, DONKER_ZACHT, GOUD, GOUD_LICHT, GOUD_VLAK, INKT, IVOOR, IVOOR_KAART, KOP_FONT, TEKST, ZAND } from "@/components/marketing/stijl"
import { MARKETING_URL } from "@/lib/site-url"
import { getAllTips } from "@/lib/tips"
import { PLANS, PLAN_ORDER, RENEWAL_MONTHS, RENEWAL_PRICE, formatEur, planStartUrl, upgradeHint } from "@/lib/plans"
import CardReveal from "./kaart/[token]/card-reveal"
import { getStyleConfig } from "@/lib/event-styles"
import { VOORBEELD, VOORBEELD_SITE_URL, voorbeeldKaart, voorbeeldOpening } from "@/lib/voorbeeld"

// De homepage van SayingYes (ontwerpronde, ronde 7, 2 oktober 2026). Eén
// ding: laten zien hoe het is om zo'n kaart te krijgen. Niet vertellen.
// Bovenaan typ je je namen en zie je een echte kaart; daaronder gaat de
// envelop open. De woorden uit de schrijfwijzer: de trouwkaart vooraan, de
// website als de grote broer erachter, want "trouwwebsite" wordt bijna niet
// gezocht en "digitale trouwkaart" wel.

const euro = (n: number) => formatEur(n).replace(",00", "")
const PRIJS_KAART = euro(PLANS.save_the_date.price)
const PRIJS_SITE = euro(PLANS.compleet.price)

const TITEL = "Digitale trouwkaart via WhatsApp, met jullie eigen trouwwebsite"
const OMSCHRIJVING = `Maak jullie digitale trouwkaart of Save the Date en verstuur hem via WhatsApp. Gasten reageren met één tik. Gratis ontwerpen, ${PRIJS_KAART} als je verstuurt. Trouwwebsite erbij voor ${PRIJS_SITE}.`

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

const STAPPEN: [string, string][] = [
  ["Ontwerpen", "Typ jullie namen, kies een ontwerp en pas de tekst aan. Een kaart per gastengroep als je wilt: daggasten, avondgasten, in een andere taal."],
  ["Versturen via WhatsApp", "Je krijgt een link. Die plak je in WhatsApp of in een mail. Of je zet de QR-code op een papieren kaart."],
  ["Reacties in je gastenlijst", "Wie antwoordt staat meteen in je gastenlijst, met dieetwensen en aantallen. Je ziet wie nog stil is en stuurt die met één knop een herinnering."],
]

export default function Home() {
  // De drie nieuwste artikelen: interne links vanaf de voorpagina naar de tips
  const laatsteTips = getAllTips().slice(0, 3)
  const demoSc = getStyleConfig(VOORBEELD.stijl)

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
      <section className="px-6 pt-14 pb-20 sm:pt-20 sm:pb-28" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>
              Digitale trouwkaart en trouwwebsite
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-5 tracking-tight"
              style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}
            >
              Jullie trouwkaart, <em style={{ fontStyle: "italic", color: GOUD }}>klaar in vijf minuten.</em>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: TEKST }}>
              Verstuur hem via WhatsApp. Gasten laten met één tik weten of ze erbij zijn. En als je wilt, groeit dezelfde kaart uit tot jullie hele trouwwebsite.
            </p>
          </div>
          <NamenProef />
        </div>
      </section>

      {/* ── 2. De envelop ── */}
      <section className="py-24 sm:py-28 px-6" style={{ backgroundColor: ZAND }}>
        <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Zo komt hij aan</p>
            <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              Een envelop die opengaat
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: TEKST }}>
              Dit is wat jullie gasten zien als ze op de link tikken: een envelop met lakzegel in jullie stijl, de kaart erin, en eronder de knop om te laten weten of ze komen. Probeer het hiernaast, en tik daarna op Bekijk onze website.
            </p>
            <ul className="flex flex-col gap-3 mb-8">
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
            <Link href="/kaart-voorbeeld" className="text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>
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

      {/* ── 3. Drie stappen ── */}
      <section className="py-24 sm:py-28 px-6" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Zo werkt het</p>
            <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              Drie stappen, een kwartier
            </h2>
            <Ornament />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STAPPEN.map(([kop, tekst], i) => (
              <div key={kop} className="rounded-3xl p-8" style={{ backgroundColor: IVOOR_KAART, border: `1px solid ${GOUD_LICHT}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5 text-sm font-bold" style={{ backgroundColor: GOUD, color: DONKER }}>
                  {i + 1}
                </div>
                <h3 className="text-2xl mb-3" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>{kop}</h3>
                <p className="text-sm leading-relaxed" style={{ color: TEKST }}>{tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Van kaart naar website: de echte voorbeeldsite in een telefoon ── */}
      <section className="py-24 sm:py-28 px-6" style={{ backgroundColor: GOUD_VLAK }}>
        <div className="max-w-5xl mx-auto grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Van kaart naar website</p>
            <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              Dezelfde stijl, van envelop tot gastenboek
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: TEKST }}>
              Begin met een Save the Date. Maak er later de trouwkaart van, met aanmelden en een gastenlijst. En zet er als je wilt de hele website achter: de kaart gaat als twee deuren open en daar staat jullie site, in dezelfde kleuren en letters. Hiernaast staat de echte site van Sophie en Daan. Scroll er doorheen.
            </p>
            <ul className="flex flex-col gap-3 mb-8">
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
            <p className="text-sm leading-relaxed mb-8" style={{ color: TEKST }}>
              Vijftien stijlen, elk met zijn eigen kleuren en letters. Je kiest er een voor de kaart en de site samen, of een andere voor de site.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <Link href={VOORBEELD_SITE_URL} className="text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>
                Bekijk de voorbeeldsite op een hele pagina &rarr;
              </Link>
              <Link href="/trouwwebsite-maken" className="text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>
                Alles over de trouwwebsite &rarr;
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            {/* Een telefoon met de voorbeeldsite erin, live en scrollbaar */}
            <div
              className="relative"
              style={{ width: 330, maxWidth: "100%", aspectRatio: "330 / 680", borderRadius: 44, border: `11px solid ${INKT}`, backgroundColor: INKT, boxShadow: "0 30px 60px rgba(0,0,0,0.22)", overflow: "hidden" }}
            >
              <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 z-10" style={{ width: 110, height: 22, borderRadius: "0 0 16px 16px", backgroundColor: INKT }} />
              <iframe
                src={`${VOORBEELD_SITE_URL}#home`}
                title="Voorbeeld van een trouwwebsite van SayingYes"
                loading="lazy"
                className="block w-full h-full"
                style={{ border: 0, borderRadius: 33, backgroundColor: demoSc.bodyBg }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Prijzen ── */}
      <section className="py-24 sm:py-28 px-6" style={{ backgroundColor: DONKER }}>
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

          <div className="grid gap-4 md:grid-cols-3 mb-5">
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

      {/* ── 6. Waarom wij: onze eigen bruiloft ── */}
      <section className="py-24 sm:py-28 px-6" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Waarom SayingYes</p>
          <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
            Gebouwd voor onze eigen bruiloft
          </h2>
          <Ornament />
          <p className="text-base leading-relaxed mt-8 mb-5" style={{ color: TEKST }}>
            SayingYes begon als de trouwkaart en de website voor onze eigen bruiloft, op 5 maart 2027. We wilden geen papieren kaarten achterna bellen, geen lijstje in een spreadsheet, en geen foto&apos;s van gasten die nooit aankomen. Dus bouwden we het zelf: een kaart die via WhatsApp gaat, een gastenlijst die zichzelf vult, en een fotomuur voor op de dag.
          </p>
          <p className="text-base leading-relaxed" style={{ color: TEKST }}>
            Alles wat je hier ziet gebruiken wij zelf. Mis je iets of werkt iets niet lekker? Antwoord op een van onze mails, wij lezen mee.
          </p>
          <p className="mt-8 text-sm" style={{ fontFamily: KOP_FONT, fontSize: "1.4rem", color: INKT }}>Michiel &amp; Lindsey</p>
        </div>
      </section>

      {/* ── 7. Veelgestelde vragen (+ FAQPage-schema) ── */}
      <section className="py-24 sm:py-28 px-6" style={{ backgroundColor: ZAND }}>
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
      <section className="py-24 sm:py-28 px-6" style={{ backgroundColor: IVOOR }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Tips &amp; gidsen</p>
            <h2 className="text-4xl sm:text-5xl leading-tight mb-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              Slim voorbereid op jullie dag
            </h2>
            <Ornament />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {laatsteTips.map((tip) => (
              <Link
                key={tip.slug}
                href={`/tips/${tip.slug}`}
                className="group flex flex-col rounded-2xl p-7 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
      <section className="py-28 px-6 text-center" style={{ backgroundColor: IVOOR_KAART }}>
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
    </div>
  )
}
