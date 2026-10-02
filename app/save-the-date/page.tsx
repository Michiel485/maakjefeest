import type { Metadata } from "next"
import Zoekpagina, { type ZoekpaginaInhoud } from "@/components/marketing/Zoekpagina"
import { MARKETING_URL } from "@/lib/site-url"
import { PLANS, formatEur } from "@/lib/plans"

const PRIJS = formatEur(PLANS.save_the_date.price).replace(",00", "")
const TITEL = "Digitale Save the Date maken en versturen via WhatsApp"
const OMSCHRIJVING = `Zet de datum alvast bij je gasten in de agenda: een digitale Save the Date als envelop-link via WhatsApp, met een knop om de dag in de agenda te zetten. Gratis ontwerpen, ${PRIJS} als je verstuurt.`

export const metadata: Metadata = {
  title: TITEL,
  description: OMSCHRIJVING,
  alternates: { canonical: `${MARKETING_URL}/save-the-date` },
  openGraph: { title: TITEL, description: OMSCHRIJVING, url: `${MARKETING_URL}/save-the-date`, siteName: "SayingYes", locale: "nl_NL", type: "website" },
}

const inhoud: ZoekpaginaInhoud = {
  kopje: "Save the Date",
  h1: <>Een Save the Date die <em style={{ fontStyle: "italic", color: "#C5A059" }}>meteen in de agenda staat</em></>,
  intro: "Een papieren Save the Date hangt op de koelkast; een digitale zet de dag met één tik in de agenda van je gasten. Je verstuurt hem als link via WhatsApp, en wie wil laat alvast weten of hij erbij is.",
  stappen: [
    ["Maak de kaart", "Typ jullie namen en de datum, kies een ontwerp. Meer hoeft er op een Save the Date niet op."],
    ["Verstuur de link", "Plak de link in WhatsApp of in een mail. Bij je gasten opent een envelop met lakzegel in jullie stijl."],
    ["De datum staat vast", "Gasten zetten de dag in hun agenda en laten alvast weten of ze erbij zijn. Zo begint je gastenlijst zich te vullen, maanden voor de trouwkaart."],
  ],
  voordelenKop: "Waarom een digitale Save the Date?",
  voordelenTekst: "Een Save the Date stuur je een half jaar of langer van tevoren. Het enige dat telt is dat de datum blijft hangen, en dat is precies wat een agendaknop doet.",
  voordelen: [
    "Een knop die de trouwdag in de agenda van je gasten zet",
    "Alvast een ja of nee, zodat je weet hoeveel kaarten je straks nodig hebt",
    "Kijkteller: zie wie hem opende",
    "Later wordt dezelfde link jullie trouwkaart, zonder bij te betalen voor de Save the Date",
    "Ook als afbeelding te downloaden voor Instagram of de koelkast",
    "Geen einddatum: de link blijft werken",
  ],
  faq: [
    ["Wat kost een digitale Save the Date?", `Ontwerpen is gratis. Je betaalt ${PRIJS} als je hem verstuurt, eenmalig, zonder einddatum. Kies je later de trouwkaart of de website, dan telt wat je nu betaalde mee.`],
    ["Wanneer stuur je een Save the Date?", "Zes tot twaalf maanden voor de bruiloft, en eerder als er gasten uit het buitenland komen of als je in een vakantieperiode trouwt. De trouwkaart zelf volgt dan zo'n twee tot drie maanden van tevoren."],
    ["Wat zet je op een Save the Date?", "Jullie namen, de datum en eventueel de plaats. Geen tijden en geen programma: die komen op de trouwkaart. Een korte zin als 'houd de dag vrij, de uitnodiging volgt' is genoeg."],
    ["Kunnen gasten al reageren?", "Ja, met een voorlopig ja of nee. Dat vult je gastenlijst alvast, en bij de trouwkaart vraag je de rest: aantallen, dieetwensen, overnachten."],
  ],
  pakket: "save_the_date",
  artikelen: [
    ["/tips/save-the-date-versturen-wanneer-en-hoe", "Save the Date versturen: wanneer en wat erop moet"],
    ["/tips/wat-zet-je-op-een-trouwkaart", "Wat zet je op een trouwkaart? Complete checklist"],
    ["/tips/digitale-trouwkaart-vs-trouwwebsite", "Digitale trouwkaart of trouwwebsite: wat kies je?"],
  ],
}

export default function SaveTheDatePage() {
  return <Zoekpagina inhoud={inhoud} />
}
