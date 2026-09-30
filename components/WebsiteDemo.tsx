"use client"

// Waar de knop "Bekijk onze website" in de demo van de kaartbouwer heen gaat
// (Michiel, 30 september 2026). Jullie eigen homepagina zoals de websitebouwer
// hem kent, of, zonder website, een begin met jullie namen. Hoort de website
// niet bij het pakket, dan staat erbij dat de knop daarbij hoort.
//
// Het begint met hetzelfde beginscherm als de echte site na de deuren
// (lib/site-opening.ts), zodat de demo net zo loopt als bij je gasten.

import { useEffect, useState } from "react"
import EventNav from "@/app/events/[slug]/event-nav"
import EventHomePreview, { type HomepageSettings } from "@/components/EventHomePreview"
import SiteOpening from "@/components/SiteOpening"
import { formatDate, getStyleConfig } from "@/lib/event-styles"
import { siteNamen, siteOpeningData, type SiteOpeningData } from "@/lib/site-opening"

/** Een website zoals de bouwer hem in de browser bewaart, of zoals de server hem geeft */
export interface SiteBron {
  naam?: string
  title?: string
  nav_title?: string | null
  datum?: string | null
  locatie?: string | null
  style?: string | null
  use_frame?: boolean | null
  frame_style?: string | null
  initials?: string | null
  frame_names?: string | null
  frame_location?: string | null
  frameInitialsSize?: number
  frameNamesSize?: number
  frameDateSize?: number
  frameLocationSize?: number
  font_hero?: string | null
  font_initials?: string | null
  font_frame_names?: string | null
  font_page_titles?: string | null
  hero_image_url?: string | null
  hero_overlay?: boolean | null
  hero_image_pos_x?: number | null
  hero_image_pos_y?: number | null
  homepage_settings?: HomepageSettings | null
  homeContent?: { title?: string; body?: string; align?: "left" | "center" | "right"; titleSize?: number; bodySize?: number } | null
}

const NAV_PAGINAS = [
  { type: "Home", title: "Home" },
  { type: "OnsVerhaal", title: "Ons Verhaal" },
  { type: "Programma", title: "Programma" },
  { type: "Informatie", title: "Informatie" },
  { type: "RSVP", title: "RSVP" },
]

/** Een bruiloft zoals /api/drafts/[event_id] hem geeft */
export function bronUitEvent(e: Record<string, unknown>, pages: Array<{ type: string; content: unknown }> = []): SiteBron {
  const s = (v: unknown) => (typeof v === "string" ? v : null)
  const n = (v: unknown) => (typeof v === "number" ? v : undefined)
  const home = pages.find((p) => p.type === "Home")?.content
  return {
    title: s(e.title) ?? "",
    nav_title: s(e.nav_title),
    datum: s(e.datum),
    locatie: s(e.locatie),
    style: s(e.style),
    use_frame: typeof e.use_frame === "boolean" ? e.use_frame : null,
    frame_style: s(e.frame_style),
    initials: s(e.initials),
    frame_names: s(e.frame_names),
    frame_location: s(e.frame_location),
    frameInitialsSize: n(e.frame_initials_size),
    frameNamesSize: n(e.frame_names_size),
    frameDateSize: n(e.frame_date_size),
    frameLocationSize: n(e.frame_location_size),
    font_hero: s(e.font_hero),
    font_initials: s(e.font_initials),
    font_frame_names: s(e.font_frame_names),
    font_page_titles: s(e.font_page_titles),
    hero_image_url: s(e.hero_image_url),
    hero_overlay: typeof e.hero_overlay === "boolean" ? e.hero_overlay : null,
    hero_image_pos_x: n(e.hero_image_pos_x) ?? null,
    hero_image_pos_y: n(e.hero_image_pos_y) ?? null,
    homepage_settings: (e.homepage_settings as HomepageSettings | null) ?? null,
    homeContent: home && typeof home === "object" ? (home as SiteBron["homeContent"]) : null,
  }
}

export function bronFonts(b: SiteBron) {
  return {
    fontHero: b.font_hero ?? null,
    fontInitials: b.font_initials ?? null,
    fontFrameNames: b.font_frame_names ?? null,
    fontPageTitles: b.font_page_titles ?? null,
  }
}

/** Het beginscherm dat bij deze website hoort */
export function bronOpening(b: SiteBron): SiteOpeningData {
  return siteOpeningData(
    b.style || "ivoor",
    bronFonts(b),
    siteNamen({ frame_names: b.frame_names, nav_title: b.nav_title, title: b.title ?? b.naam }),
    b.datum ?? null
  )
}

