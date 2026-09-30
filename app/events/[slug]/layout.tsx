import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import EventNav from "./event-nav"
import { normalizePlan, publicPageTypes } from "@/lib/plans"
import { rijOfNiets } from "@/lib/db"
import type { Metadata, Viewport } from "next"
import SiteOpening from "@/components/SiteOpening"
import { siteNamen, siteOpeningData, VAN_KAART } from "@/lib/site-opening"

// Kom je van de kaart (de knop "Bekijk onze website"), dan begint de site met
// hetzelfde beginscherm als achter de deuren van de kaart, en verdwijnt dat
// rustig. Een scriptje en geen React: het moet er staan voordat de site voor
// het eerst op het scherm komt, en de pagina is gecached, dus de server kan
// het adres niet lezen. De toevoeging gaat daarna weer uit het adres.
const [VK_SLEUTEL, VK_WAARDE] = VAN_KAART.split("=")
const INTRO_SCRIPT = `(function(){try{var u=new URL(location.href);if(u.searchParams.get(${JSON.stringify(VK_SLEUTEL)})!==${JSON.stringify(VK_WAARDE)})return;var el=document.getElementById("sy-van-kaart");if(!el)return;el.style.display="flex";u.searchParams.delete(${JSON.stringify(VK_SLEUTEL)});history.replaceState(history.state,"",u.pathname+u.search+u.hash);var klaar=false;function weg(){if(klaar)return;klaar=true;setTimeout(function(){el.style.opacity="0";setTimeout(function(){el.style.display="none"},800)},350)}if(document.readyState!=="loading")weg();else document.addEventListener("DOMContentLoaded",weg);setTimeout(weg,1500)}catch(e){}})();`

export const revalidate = 60

export const viewport: Viewport = {
  colorScheme: "only light",
}

// Gepubliceerde klant-trouwsites (op [slug].sayingyes.nl) mogen NIET door Google
// geïndexeerd worden: het is privé-content (namen, gastenlijsten, dieetwensen) en
// dunne/dubbele content zou het hoofddomein verwateren. Deze metadata geldt voor de
// hele /events/[slug]-subtree (home + alle subpagina's) en overschrijft de
// index:true uit de root-layout.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
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

  const event = rijOfNiets(await supabase
    .from("events")
    .select("id, title, nav_title, frame_names, datum, style, font_frame_names, font_page_titles, nav_layout, homepage_settings, plan")
    .eq("slug", slug)
    .eq("status", "published")
    .single(), "Website")

  if (!event) return <>{children}</>

  // Pakket bepaalt wat publiek zichtbaar is: Save the Date alleen de hero,
  // Uitnodiging & RSVP de hero plus RSVP, Compleet de hele site.
  const plan = normalizePlan(event.plan)
  const isCompleet = plan === "compleet"

  const { data: rawPages } = await supabase
    .from("pages")
    .select("type, title, order")
    .eq("event_id", event.id)
    .eq("is_enabled", true)
    .order("order", { ascending: true })
  const pages = publicPageTypes(plan, rawPages ?? [])

  const sc = getStyleConfig(event.style, {
    fontFrameNames:  event.font_frame_names  as string | null,
    fontPageTitles:  event.font_page_titles  as string | null,
  })
  // Gastenfotomuur: apart opgevraagd zodat de site blijft werken zolang de
  // migratie (guest_photos_enabled kolom) nog niet is gedraaid.
  const { data: gpEvent } = await supabase
    .from("events")
    .select("guest_photos_enabled")
    .eq("id", event.id)
    .single()
  const guestPhotosEnabled =
    isCompleet && ((gpEvent?.guest_photos_enabled as boolean | undefined) ?? false)

  const pageList = guestPhotosEnabled
    ? [...pages, { type: "fotomuur", title: "Fotomuur", order: 999 }]
    : pages
  const basePath = process.env.NODE_ENV === "production" ? "" : `/events/${slug}`

  const hs = event.homepage_settings as { siteLayout?: string; pageMode?: string } | null
  const isFullWidth = hs?.siteLayout === 'fullwidth'
  // Kleinere pakketten zijn altijd één pagina (hero + eventueel RSVP)
  const isSinglePage = !isCompleet || hs?.pageMode === 'single'

  // Een site met een slot komt hier alleen als de bezoeker het wachtwoord al
  // gaf: proxy.ts laat anders alleen het slot zien (app/toegang/[slug]).
  // Eerst verstopte de browser de site, maar stond hij wel in de broncode.

  const siteContent = (
    <div className={`max-w-5xl mx-auto sm:shadow-2xl sm:rounded-2xl overflow-clip flex flex-col relative${sc.floral ? " bohemian-scale" : ""}`}
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

    </div>
  )

  // Los onder de site, niet als laatste strook in het kader: dan liep het
  // kader nog een stuk door (Michiel, 27 september 2026)
  const voettekst = (
    <footer className="py-6 text-center text-sm" style={{ color: sc.bodyText, opacity: 0.75 }}>
      Gemaakt met{" "}
      <a href="https://www.sayingyes.nl" style={{ fontWeight: 600, color: sc.accent, textDecoration: "none", fontFamily: "var(--font-cormorant)", fontSize: "1.05rem", letterSpacing: "0.01em" }}>
        SayingYes
      </a>
    </footer>
  )

  return (
    <div className="min-h-screen sm:py-12" style={{ fontFamily: sc.fontFamily, background: sc.bodyBg, letterSpacing: sc.bodyLetterSpacing, fontWeight: sc.bodyFontWeight, scrollBehavior: isSinglePage ? 'smooth' : undefined }}>
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

      {/* Het beginscherm voor wie van de kaart komt; staat uit tot het
          scriptje hieronder hem aanzet */}
      <SiteOpening
        id="sy-van-kaart"
        onderdrukHydratie
        data={siteOpeningData(
          event.style,
          { fontFrameNames: event.font_frame_names as string | null, fontPageTitles: event.font_page_titles as string | null },
          siteNamen(event as { frame_names?: string | null; nav_title?: string | null; title?: string | null }),
          event.datum as string | null
        )}
        style={{ display: "none", zIndex: 1000, transition: "opacity 0.8s ease" }}
      />
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      {siteContent}
      {voettekst}
    </div>
  )
}
