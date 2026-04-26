import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig, TYPE_LABEL, formatDate } from "@/lib/event-styles"
import EventHomePreview from "@/components/EventHomePreview"

export default async function EventHomePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, type, title, datum, locatie, style, hero_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) {
    return (
      <div className="py-20 px-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagina niet gevonden</h1>
        <p className="text-sm text-gray-500">Deze eventwebsite bestaat niet of is nog niet gepubliceerd.</p>
      </div>
    )
  }

  const { data: homePage } = await supabase
    .from("pages")
    .select("content")
    .eq("event_id", event.id)
    .eq("type", "home")
    .eq("is_enabled", true)
    .single()

  const sc = getStyleConfig(event.style)
  const c = homePage?.content ?? {}

  return (
    <EventHomePreview
      typeLabel={TYPE_LABEL[event.type] ?? "Evenement"}
      title={event.title}
      datumFormatted={event.datum ? formatDate(event.datum) : null}
      locatie={event.locatie ?? null}
      heroImageUrl={event.hero_image_url ?? null}
      heroOverlay={true}
      homeTitle={typeof c.title === "string" ? c.title : null}
      homeBody={typeof c.body === "string" ? c.body : null}
      homeAlign={(c.align as "left" | "center" | "right") ?? "center"}
      sc={sc}
    />
  )
}
