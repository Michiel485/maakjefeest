"use client"

import type { SC } from "@/lib/event-styles"
import { ProgramIcon } from "./EventProgramPreview"
import SectieKop from "./site/SectieKop"

export interface PraktischTile {
  id: string
  iconId: string
  title: string
  text: string
}

/**
 * De tegel Route (Michiel, 11 oktober 2026): aan of uit, met een eigen titel,
 * adres en uitleg, en een precieze plek. Met een plek opent de knop Maps op
 * dat punt, niet op een zoekopdracht die verkeerd kan uitvallen.
 */
export interface RouteInfo {
  aan?: boolean
  titel?: string
  adres?: string
  tekst?: string
  lat?: number | null
  lng?: number | null
}

/** De link voor de knop Open in Maps: de plek als die er is, anders het adres */
export function mapsLink(route: RouteInfo | null | undefined, locatie: string | null | undefined): string | null {
  if (typeof route?.lat === "number" && typeof route?.lng === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${route.lat.toFixed(6)},${route.lng.toFixed(6)}`
  }
  const adres = route?.adres?.trim() || locatie?.trim()
  return adres ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adres)}` : null
}

/**
 * Een plek uit wat iemand plakt: "52.0907, 5.1214", of een link uit Google
 * Maps met @52.09,5.12 of !3d52.09!4d5.12 erin. Een korte link
 * (maps.app.goo.gl) bevat geen plek; die geeft null.
 */
export function plekUitTekst(tekst: string): { lat: number; lng: number } | null {
  const t = tekst.trim()
  const pogingen = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/,
  ]
  for (const re of pogingen) {
    const m = t.match(re)
    if (m) {
      const lat = Number(m[1].replace(",", ".")), lng = Number(m[2].replace(",", "."))
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)) return { lat, lng }
    }
  }
  return null
}

export const DEFAULT_PRAKTISCH_TILES: PraktischTile[] = [
  { id: "1", iconId: "dresscode",  title: "Dresscode",      text: "Wij zien jullie graag in feestelijke kleding. Voel je vooral comfortabel, maar laat de spijkerbroek liever thuis!" },
  { id: "2", iconId: "cutlery",    title: "Dieetwensen",    text: "Heb je speciale dieetwensen of allergieën? Laat het onze ceremoniemeester uiterlijk 4 weken van tevoren weten, dan houdt de catering daar graag rekening mee." },
  { id: "3", iconId: "geen_smart", title: "Geen telefoons", text: "Wij willen onze ceremonie graag 'unplugged' beleven. Geniet in het moment met ons mee en laat de telefoons lekker in de tas zitten. Onze fotograaf legt alles vast!" },
]

function CardWrapper({ sc, className, children }: { sc: SC; className?: string; children: React.ReactNode }) {
  if (sc.goldBorder && sc.cardBg) {
    return (
      <div
        className={`${className ?? ""} flex flex-col items-center text-center px-6 py-8 gap-3 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl`}
        style={{ backgroundColor: sc.cardBg, border: `2px solid ${sc.accent}`, borderRadius: 18, cursor: "default" }}
      >
        {children}
      </div>
    )
  }
  return (
    <div
      className={`${className ?? ""} flex flex-col items-center text-center rounded-2xl px-6 py-8 gap-3 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl`}
      style={{ backgroundColor: `${sc.accent}08`, border: `1px solid ${sc.accent}20`, cursor: "default" }}
    >
      {children}
    </div>
  )
}

export default function PraktischPreview({
  tiles,
  sc,
  locatie,
  route,
  onTileClick,
}: {
  tiles: PraktischTile[]
  sc: SC
  /** De locatie van de bruiloft: dan komt er een tegel Route bij met een knop naar Maps */
  locatie?: string | null
  /** De eigen instellingen van de tegel Route */
  route?: RouteInfo | null
  onTileClick?: (tileId: string, field: 'title' | 'text') => void
}) {
  const metPlek = typeof route?.lat === "number" && typeof route?.lng === "number"
  const plek = route?.adres?.trim() || locatie?.trim() || null
  const toonRoute = route?.aan !== false && (!!plek || metPlek)
  const link = mapsLink(route, locatie)
  return (
    <div className="@container px-6 pt-12 pb-14" style={{ fontFamily: sc.fontFamily }}>
      <SectieKop sc={sc} kopje="Goed om te weten" titel="Praktische informatie" />
      <div className="flex flex-wrap justify-center gap-5">
        {tiles.map((tile) => (
          <CardWrapper key={tile.id} sc={sc} className="w-full @md:w-[calc(33.333%-1rem)]">
            <span style={{ color: sc.accent }}>
              <ProgramIcon iconId={tile.iconId} strokeWidth={1.5} className="w-16 h-16" />
            </span>
            <p
              className="font-extrabold text-base leading-tight"
              style={{ color: sc.goldBorder ? (sc.cardText ?? sc.headingColor) : sc.headingColor, cursor: onTileClick ? "pointer" : undefined }}
              onClick={onTileClick ? () => onTileClick(tile.id, 'title') : undefined}
              title={onTileClick ? "Klik om te bewerken" : undefined}
            >
              {tile.title}
            </p>
            {tile.text && (
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText, cursor: onTileClick ? "pointer" : undefined }}
                onClick={onTileClick ? () => onTileClick(tile.id, 'text') : undefined}
                title={onTileClick ? "Klik om te bewerken" : undefined}
              >
                {tile.text}
              </p>
            )}
          </CardWrapper>
        ))}
        {/* De route als laatste tegel, zodra de locatie is ingevuld */}
        {toonRoute && (
          <CardWrapper sc={sc} className="w-full @md:w-[calc(33.333%-1rem)]">
            <span style={{ color: sc.accent }}>
              <ProgramIcon iconId="car" strokeWidth={1.5} className="w-16 h-16" />
            </span>
            <p className="font-extrabold text-base leading-tight" style={{ color: sc.goldBorder ? (sc.cardText ?? sc.headingColor) : sc.headingColor }}>
              {route?.titel?.trim() || "Route"}
            </p>
            {plek && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText }}>
                {plek}
              </p>
            )}
            {route?.tekst?.trim() && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText, opacity: 0.9 }}>
                {route.tekst.trim()}
              </p>
            )}
            {link && <a
              href={link}
              target="_blank"
              rel="noopener"
              className="inline-block text-sm font-bold transition-transform hover:-translate-y-0.5"
              style={{ marginTop: 4, padding: "9px 18px", borderRadius: 999, backgroundColor: sc.buttonBg, color: sc.buttonText, textDecoration: "none" }}
            >
              Open in Maps
            </a>}
          </CardWrapper>
        )}
      </div>
    </div>
  )
}
