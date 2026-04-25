import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig, TYPE_LABEL, formatDate } from "@/lib/event-styles"

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
  const hasPhoto = !!event.hero_image_url
  const c = homePage?.content ?? {}
  const homeTitle = typeof c.title === "string" ? c.title : null
  const homeBody = typeof c.body === "string" ? c.body : null
  const homeAlign = (c.align as string) || "center"

  return (
    <>
      {/* ── Hero — fills the card width ── */}
      <section
        className="w-full py-16 px-8 text-center relative overflow-hidden"
        style={
          hasPhoto
            ? {
                backgroundImage: `url(${event.hero_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: sc.heroGradient }
        }
      >
        {hasPhoto && (
          <div className="absolute inset-0" style={{ backgroundColor: sc.accent, opacity: 0.45 }} />
        )}

        <div className="relative z-10">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
            style={{
              color: hasPhoto ? "#fff" : sc.labelColor,
              backgroundColor: hasPhoto ? "rgba(255,255,255,0.2)" : `${sc.accent}15`,
            }}
          >
            {TYPE_LABEL[event.type] ?? "Evenement"}
          </span>

          <h1
            className="text-5xl font-extrabold leading-tight mb-3"
            style={{ color: hasPhoto ? "#fff" : sc.headingColor, fontFamily: sc.fontFamily }}
          >
            {event.title}
          </h1>

          {event.datum && (
            <p className="text-sm mb-1" style={{ color: hasPhoto ? "rgba(255,255,255,0.85)" : sc.bodyText }}>
              {formatDate(event.datum)}
            </p>
          )}

          {event.locatie && (
            <p className="text-sm mb-7" style={{ color: hasPhoto ? "rgba(255,255,255,0.85)" : sc.bodyText }}>
              {event.locatie}
            </p>
          )}

          <a
            href="/rsvp"
            className="inline-block text-sm font-bold px-7 py-3 rounded-xl"
            style={{
              backgroundColor: sc.buttonBg,
              color: sc.buttonText,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            Meld je aan
          </a>
        </div>
      </section>

      {/* ── Home content ── */}
      {(homeTitle || homeBody) && (
        <div className="px-8 py-10">
          {homeTitle && (
            <p
              className="font-bold text-base mb-2"
              style={{
                color: sc.headingColor,
                fontFamily: sc.fontFamily,
                textAlign: homeAlign as React.CSSProperties["textAlign"],
              }}
            >
              {homeTitle}
            </p>
          )}
          {homeBody && (
            <div
              className="text-[0.9375rem] leading-relaxed"
              style={{
                color: sc.bodyText,
                fontFamily: sc.fontFamily,
                textAlign: homeAlign as React.CSSProperties["textAlign"],
              }}
              dangerouslySetInnerHTML={{ __html: homeBody }}
            />
          )}
        </div>
      )}
    </>
  )
}
