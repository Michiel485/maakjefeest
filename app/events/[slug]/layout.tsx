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
    .select("id, title, style, nav_layout")
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

  const basePath = process.env.NODE_ENV === "production" ? "" : `/events/${slug}`

  return (
    <div className="min-h-screen bg-slate-50 sm:py-12" style={{ fontFamily: sc.fontFamily }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}

      <div className="max-w-4xl mx-auto bg-white sm:shadow-2xl sm:rounded-2xl overflow-clip min-h-[85vh] flex flex-col">

        <EventNav title={event.title} pages={pageList} sc={sc} navLayout={(event.nav_layout ?? "split") as "stacked" | "split" | "left"} basePath={basePath} />

        <main className="flex-grow">
          {children}
        </main>

        <footer className="py-6 text-center text-sm" style={{ color: sc.bodyText, borderTop: `1px solid ${sc.accent}15` }}>
          Gemaakt met{" "}
          <a href="https://sayingyes.nl" style={{ fontWeight: 600, color: sc.accent, textDecoration: "none" }}>
            Saying Yes
          </a>
        </footer>

      </div>
    </div>
  )
}
