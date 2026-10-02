import type { Metadata } from "next"
import Link from "next/link"
import { getStyleConfig } from "@/lib/event-styles"
import { MARKETING_URL } from "@/lib/site-url"
import CardReveal from "../kaart/[token]/card-reveal"
import { displayTeksten } from "@/lib/cards"
import Kop, { Pijl } from "@/components/marketing/Kop"
import Voet from "@/components/marketing/Voet"
import { GOUD, INKT, IVOOR, KOP_FONT, TEKST } from "@/components/marketing/stijl"

export const metadata: Metadata = {
  title: "Voorbeeld van een digitale trouwkaart",
  description:
    "Zo ontvangt een gast jullie digitale trouwkaart: een envelop met lakzegel die opent in jullie stijl, met aanmelden eronder. Bekijk het voorbeeld.",
  alternates: { canonical: `${MARKETING_URL}/kaart-voorbeeld` },
  openGraph: {
    title: "Voorbeeld van een digitale trouwkaart",
    description: "Een envelop met lakzegel die opent in jullie stijl. Zo ziet een digitale trouwkaart van SayingYes eruit.",
    url: `${MARKETING_URL}/kaart-voorbeeld`,
    siteName: "SayingYes",
    locale: "nl_NL",
    type: "website",
  },
}

// Vaste demokaart voor de marketingsite, geen database nodig. Op een echte
// pagina met kop en voet: eerst stond hij kaal, zonder uitleg en zonder weg
// terug (ontwerpronde, ronde 7).
export default function KaartVoorbeeldPage() {
  const sc = getStyleConfig("emerald")

  return (
    <div style={{ backgroundColor: IVOOR }} className="min-h-screen antialiased">
      <Kop startHref="/start?pakket=uitnodiging" />
      <section className="px-6 pt-14 pb-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: GOUD }}>Voorbeeldkaart</p>
          <h1 className="text-4xl sm:text-5xl leading-[1.08] mb-5" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 700 }}>
            Zo ontvangen je gasten de kaart
          </h1>
          <p className="text-base leading-relaxed" style={{ color: TEKST }}>
            Tik op het zegel. De envelop gaat open, de kaart komt eruit, en eronder staat het aanmelden in drie stappen. Dit is de kaart van Sophie en Daan; die van jullie krijgt jullie namen, kleuren en tekst.
          </p>
        </div>
      </section>
      <CardReveal
        display={{
          heading: "Wij gaan trouwen",
          names: "Sophie & Daan",
          dateText: "12 juni 2027",
          location: "Landgoed Duno, Doorwerth",
          inviteLine: "Wij nodigen je van harte uit voor onze hele trouwdag",
          timeText: "Van 13:00 tot 23:00 uur",
          message: "Wij gaan trouwen en vieren dat graag met jou. Kom je ook?",
          photoUrl: null,
          design: "sierlijk",
          // De demo op de marketingsite mag het mooiste laten zien
          animatie: "feestelijk",
          ...displayTeksten("nl"),
        }}
        initials="S&D"
        sc={sc}
        siteUrl={null}
        rsvpUrl={null}
        demo
      />
      <section className="px-6 py-16 text-center">
        <Link
          href="/start?pakket=uitnodiging"
          className="inline-flex items-center gap-2.5 text-base font-semibold px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
          style={{ backgroundColor: INKT, color: IVOOR, textDecoration: "none" }}
        >
          Maak jullie eigen kaart
          <Pijl />
        </Link>
        <p className="mt-4 text-xs" style={{ color: TEKST }}>Gratis ontwerpen, je betaalt pas als je verstuurt.</p>
      </section>
      <Voet />
    </div>
  )
}
