import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { rijOfNiets } from "@/lib/db"
import { agendaAntwoord, agendaBestand } from "@/lib/agenda"
import { siteNamen } from "@/lib/site-opening"
import { eventSiteUrl } from "@/lib/site-url"

export const dynamic = "force-dynamic"

// De knop "Zet in je agenda" in de opening van de trouwsite. Dezelfde
// afspraak als vanaf de kaart (app/kaart/[token]/agenda/route.ts), zodat een
// gast die allebei opslaat één afspraak houdt.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createServiceClient()
  const event = rijOfNiets(await supabase
    .from("events")
    .select("id, title, nav_title, frame_names, datum, locatie")
    .eq("slug", slug)
    .eq("status", "published")
    .single(), "Website")
  if (!event?.datum) notFound()

  const dag = new Date(event.datum as string)
  if (Number.isNaN(dag.getTime())) notFound()

  const namen = siteNamen(event as { frame_names?: string | null; nav_title?: string | null; title?: string | null })
  return agendaAntwoord(agendaBestand({
    uid: `bruiloft-${event.id}@sayingyes.nl`,
    dag,
    titel: `Bruiloft ${namen}`,
    locatie: event.locatie as string | null,
    url: eventSiteUrl(slug),
  }))
}
