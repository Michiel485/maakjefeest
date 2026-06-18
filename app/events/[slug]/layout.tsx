import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import EventNav from "./event-nav"
import EventGatekeeper from "@/components/EventGatekeeper"
import type { Viewport } from "next"

export const dynamic = "force-dynamic"

export const viewport: Viewport = {
  colorScheme: "only light",
}

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
    .select("id, title, nav_title, frame_names, style, font_frame_names, font_page_titles, nav_layout, pw_enabled, pw_type, pw_value, pw_question, pw_answer, homepage_settings")
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

  const sc = getStyleConfig(event.style, {
    fontFrameNames:  event.font_frame_names  as string | null,
    fontPageTitles:  event.font_page_titles  as string | null,
  })
  const pageList = pages ?? []
  const basePath = process.env.NODE_ENV === "production" ? "" : `/events/${slug}`

  const hs = event.homepage_settings as { siteLayout?: string; pageMode?: string } | null
  const isFullWidth = hs?.siteLayout === 'fullwidth'
  const isSinglePage = hs?.pageMode === 'single'

  const pwEnabled = (event.pw_enabled as boolean) ?? false
  const pwType = (event.pw_type as "password" | "secret_question" | null) ?? null
  const pwValue = (event.pw_value as string | null) ?? null
  const pwQuestion = (event.pw_question as string | null) ?? null
  const pwAnswer = (event.pw_answer as string | null) ?? null

  const siteContent = (
    <div className={`${isFullWidth ? '' : 'max-w-5xl mx-auto sm:shadow-2xl sm:rounded-2xl '}overflow-clip flex flex-col relative${sc.floral ? " bohemian-scale" : ""}`}
      style={{ background: sc.bodyBackground ?? sc.navBg }}>

      <EventNav title={(event.nav_title as string | null) || event.title} pages={pageList} sc={sc} navLayout={(event.nav_layout ?? "split") as "stacked" | "split" | "left"} basePath={basePath} singlePage={isSinglePage} />

      <main className="relative" style={{ zIndex: 1 }}>
        {children}
      </main>

      {sc.floral && (
        <div className="w-full flex justify-center" style={{ backgroundColor: sc.navBg, marginTop: "-20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bouquet-home.png.jpg"
            alt=""
            aria-hidden="true"
            style={{
              width: "45%",
              maxWidth: "280px",
              display: "block",
              mixBlendMode: "multiply",
              userSelect: "none",
              pointerEvents: "none",
              filter: sc.floralFilter ?? undefined,
            }}
          />
        </div>
      )}

      <footer className="py-6 text-center text-sm relative" style={{ zIndex: 1, color: sc.bodyText, borderTop: `1px solid ${sc.accent}15` }}>
        Gemaakt met{" "}
        <a href="https://sayingyes.nl" style={{ fontWeight: 600, color: sc.accent, textDecoration: "none", fontFamily: "var(--font-cormorant)", fontSize: "1.05rem", letterSpacing: "0.01em" }}>
          SayingYes
        </a>
      </footer>

    </div>
  )

  return (
    <div className={`min-h-screen${isFullWidth ? '' : ' sm:py-12'}`} style={{ fontFamily: sc.fontFamily, background: (!isFullWidth && sc.outerBg) ? sc.outerBg : (sc.bodyBackground ?? sc.bodyBg), letterSpacing: sc.bodyLetterSpacing, fontWeight: sc.bodyFontWeight, scrollBehavior: isSinglePage ? 'smooth' : undefined }}>
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

      {pwEnabled ? (
        <EventGatekeeper
          slug={slug}
          pwEnabled={pwEnabled}
          pwType={pwType}
          pwValue={pwValue}
          pwQuestion={pwQuestion}
          pwAnswer={pwAnswer}
          sc={sc}
          eventTitle={(event.nav_title as string | null) || (event.title as string) || ""}
        >
          {siteContent}
        </EventGatekeeper>
      ) : siteContent}
    </div>
  )
}
