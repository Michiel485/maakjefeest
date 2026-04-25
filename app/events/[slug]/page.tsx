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
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111", marginBottom: 8 }}>
          Pagina niet gevonden
        </h1>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          Deze eventwebsite bestaat niet of is nog niet gepubliceerd.
        </p>
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
      {/* ── Hero ── */}
      <section
        id="home"
        style={{
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
          ...(hasPhoto
            ? { backgroundImage: `url(${event.hero_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: sc.heroGradient }
          ),
        }}
      >
        {hasPhoto && (
          <div style={{ position: "absolute", inset: 0, backgroundColor: sc.accent, opacity: 0.45 }} />
        )}

        <div style={{ position: "relative", zIndex: 10, maxWidth: 672, margin: "0 auto", padding: "72px 24px 88px" }}>
          <span style={{
            display: "inline-block",
            fontSize: "0.6875rem",
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            marginBottom: 16,
            padding: "4px 12px",
            borderRadius: 999,
            color: hasPhoto ? "#fff" : sc.labelColor,
            backgroundColor: hasPhoto ? "rgba(255,255,255,0.2)" : `${sc.accent}15`,
          }}>
            {TYPE_LABEL[event.type] ?? "Evenement"}
          </span>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: "0 0 12px",
            color: hasPhoto ? "#fff" : sc.headingColor,
            fontFamily: sc.fontFamily,
          }}>
            {event.title}
          </h1>

          {event.datum && (
            <p style={{ fontSize: "0.875rem", margin: "0 0 4px", color: hasPhoto ? "rgba(255,255,255,0.85)" : sc.bodyText }}>
              {formatDate(event.datum)}
            </p>
          )}

          {event.locatie && (
            <p style={{ fontSize: "0.875rem", margin: "0 0 28px", color: hasPhoto ? "rgba(255,255,255,0.85)" : sc.bodyText }}>
              {event.locatie}
            </p>
          )}

          <a
            href="/rsvp"
            style={{ display: "inline-block", fontSize: "0.875rem", fontWeight: 700, padding: "10px 24px", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", backgroundColor: sc.buttonBg, color: sc.buttonText, textDecoration: "none" }}
          >
            Meld je aan
          </a>
        </div>
      </section>

      {/* ── Home content ── */}
      {(homeTitle || homeBody) && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
          {homeTitle && (
            <p style={{ fontWeight: 700, margin: "0 0 8px", color: sc.headingColor, fontFamily: sc.fontFamily, textAlign: homeAlign as React.CSSProperties["textAlign"], fontSize: "1rem" }}>
              {homeTitle}
            </p>
          )}
          {homeBody && (
            <div
              style={{ fontSize: "0.9375rem", lineHeight: 1.75, color: sc.bodyText, fontFamily: sc.fontFamily, textAlign: homeAlign as React.CSSProperties["textAlign"] }}
              dangerouslySetInnerHTML={{ __html: homeBody }}
            />
          )}
        </div>
      )}
    </>
  )
}
