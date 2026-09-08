import type { Metadata } from "next"
import { getStyleConfig } from "@/lib/event-styles"
import CardReveal from "../kaart/[token]/card-reveal"

export const metadata: Metadata = {
  title: "Voorbeeld: digitale trouwkaart — SayingYes",
  description:
    "Zo ontvangt een gast jullie digitale trouwkaart: een envelop met lakzegel die opent in de stijl van jullie trouwsite. Bekijk het voorbeeld.",
  alternates: { canonical: "https://sayingyes.nl/kaart-voorbeeld" },
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
      }}
      initials="S&D"
      sc={sc}
      siteUrl={null}
      rsvpUrl={null}
      demo
    />
  )
}
