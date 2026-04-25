import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig, type SC } from "@/lib/event-styles"
import RsvpForm from "../rsvp-form"

interface Page {
  id: string
  type: string
  title: string
  content: Record<string, unknown>
}

export default async function EventSubPage({
  params,
}: {
  params: Promise<{ slug: string; type: string }>
}) {
  const { slug, type } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, style")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) notFound()

  const { data: page } = await supabase
    .from("pages")
    .select("id, type, title, content")
    .eq("event_id", event.id)
    .eq("type", type)
    .eq("is_enabled", true)
    .single<Page>()

  if (!page) notFound()

  const sc = getStyleConfig(event.style)

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "52px 24px 96px" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: sc.headingColor, fontFamily: sc.fontFamily, margin: "0 0 28px" }}>
        {page.title}
      </h1>
      <PageContent page={page} sc={sc} />
    </div>
  )
}

function PageContent({ page, sc }: { page: Page; sc: SC }) {
  const c = page.content ?? {}

  if (page.type === "rsvp") {
    return (
      <div style={{ borderRadius: 16, border: `1px solid ${sc.accent}20`, backgroundColor: `${sc.accent}08`, padding: "28px 32px" }}>
        <p style={{ fontSize: "0.9375rem", marginBottom: 24, color: sc.bodyText }}>
          Laat weten of je erbij bent — vul het formulier in.
        </p>
        <RsvpForm />
      </div>
    )
  }

  if (page.type === "programma") {
    const items = Array.isArray(c.items) ? (c.items as { time: string; description: string }[]) : []
    if (items.length === 0) return <Placeholder sc={sc}>Het programma wordt binnenkort toegevoegd.</Placeholder>
    return (
      <div style={{ border: `1px solid ${sc.accent}20`, borderRadius: 16, overflow: "hidden" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 16, padding: "14px 24px", backgroundColor: i % 2 === 0 ? sc.navBg : `${sc.accent}06` }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, width: 52, flexShrink: 0, paddingTop: 1, color: sc.labelColor }}>
              {item.time}
            </span>
            <p style={{ fontSize: "0.9375rem", color: sc.bodyText, margin: 0 }}>{item.description}</p>
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "praktisch") {
    const items = Array.isArray(c.items) ? (c.items as { label: string; value: string }[]) : []
    if (items.length === 0) return <Placeholder sc={sc}>Praktische informatie wordt binnenkort toegevoegd.</Placeholder>
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{ borderRadius: 14, border: `1px solid ${sc.accent}20`, backgroundColor: `${sc.accent}06`, padding: 18 }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4, color: sc.labelColor }}>
              {item.label}
            </p>
            <p style={{ fontWeight: 600, color: sc.headingColor, margin: 0, fontSize: "0.9375rem" }}>{item.value}</p>
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "wishlist") {
    const items = Array.isArray(c.items) ? (c.items as { name: string; url?: string; price?: string }[]) : []
    if (items.length === 0) return <Placeholder sc={sc}>De wishlist wordt binnenkort toegevoegd.</Placeholder>
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{ borderRadius: 14, border: `1px solid ${sc.accent}20`, padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: sc.headingColor, margin: 0 }}>{item.name}</p>
              {item.price && <p style={{ fontSize: "0.8125rem", color: sc.bodyText, margin: "3px 0 0" }}>{item.price}</p>}
            </div>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8125rem", fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: `1px solid ${sc.accent}40`, color: sc.accent, textDecoration: "none", flexShrink: 0 }}>
                Bekijk
              </a>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (page.type === "fotos") {
    const urls = Array.isArray(c.urls) ? (c.urls as string[]) : []
    if (urls.length === 0) return <Placeholder sc={sc}>Foto&apos;s worden binnenkort toegevoegd.</Placeholder>
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {urls.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="" style={{ borderRadius: 12, aspectRatio: "1", objectFit: "cover", width: "100%", display: "block" }} />
        ))}
      </div>
    )
  }

  const text = typeof c.text === "string" ? c.text : null
  if (!text) return <Placeholder sc={sc}>Inhoud wordt binnenkort toegevoegd.</Placeholder>
  return <p style={{ lineHeight: 1.75, whiteSpace: "pre-wrap", fontSize: "0.9375rem", color: sc.bodyText, margin: 0 }}>{text}</p>
}

function Placeholder({ children, sc }: { children: React.ReactNode; sc: SC }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${sc.accent}20`, backgroundColor: `${sc.accent}06`, padding: "18px 24px", fontSize: "0.875rem", fontStyle: "italic", color: sc.bodyText }}>
      {children}
    </div>
  )
}
