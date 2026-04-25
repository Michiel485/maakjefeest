import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import EventNav from "./event-nav"

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, title, style")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) return <>{children}</>

  const { data: pages } = await supabase
    .from("pages")
    .select("type, title, order")
    .eq("event_id", event.id)
    .eq("is_enabled", true)
    .order("order", { ascending: true })

  const sc = getStyleConfig(event.style)
  const pageList = pages ?? []

  return (
    <div style={{ minHeight: "100vh", backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}

      <EventNav title={event.title} pages={pageList} sc={sc} />

      <main style={{ maxWidth: 1024, margin: "0 auto" }}>
        {children}
      </main>

      <footer style={{ borderTop: `1px solid ${sc.accent}20`, padding: "24px 0", textAlign: "center", fontSize: "0.75rem", color: sc.bodyText }}>
        Gemaakt met{" "}
        <a href="https://maakjefeest.nl" style={{ fontWeight: 600, color: sc.accent, textDecoration: "none" }}>
          maakjefeest.nl
        </a>
      </footer>
    </div>
  )
}
