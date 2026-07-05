export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { headers } from "next/headers"
import QRCode from "qrcode"
import { createServiceClient } from "@/lib/supabase"
import { getStyleConfig } from "@/lib/event-styles"
import { eventSiteUrl, eventSiteLabel } from "@/lib/site-url"
import PrintToolbar from "./print-toolbar"

// Print-klare kaart (A5/A4) met QR-code voor op de tafels tijdens het feest.
// Staat bewust buiten de events-layout: geen nav of footer, alleen de kaart.
export default async function FotokaartPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ size?: string }>
}) {
  const { slug } = await params
  const { size } = await searchParams
  const paperSize = size === "a4" ? "A4" : "A5"

  const supabase = createServiceClient()
  const { data: event } = await supabase
    .from("events")
    .select("id, title, nav_title, style, font_hero, font_initials, font_frame_names, font_page_titles, guest_photos_enabled")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event || !event.guest_photos_enabled) notFound()

  const sc = getStyleConfig(event.style, {
    fontHero:       event.font_hero        as string | null,
    fontInitials:   event.font_initials    as string | null,
    fontFrameNames: event.font_frame_names as string | null,
    fontPageTitles: event.font_page_titles as string | null,
  })

  const siteUrl = eventSiteUrl(slug)
  const host = (await headers()).get("host") ?? "localhost:3000"
  const target = siteUrl.startsWith("/")
    ? `http://${host}${siteUrl}/foto-delen`
    : `${siteUrl}/foto-delen`

  const qrDataUrl = await QRCode.toDataURL(target, {
    width: 640,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1a1a1a", light: "#ffffff" },
  })

  return (
    <div style={{ fontFamily: sc.fontFamily, backgroundColor: "#e5e5e5", minHeight: "100vh" }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}
      <style>{`
        @page { size: ${paperSize} portrait; margin: 0; }
        @media print {
          body { background: none !important; }
          .no-print { display: none !important; }
          .fotokaart-wrap { padding: 0 !important; min-height: 0 !important; }
          .fotokaart {
            width: 100% !important;
            height: 100vh !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <PrintToolbar slug={slug} paperSize={paperSize} />

      {/* Kaart — A-formaat verhouding 1:√2 */}
      <div className="fotokaart-wrap flex items-start justify-center" style={{ padding: "24px 16px 64px", minHeight: "100vh" }}>
        <div
          className="fotokaart flex flex-col items-center text-center"
          style={{
            width: paperSize === "A4" ? 595 : 420,
            aspectRatio: "1 / 1.4142",
            background: sc.bodyBackground ?? sc.bodyBg,
            borderRadius: 8,
            boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            overflow: "hidden",
            padding: "7% 8%",
            justifyContent: "space-between",
          }}
        >
          {/* Sierlijn boven */}
          <div className="w-full flex flex-col items-center" style={{ gap: 14 }}>
            <div className="flex items-center justify-center" style={{ gap: 10, width: "100%" }}>
              <div style={{ flex: 1, height: 1, backgroundColor: `${sc.accent}70` }} />
              <svg width="8" height="8" viewBox="0 0 8 8" fill={sc.accent}><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
              <div style={{ flex: 1, height: 1, backgroundColor: `${sc.accent}70` }} />
            </div>

            <p
              className="notranslate"
              style={{
                fontFamily: sc.fontPageTitles,
                fontWeight: sc.fontPageTitlesWeight,
                color: sc.headingColor,
                fontSize: paperSize === "A4" ? "2rem" : "1.55rem",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Deel jullie foto&apos;s<br />van vandaag
            </p>

            <p style={{ color: sc.bodyText, fontSize: paperSize === "A4" ? "0.95rem" : "0.8rem", lineHeight: 1.55, margin: 0, maxWidth: "85%" }}>
              Scan de code en upload je mooiste momenten — ze verschijnen meteen op onze fotomuur.
            </p>
          </div>

          {/* QR groot in het midden */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 14,
              border: sc.goldBorder ? `2px solid ${sc.accent}` : `1px solid ${sc.accent}40`,
              boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR-code naar ${eventSiteLabel(slug)}/foto-delen`}
              style={{ width: paperSize === "A4" ? 250 : 180, height: paperSize === "A4" ? 250 : 180, display: "block" }}
            />
          </div>

          {/* Subdomein + afzender */}
          <div className="w-full flex flex-col items-center" style={{ gap: 12 }}>
            <p
              style={{
                color: sc.headingColor,
                fontSize: paperSize === "A4" ? "1rem" : "0.85rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              {eventSiteLabel(slug)}/foto-delen
            </p>
            <div className="flex items-center justify-center" style={{ gap: 10, width: "100%" }}>
              <div style={{ flex: 1, height: 1, backgroundColor: `${sc.accent}70` }} />
              <svg width="8" height="8" viewBox="0 0 8 8" fill={sc.accent}><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
              <div style={{ flex: 1, height: 1, backgroundColor: `${sc.accent}70` }} />
            </div>
            <p style={{ color: sc.bodyText, opacity: 0.55, fontSize: "0.65rem", margin: 0 }}>
              Gemaakt met <span style={{ fontWeight: 600, color: sc.accent }}>SayingYes</span> — sayingyes.nl
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
