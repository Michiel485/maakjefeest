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
    // Viewport — neutral bg fills the whole screen behind the card
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F4F2", fontFamily: sc.fontFamily }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}

      {/* Card — floating centered block on desktop, fullscreen on mobile */}
      <div
        className="max-w-4xl mx-auto flex flex-col overflow-hidden sm:my-10 sm:rounded-2xl sm:shadow-2xl"
        style={{ minHeight: "100vh", backgroundColor: sc.navBg }}
      >
        <EventNav title={event.title} pages={pageList} sc={sc} />

        <main style={{ flex: 1 }}>
          {children}
        </main>

        <footer style={{
          borderTop: `1px solid ${sc.accent}20`,
          padding: "20px 32px",
          textAlign: "center",
          fontSize: "0.75rem",
          color: sc.bodyText,
        }}>
          Gemaakt met{" "}
          <a href="https://maakjefeest.nl" style={{ fontWeight: 600, color: sc.accent, textDecoration: "none" }}>
            maakjefeest.nl
          </a>
        </footer>
      </div>
    </div>
  )
}
