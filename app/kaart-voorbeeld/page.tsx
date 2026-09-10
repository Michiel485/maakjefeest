import type { Metadata } from "next"
import { getStyleConfig } from "@/lib/event-styles"
import { MARKETING_URL } from "@/lib/site-url"
import CardReveal from "../kaart/[token]/card-reveal"

export const metadata: Metadata = {
  title: "Voorbeeld van een digitale trouwkaart",
  description:
    "Zo ontvangt een gast jullie digitale trouwkaart: een envelop met lakzegel die opent in de stijl van jullie trouwsite. Bekijk het voorbeeld.",
  alternates: { canonical: `${MARKETING_URL}/kaart-voorbeeld` },
  openGraph: {
    title: "Voorbeeld van een digitale trouwkaart",
    description:
      "Een envelop met lakzegel die opent in de stijl van jullie trouwsite. Zo ziet een digitale trouwkaart van SayingYes eruit.",
    url: `${MARKETING_URL}/kaart-voorbeeld`,
    siteName: "SayingYes",
    locale: "nl_NL",
    type: "website",
  },
}

// Vaste demokaart voor de marketingsite — geen database nodig
export default function KaartVoorbeeldPage() {
  const sc = getStyleConfig("emerald")

  return (
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
      }}
      initials="S&D"
      sc={sc}
      siteUrl={null}
      rsvpUrl={null}
      demo
    />
  )
}
