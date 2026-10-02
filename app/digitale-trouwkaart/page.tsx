import type { Metadata } from "next"
import Zoekpagina, { type ZoekpaginaInhoud } from "@/components/marketing/Zoekpagina"
import { MARKETING_URL } from "@/lib/site-url"
import { PLANS, formatEur } from "@/lib/plans"

const PRIJS = formatEur(PLANS.uitnodiging.price).replace(",00", "")
const TITEL = "Digitale trouwkaart maken en versturen via WhatsApp"
const OMSCHRIJVING = `Maak jullie digitale trouwkaart in vijf minuten en verstuur hem via WhatsApp. Gasten melden zich aan met één tik, met dieetwensen en aantallen. Gratis ontwerpen, ${PRIJS} als je verstuurt.`

export const metadata: Metadata = {
  title: TITEL,
  description: OMSCHRIJVING,
  alternates: { canonical: `${MARKETING_URL}/digitale-trouwkaart` },
  openGraph: { title: TITEL, description: OMSCHRIJVING, url: `${MARKETING_URL}/digitale-trouwkaart`, siteName: "SayingYes", locale: "nl_NL", type: "website" },
}

const inhoud: ZoekpaginaInhoud = {
  kopje: "Digitale trouwkaart",
  h1: <>Een digitale trouwkaart die <em style={{ fontStyle: "italic", color: "#C5A059" }}>gasten met één tik beantwoorden</em></>,
  intro: "Geen drukwerk, geen postzegels, geen appjes achterna. Jullie trouwkaart gaat als link via WhatsApp, opent bij je gasten als een envelop met lakzegel, en eronder staat de knop om te laten weten of ze erbij zijn.",
  stappen: [
    ["Maak de kaart", "Typ jullie namen, kies een van de ontwerpen en pas de tekst aan. Een eigen kaart per gastengroep als je wilt: daggasten, avondgasten, of in een andere taal."],
    ["Verstuur de link", "Kopieer de link en plak hem in WhatsApp, een groepsapp of een mail. Of zet de QR-code op een papieren kaart."],
    ["Gasten reageren met één tik", "Ben je erbij, met wie, en wat zijn je wensen: in drie stappen. Jullie zien alles meteen in de gastenlijst en exporteren het voor de cateraar."],
  ],
  voordelenKop: "Een trouwkaart die werkt, niet alleen mooi is",
  voordelenTekst: "Een papieren kaart is prachtig, maar het werk begint erna: wie heeft gereageerd, wie is vegetariër, wie komt met kinderen? Bij een digitale trouwkaart zit dat ingebouwd. En verandert er iets, dan zien gasten via dezelfde link altijd de nieuwste versie.",
  voordelen: [
    "Aanmelden met naam, aantal personen, kinderen en dieetwensen",
    "Aparte kaarten voor daggasten, avondgasten en receptie, met eigen tijden",
    "De trouwdag met één tik in de agenda van je gasten",
    "Kijkteller: zie wie de kaart opende en wie je nog even moet appen",
    "Herinnering naar wie nog stil is, met één knop uit je gastenlijst",
    "Groeit mee: dezelfde kaart krijgt later een knop naar jullie trouwwebsite",
  ],
  faq: [
    ["Wat kost een digitale trouwkaart?", `Ontwerpen is gratis. Je betaalt ${PRIJS} als je de kaart verstuurt, eenmalig, zonder einddatum. De Save the Date zit erbij, en meerdere kaarten per bruiloft ook.`],
    ["Hoe verstuur ik de kaart?", "Je krijgt een link. Die plak je in WhatsApp of in een mail, of je zet de QR-code op een papieren kaart. Elke gast kan ook een persoonlijke link krijgen, zodat zijn naam al is ingevuld."],
    ["Kan ik de kaart nog aanpassen na het versturen?", "Ja. Dezelfde link laat altijd de nieuwste kaart zien. Een tijd veranderd? Je gasten zien het de volgende keer dat ze de link openen, en je kunt ze er met één knop over mailen."],
    ["Krijgen gasten een bevestiging?", "Ja, in de kleuren van jullie kaart, met de datum, de locatie en een routeknop, en de trouwdag als agendabestand. Antwoorden ze op die mail, dan komt dat bij jullie terecht."],
    ["Kan de kaart ook in het Engels?", "Ja. Nederlands, Engels, Duits, Frans, Spaans en Italiaans, inclusief het aanmeldformulier."],
  ],
  pakket: "uitnodiging",
  artikelen: [
    ["/tips/wat-zet-je-op-een-trouwkaart", "Wat zet je op een trouwkaart? Complete checklist"],
    ["/tips/trouwkaart-tekst-daggasten-avondgasten", "Trouwkaart tekst: voorbeelden voor dag- en avondgast"],
    ["/tips/digitale-trouwkaart-versturen-whatsapp", "Digitale trouwkaart versturen via WhatsApp"],
  ],
}

export default function DigitaleTrouwkaartPage() {
  return <Zoekpagina inhoud={inhoud} />
}
