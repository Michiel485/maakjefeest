import type { Metadata } from "next"
import Link from "next/link"
import ResetGoogleTranslate from "@/components/ResetGoogleTranslate"
import Kop, { Ornament, Vinkje } from "@/components/marketing/Kop"
import Voet from "@/components/marketing/Voet"
import TrouwkaartTekst from "@/components/marketing/TrouwkaartTekst"
import { GOUD, GOUD_LICHT, INKT, IVOOR, IVOOR_KAART, KOP_FONT, TEKST, ZAND } from "@/components/marketing/stijl"
import { MARKETING_URL } from "@/lib/site-url"
import { PLANS, formatEur } from "@/lib/plans"

// De tekst-tool (23 oktober 2026): de meest gezochte vraag rond trouwkaarten
// is "trouwkaart tekst", met daggasten en avondgasten erachter. Iedereen die
// erop scoort heeft een lijst voorbeeldzinnen; wij hebben een tool die de
// tekst meteen op een kaart zet, en één knop verder staat hij in de bouwer.

const PRIJS = formatEur(PLANS.uitnodiging.price).replace(",00", "")
const TITEL = "Trouwkaart tekst maken: voorbeelden voor daggasten en avondgasten"
const OMSCHRIJVING = "Kies je gasten en je toon, en je hebt meteen een tekst voor je trouwkaart, met jullie namen, datum en tijden erin. Gratis, en met één knop op een digitale kaart."

export const metadata: Metadata = {
  title: TITEL,
  description: OMSCHRIJVING,
  alternates: { canonical: `${MARKETING_URL}/trouwkaart-tekst` },
  openGraph: { title: TITEL, description: OMSCHRIJVING, url: `${MARKETING_URL}/trouwkaart-tekst`, siteName: "SayingYes", locale: "nl_NL", type: "website" },
}

const FAQ: [string, string][] = [
  ["Wat zet je op een trouwkaart?", "Jullie namen, de datum, de locatie en hoe laat gasten welkom zijn. Daarbij een korte boodschap die bij jullie past, en een zin die om een antwoord vraagt, met een datum erbij. Dresscode en cadeautips mogen, maar hoeven niet op de kaart."],
  ["Wat is het verschil tussen een tekst voor daggasten en avondgasten?", "Daggasten nodig je uit voor de hele dag: ceremonie, diner en feest. Avondgasten komen voor het feest. Op hun kaart staat de tijd van het feest, en de tekst draait het om: het feest is het hoogtepunt, en daar wil je juist hen bij hebben. Maak per groep een eigen kaart, dan weet iedereen waar hij aan toe is."],
  ["Hoe lang moet de tekst op een trouwkaart zijn?", "Kort. Namen, datum, locatie en tijd zijn de feiten; de boodschap is twee of drie zinnen. Alles wat langer is, zoals het programma, de route en de cadeautips, hoort op jullie trouwwebsite."],
  ["Mag ik deze teksten gebruiken op een papieren kaart?", "Ja. Kopieer de tekst en zet hem op je kaart. Wil je ook aanmelden via een link, dan zet je de QR-code van je digitale kaart op de papieren kaart."],
  ["Wat kost een digitale trouwkaart?", `Ontwerpen is gratis. Je betaalt ${PRIJS} als je de kaart verstuurt, eenmalig, zonder einddatum. Meerdere kaarten per bruiloft, bijvoorbeeld voor dag- en avondgasten, zitten erbij.`],
]

const TIPS = [
  "Lees de tekst hardop. Klinkt het als jullie, of als een notaris? Schrap woorden die je in het echt nooit zegt.",
  "Eén toon per kaart. Begin niet plechtig om losjes te eindigen.",
  "Noem de tijd dat gasten er moeten zijn, niet de tijd dat de ceremonie officieel begint.",
  "Sluit af met een vraag en een datum. Zonder vraag krijg je geen antwoord.",
]

export default function TrouwkaartTekstPage() {
  return (
    <div style={{ backgroundColor: IVOOR }} className="min-h-screen antialiased">
      <ResetGoogleTranslate />
      <Kop startHref="/start?pakket=uitnodiging" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map(([vraag, antwoord]) => ({ "@type": "Question", name: vraag, acceptedAnswer: { "@type": "Answer", text: antwoord } })),
          }),
        }}
      />
      <style>{`summary::-webkit-details-marker { display: none; }`}</style>

      <section className="px-6 pt-12 pb-14 sm:pt-16 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Trouwkaart tekst</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.05] mb-5 tracking-tight" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
              De tekst voor jullie trouwkaart, <em style={{ fontStyle: "italic", color: GOUD }}>in één minuut</em>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: TEKST }}>
              Kies voor wie de kaart is en welke toon bij jullie past. Je ziet de tekst meteen op een kaart staan, met jullie namen, de datum en de tijden erin. Kopieer hem voor een papieren kaart, of zet hem met één knop op een digitale kaart die gasten via WhatsApp krijgen.
            </p>
          </div>
          <TrouwkaartTekst />
        </div>
      </section>

      <section className="py-16 sm:py-20 px-6" style={{ backgroundColor: ZAND }}>
        <div className="max-w-5xl mx-auto grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <Ornament />
            <h2 className="text-3xl sm:text-4xl mt-6 mb-5 leading-tight" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>Zelf schrijven? Vier tips</h2>
            <ul className="flex flex-col gap-3">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: TEKST }}>
                  <Vinkje />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl p-8 sm:p-10" style={{ backgroundColor: IVOOR_KAART, border: `1px solid ${GOUD_LICHT}` }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: GOUD }}>Verder lezen</p>
            <div className="flex flex-col gap-3">
              <Link href="/tips/trouwkaart-tekst-daggasten-avondgasten" className="text-sm font-semibold" style={{ color: INKT, textDecoration: "none" }}>Tien voorbeeldteksten voor dag-, avond- en receptiegasten &rarr;</Link>
              <Link href="/tips/wat-zet-je-op-een-trouwkaart" className="text-sm font-semibold" style={{ color: INKT, textDecoration: "none" }}>Wat zet je op een trouwkaart? Complete checklist &rarr;</Link>
              <Link href="/tips/save-the-date-versturen-wanneer-en-hoe" className="text-sm font-semibold" style={{ color: INKT, textDecoration: "none" }}>Save the Date versturen: wanneer en wat erop moet &rarr;</Link>
              <Link href="/digitale-trouwkaart" className="text-sm font-semibold" style={{ color: GOUD, textDecoration: "none" }}>Zo werkt de digitale trouwkaart &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Ornament />
            <h2 className="text-3xl sm:text-4xl mt-6" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>Veelgestelde vragen</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ.map(([vraag, antwoord]) => (
              <details key={vraag} className="group rounded-2xl px-6 py-4" style={{ backgroundColor: IVOOR_KAART, border: `1px solid ${GOUD_LICHT}` }}>
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-base font-semibold" style={{ color: INKT }}>
                  {vraag}
                  <span className="text-xl transition-transform group-open:rotate-45" style={{ color: GOUD }} aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 mb-0 text-sm leading-relaxed" style={{ color: TEKST }}>{antwoord}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Voet />
    </div>
  )
}
