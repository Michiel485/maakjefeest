import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"

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
  const navPages = (pages ?? []).filter((p) => p.type !== "home")

  return (
    <div style={{ minHeight: "100vh", backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}

      {/* Nav */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        backgroundColor: sc.navBg,
        borderBottom: `1px solid ${sc.accent}22`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a
            href={`/events/${slug}`}
            style={{ fontSize: "0.9375rem", fontWeight: 800, letterSpacing: "-0.02em", color: sc.accent, fontFamily: sc.fontFamily, textDecoration: "none", flexShrink: 0, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {event.title}
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: 2, overflowX: "auto" }}>
            <a href={`/events/${slug}`} style={{ fontSize: "0.75rem", fontWeight: 600, color: sc.navText, padding: "6px 12px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
              Home
            </a>
            {navPages.map((page) => (
              <a
                key={page.type}
                href={`/events/${slug}/${page.type}`}
                style={{ fontSize: "0.75rem", fontWeight: 600, color: sc.navText, padding: "6px 12px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                {page.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {children}

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${sc.accent}20`, padding: "28px 0", textAlign: "center", fontSize: "0.75rem", color: sc.bodyText }}>
        Gemaakt met{" "}
        <a href="https://maakjefeest.nl" style={{ fontWeight: 600, color: sc.accent, textDecoration: "none" }}>
          maakjefeest.nl
        </a>
      </footer>
    </div>
  )
}