export default function WebsiteDemo({
  bron,
  metWebsite,
  extraPrijs,
  onSluit,
  onNaarWebsite,
}: {
  bron: SiteBron
  /** Hoort de website bij het pakket? Anders een label erbij */
  metWebsite: boolean
  /** Wat de website erbij kost, bijvoorbeeld "€25" */
  extraPrijs: string | null
  onSluit: () => void
  onNaarWebsite: () => void
}) {
  const sc = getStyleConfig(bron.style || "ivoor", bronFonts(bron))
  const [opening, setOpening] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setOpening(false), 350)
    return () => clearTimeout(t)
  }, [])
  const titel = bron.nav_title || siteNamen({ frame_names: bron.frame_names, title: bron.title ?? bron.naam })
  const hc = bron.homeContent ?? {}

  return (
    <div className="fixed inset-0 z-[310] overflow-y-auto" style={{ background: sc.bodyBg, fontFamily: sc.fontFamily, letterSpacing: sc.bodyLetterSpacing }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}
      <button
        type="button"
        onClick={onSluit}
        className="fixed top-12 right-4 z-[330] text-sm font-semibold px-4 py-2 rounded-xl shadow-lg"
        style={{ backgroundColor: "#fff", color: "#1A1A1A", border: "1px solid #E8D9B5", cursor: "pointer", fontFamily: "var(--font-sans), system-ui, sans-serif", letterSpacing: 0 }}
      >
        ✕ Terug naar de kaart
      </button>

      <div className={`sm:py-12 ${metWebsite ? "" : "pb-40"}`}>
        <div className="max-w-5xl mx-auto sm:shadow-2xl sm:rounded-2xl overflow-clip flex flex-col relative" style={{ background: sc.bodyBackground ?? sc.navBg }}>
          <EventNav title={titel} pages={NAV_PAGINAS} sc={sc} navLayout="stacked" activeType="Home" onNavigate={() => {}} />
          <main className="relative" style={{ zIndex: 1 }}>
            <EventHomePreview
              title={bron.title ?? bron.naam ?? ""}
              datum={bron.datum || null}
              datumFormatted={bron.datum ? formatDate(bron.datum) : null}
              locatie={bron.locatie || null}
              heroImageUrl={bron.hero_image_url ?? null}
              heroOverlay={bron.hero_overlay ?? true}
              heroPosX={bron.hero_image_pos_x ?? 50}
              heroPosY={bron.hero_image_pos_y ?? 50}
              useFrame={bron.use_frame ?? true}
              frameStyle={bron.frame_style ?? null}
              initials={bron.initials ?? null}
              frameNames={bron.frame_names ?? null}
              frameLocation={bron.frame_location ?? null}
              frameInitialsSize={bron.frameInitialsSize}
              frameNamesSize={bron.frameNamesSize}
              frameDateSize={bron.frameDateSize}
              frameLocationSize={bron.frameLocationSize}
              homeTitle={hc.title || null}
              homeBody={hc.body || null}
              homeAlign={hc.align ?? "center"}
              homeTitleSize={hc.titleSize}
              homeBodySize={hc.bodySize}
              onNavigate={() => {}}
              rsvpHref="#"
              sc={sc}
              homepageSettings={bron.homepage_settings ?? null}
            />
          </main>
        </div>
      </div>

      {/* Zonder website: laten zien dat de knop daarbij hoort */}
      {!metWebsite && (
        <div className="fixed inset-x-0 bottom-0 z-[320] p-4 sm:p-6 flex justify-center pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ backgroundColor: "#1A1A1A", color: "#FAF7F2", boxShadow: "0 18px 40px -18px rgba(0,0,0,0.55)", fontFamily: "var(--font-sans), system-ui, sans-serif", letterSpacing: 0 }}
          >
            <p className="m-0 text-sm leading-relaxed flex-1">
              <b>Deze knop hoort bij de trouwwebsite.</b> Neem je hem erbij, dan komen je gasten vanaf de kaart op jullie eigen site.
            </p>
            <button
              type="button"
              onClick={onNaarWebsite}
              className="shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: "#C5A059", color: "#fff", border: 0, cursor: "pointer" }}
            >
              {extraPrijs ? `Website erbij voor ${extraPrijs}` : "Maak jullie website"}
            </button>
          </div>
        </div>
      )}

      {/* Hetzelfde beginscherm als achter de deuren, dat rustig verdwijnt */}
      <SiteOpening
        data={bronOpening(bron)}
        style={{ zIndex: 340, opacity: opening ? 1 : 0, transition: "opacity 0.8s ease", pointerEvents: opening ? "auto" : "none" }}
      />
    </div>
  )
}
