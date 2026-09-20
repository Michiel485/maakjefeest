import { notFound } from "next/navigation"
import { buildCardDisplay } from "@/lib/cards"
import { fetchCardByToken, isOpenbaar } from "@/lib/cards-server"
import { eventSiteUrl } from "@/lib/site-url"

export const dynamic = "force-dynamic"

// De datum in de agenda van de gast zetten.
//
// Op een Save the Date staat letterlijk "zet de datum alvast in je agenda", en
// er was geen enkele manier om dat te doen. Dit is een agendabestand: de gast
// tikt erop en zijn telefoon biedt aan het op te slaan. Precies waar een Save
// the Date voor bestaat, en papier kan het niet.
//
// Een hele dag, geen tijdstip. De tijden op de kaart zijn vrije tekst ("Van
// 13:30 tot 23:00 uur") en daar valt geen betrouwbaar begin- en eindtijdstip
// uit te halen. Een dag die klopt is beter dan een tijd die ernaast zit; de
// tekst zelf staat in de omschrijving.

/** Tekst zoals iCalendar hem wil: geen losse komma's, puntkomma's of enters. */
function ics(waarde: string): string {
  return waarde
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

/** JJJJMMDD, zoals een hele dag in iCalendar wordt geschreven. */
function datumStempel(d: Date): string {
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("")
}

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

  // Een hele dag loopt in iCalendar tot en met de dag erna, exclusief
  const eind = new Date(dag)
  eind.setUTCDate(eind.getUTCDate() + 1)

  const display = buildCardDisplay(card.type, card.template, card.content, event)
  const titel = `Bruiloft ${display.names}`
  const omschrijving = [display.timeText, display.inviteLine].filter(Boolean).join("\n")

  const regels = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SayingYes//Kaart//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Uniek en stabiel, zodat een tweede keer opslaan de afspraak bijwerkt in
    // plaats van er een tweede naast te zetten
    `UID:kaart-${card.share_token}@sayingyes.nl`,
    `DTSTAMP:${datumStempel(new Date())}T000000Z`,
    `DTSTART;VALUE=DATE:${datumStempel(dag)}`,
    `DTEND;VALUE=DATE:${datumStempel(eind)}`,
    `SUMMARY:${ics(titel)}`,
    ...(display.location ? [`LOCATION:${ics(display.location)}`] : []),
    ...(omschrijving ? [`DESCRIPTION:${ics(omschrijving)}`] : []),
    `URL:${eventSiteUrl(event.slug)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]

  // iCalendar wil regels met CRLF afsluiten
  const body = regels.join("\r\n") + "\r\n"

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="bruiloft.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
