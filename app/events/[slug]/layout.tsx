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
    <div className="min-h-screen sm:py-12" style={{ fontFamily: sc.fontFamily, backgroundColor: sc.bodyBg }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}
      {sc.floral && (
        <style>{`
          .bohemian-scale .text-xs   { font-size: 0.85rem; }
          .bohemian-scale .text-sm   { font-size: 1rem; }
          .bohemian-scale .text-base { font-size: 1.13rem; }
          .bohemian-scale .text-lg   { font-size: 1.27rem; }
          .bohemian-scale .text-xl   { font-size: 1.43rem; }
          .bohemian-scale .text-2xl  { font-size: 1.7rem; }
          .bohemian-scale .text-3xl  { font-size: 2.1rem; }
          .bohemian-scale .text-4xl  { font-size: 2.55rem; }
          .bohemian-scale .text-5xl  { font-size: 3.3rem; }
          .bohemian-scale             { font-size: 1.1rem; }
        `}</style>
      )}

      <div className={`max-w-4xl mx-auto sm:shadow-2xl sm:rounded-2xl overflow-clip min-h-[85vh] flex flex-col relative${sc.floral ? " bohemian-scale" : ""}`}
        style={{ backgroundColor: sc.navBg }}>

        <EventNav title={event.title} pages={pageList} sc={sc} navLayout={(event.nav_layout ?? "split") as "stacked" | "split" | "left"} basePath={basePath} />

        <main className="flex-grow relative" style={{ zIndex: 1 }}>
          {children}
        </main>

        {sc.floral && (
          <svg width="220" height="180" viewBox="0 0 220 180" fill="none" aria-hidden="true"
            style={{ position: "absolute", bottom: 0, right: 0, pointerEvents: "none", zIndex: 0 }}>
            {/* Stengel: (218,178) → knooppunt (148,100) → bloem (128,50) */}
            <path d="M218 178 C195 155 168 128 148 100 C133 78 128 60 128 50"
              stroke="#6B8A5A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Blad links — start exact op knooppunt (148,100) */}
            <path d="M148 100 C138 92 124 87 120 76 C128 72 142 81 148 100Z"
              fill="#7A9468" opacity="0.78"/>
            {/* Blad rechts */}
            <path d="M148 100 C158 92 172 87 176 76 C168 72 154 81 148 100Z"
              fill="#8B9E7A" opacity="0.70"/>
            {/* Grote bloem bij (128,50) — 6 blaadjes groeien vanuit midden */}
            <g transform="translate(128,50)">
              <path d="M0 0 C-12 -8 -12 -28 0 -32 C12 -28 12 -8 0 0" fill="#F5EDD8" opacity="0.90" transform="rotate(0)"/>
              <path d="M0 0 C-12 -8 -12 -28 0 -32 C12 -28 12 -8 0 0" fill="#EFE4CC" opacity="0.88" transform="rotate(60)"/>
              <path d="M0 0 C-12 -8 -12 -28 0 -32 C12 -28 12 -8 0 0" fill="#F5EDD8" opacity="0.87" transform="rotate(120)"/>
              <path d="M0 0 C-12 -8 -12 -28 0 -32 C12 -28 12 -8 0 0" fill="#EFE4CC" opacity="0.87" transform="rotate(180)"/>
              <path d="M0 0 C-12 -8 -12 -28 0 -32 C12 -28 12 -8 0 0" fill="#F5EDD8" opacity="0.87" transform="rotate(240)"/>
              <path d="M0 0 C-12 -8 -12 -28 0 -32 C12 -28 12 -8 0 0" fill="#EFE4CC" opacity="0.87" transform="rotate(300)"/>
            </g>
            <circle cx="128" cy="50" r="10" fill="#E8D5A8" opacity="0.95"/>
            <circle cx="128" cy="50" r="6"  fill="#D4B87A" opacity="0.92"/>
            <circle cx="128" cy="50" r="3"  fill="#C4A265" opacity="0.90"/>
          </svg>
        )}

        <footer className="py-6 text-center text-sm relative" style={{ zIndex: 1, color: sc.bodyText, borderTop: `1px solid ${sc.accent}15` }}>
          Gemaakt met{" "}
          <a href="https://sayingyes.nl" style={{ fontWeight: 600, color: sc.accent, textDecoration: "none" }}>
            Saying Yes
          </a>
        </footer>

      </div>
    </div>
  )
}
