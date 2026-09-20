// De publieke kaartlink, de link die naar de gasten gaat.
//
// Gecached en op de achtergrond verversd: honderd gasten die tegelijk dezelfde
// envelop openen kosten zo niet honderd queries, en de kaart blijft werken als
// de database er even uit ligt. Na activeren ververst verversEvent() deze
// pagina meteen.
//
// Bewust geen cookie hier. Een gecachte pagina mag er geen lezen, Next weigert
// dat met "page changed from static to dynamic at runtime". De voorbeeldweergave
// voor het bruidspaar staat daarom in /kaart/[token]/voorbeeld.
export const revalidate = 60

// Leeg, maar verplicht: zonder generateStaticParams cachet Next een route met
// een dynamisch stuk in het pad helemaal niet, ook niet met revalidate erbij.
// Zie node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// generate-static-params.md. Niets vooraf renderen dus, maar wel bewaren zodra
// een pagina een keer is opgevraagd.
export async function generateStaticParams() {
  return []
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { buildCardDisplay, CARD_TYPE_LABEL } from "@/lib/cards"
import { fetchCardByToken, isOpenbaar } from "@/lib/cards-server"
import { KaartWeergave, NogNietActief } from "./weergave"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params

  // Bij een storing in de database mag de metadata de pagina niet naar een 404
  // duwen: "deze kaart bestaat niet" is dan een leugen tegen de gast. De
  // pagina zelf loopt op dezelfde fout en geeft een eerlijke storingsmelding.
  let data: Awaited<ReturnType<typeof fetchCardByToken>>
  try {
    data = await fetchCardByToken(token)
  } catch {
    return { title: "Kaart", robots: { index: false, follow: false } }
  }
  if (!data) return { title: "Kaart niet gevonden" }

  const geenIndex = { index: false, follow: false, googleBot: { index: false, follow: false } }

  // Nog niet geactiveerd, of een soort kaart dat niet in het afgenomen pakket
  // zit: geen namen, datum of locatie prijsgeven, ook niet in de voorvertoning
  // die WhatsApp of Facebook van de link maakt.
  if (!isOpenbaar(data)) {
    return { title: "Kaart nog niet verstuurd", description: "Deze kaart is nog niet geactiveerd.", robots: geenIndex }
  }

  const display = buildCardDisplay(data.card.type, data.card.template, data.card.content, data.event)
  const parts = [display.dateText, display.location].filter(Boolean).join(" • ")

  return {
    title: `${CARD_TYPE_LABEL[data.card.type]} van ${display.names}`,
    description: parts || display.message,
    robots: geenIndex,
  }
}

export default async function KaartPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await fetchCardByToken(token)
  if (!data) notFound()

  if (!isOpenbaar(data)) return <NogNietActief plan={data.event.plan} />

  // Kijkteller: niet hier. Deze render zit in de cache, dus honderd gasten
  // zouden samen een tik geven. De browser van de gast meldt het, zie
  // components/KaartKijkTeller.tsx.
  return <KaartWeergave data={data} isEigenaar={false} telMee />
}
