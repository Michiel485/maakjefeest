import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig, TYPE_LABEL, formatDate } from "@/lib/event-styles"

const PAGE_ICONS: Record<string, string> = {
  programma: "📅",
  rsvp: "✉️",
  praktisch: "📌",
  wishlist: "🎁",
  fotos: "📷",
}

export default async function EventHomePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, type, title, datum, locatie, style, hero_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111", marginBottom: 8 }}>Pagina niet gevonden</h1>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Deze eventwebsite bestaat niet of is nog niet gepubliceerd.</p>
      </div>
    )
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("id, type, title, content, order")
    .eq("event_id", event.id)
    .eq("is_enabled", true)
    .order("order", { ascending: true })

  const pageList = pages ?? []
  const sc = getStyleConfig(event.style)
  const hasPhoto = !!event.hero_image_url

  const homePage = pageList.find((p) => p.type === "home")
  const c = homePage?.content ?? {}
  const homeTitle = typeof c.title === "string" ? c.title : null
  const homeBody = typeof c.body === "string" ? c.body : null
  const homeAlign = (c.align as string) || "center"

  const otherPages = pageList.filter((p) => p.type !== "home")
  const hasRsvp = otherPages.some((p) => p.type === "rsvp")

  return (
    <>
      {/* ── Hero ── */}
      <section
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
            margin: "0 0 20px",
            color: hasPhoto ? "#fff" : sc.headingColor,
            fontFamily: sc.fontFamily,
          }}>
            {event.title}
          </h1>

          <div style={{ display: "flex", flexWrap: "wrap" as const, justifyContent: "center", gap: 12, marginBottom: 36 }}>
            {event.datum && (
              <span style={{ fontSize: "0.875rem", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 999, padding: "6px 16px", color: "#1a1a1a" }}>
                {formatDate(event.datum)}
              </span>
            )}
            {event.locatie && (
              <span style={{ fontSize: "0.875rem", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 999, padding: "6px 16px", color: "#1a1a1a" }}>
                {event.locatie}
              </span>
            )}
          </div>

          {hasRsvp && (
            <a
              href={`/events/${slug}/rsvp`}
              style={{ display: "inline-block", fontSize: "0.9375rem", fontWeight: 700, padding: "12px 28px", borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", backgroundColor: sc.buttonBg, color: sc.buttonText, textDecoration: "none" }}
            >
              Meld je aan
            </a>
          )}
        </div>
      </section>

      {/* ── Welkomstbericht ── */}
      {(homeTitle || homeBody) && (
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "48px 24px 0" }}>
          {homeTitle && (
            <p style={{ fontWeight: 700, margin: "0 0 8px", color: sc.headingColor, fontFamily: sc.fontFamily, textAlign: homeAlign as React.CSSProperties["textAlign"], fontSize: "1.125rem" }}>
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

      {/* ── Navigatiekaarten naar andere pagina's ── */}
      {otherPages.length > 0 && (
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "40px 24px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
            {otherPages.map((page) => (
              <a
                key={page.type}
                href={`/events/${slug}/${page.type}`}
                style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 10, padding: "24px 16px", borderRadius: 16, border: `1px solid ${sc.accent}25`, backgroundColor: `${sc.accent}07`, textDecoration: "none" }}
              >
                <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>{PAGE_ICONS[page.type] ?? "📄"}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: sc.headingColor, fontFamily: sc.fontFamily }}>{page.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
