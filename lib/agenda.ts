// Een agendabestand (iCalendar) voor de trouwdag, voor de knop "Zet in je
// agenda" op de kaart en op de trouwsite. Een hele dag, geen tijdstip: de
// tijden zijn vrije tekst ("Van 13:30 tot 23:00 uur") en daar valt geen
// betrouwbaar begin- en eindtijdstip uit te halen. Een dag die klopt is beter
// dan een tijd die ernaast zit; de tekst zelf staat in de omschrijving.

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

export function agendaBestand({
  uid,
  dag,
  titel,
  locatie,
  omschrijving,
  url,
}: {
  /** Uniek en stabiel, zodat een tweede keer opslaan de afspraak bijwerkt in plaats van er een tweede naast te zetten */
  uid: string
  dag: Date
  titel: string
  locatie?: string | null
  omschrijving?: string | null
  url?: string | null
}): string {
  // Een hele dag loopt in iCalendar tot en met de dag erna, exclusief
  const eind = new Date(dag)
  eind.setUTCDate(eind.getUTCDate() + 1)

  const regels = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SayingYes//Kaart//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${datumStempel(new Date())}T000000Z`,
    `DTSTART;VALUE=DATE:${datumStempel(dag)}`,
    `DTEND;VALUE=DATE:${datumStempel(eind)}`,
    `SUMMARY:${ics(titel)}`,
    ...(locatie ? [`LOCATION:${ics(locatie)}`] : []),
    ...(omschrijving ? [`DESCRIPTION:${ics(omschrijving)}`] : []),
    ...(url ? [`URL:${url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  // iCalendar wil regels met CRLF afsluiten
  return regels.join("\r\n") + "\r\n"
}

export function agendaAntwoord(inhoud: string): Response {
  return new Response(inhoud, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="bruiloft.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
