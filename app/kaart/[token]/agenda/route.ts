import { notFound } from "next/navigation"
import { buildCardDisplay } from "@/lib/cards"
import { fetchCardByToken, isOpenbaar } from "@/lib/cards-server"
import { eventSiteUrl } from "@/lib/site-url"
import { agendaAntwoord, agendaBestand } from "@/lib/agenda"

export const dynamic = "force-dynamic"

// De datum in de agenda van de gast zetten.
//
// Op een Save the Date staat letterlijk "zet de datum alvast in je agenda", en
// er was geen enkele manier om dat te doen. Dit is een agendabestand: de gast
// tikt erop en zijn telefoon biedt aan het op te slaan. Precies waar een Save
// the Date voor bestaat, en papier kan het niet.
//
// Een hele dag, geen tijdstip; waarom staat in lib/agenda.ts. Dezelfde
// afspraak als vanaf de trouwsite (app/events/[slug]/agenda/route.ts).

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const data = await fetchCardByToken(token)
  if (!data) notFound()
  if (!isOpenbaar(data)) notFound()

  const { card, event } = data
  if (!event.datum) notFound()

  const dag = new Date(event.datum)
  if (Number.isNaN(dag.getTime())) notFound()

  const display = buildCardDisplay(card.type, card.template, card.content, event)
  const titel = `Bruiloft ${display.names}`
  const omschrijving = [display.timeText, display.inviteLine].filter(Boolean).join("\n")

  return agendaAntwoord(agendaBestand({
    uid: `bruiloft-${card.event_id}@sayingyes.nl`,
    dag,
    titel,
    locatie: display.location,
    omschrijving,
    url: eventSiteUrl(event.slug),
  }))
}
