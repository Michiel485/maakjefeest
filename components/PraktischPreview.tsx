"use client"

import type { SC } from "@/lib/event-styles"
import { ProgramIcon } from "./EventProgramPreview"

export interface PraktischTile {
  id: string
  iconId: string
  title: string
  text: string
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
  onTileDoubleClick,
}: {
  tiles: PraktischTile[]
  sc: SC
  onTileDoubleClick?: (tileId: string, field: 'title' | 'text') => void
}) {
  return (
    <div className="@container px-6 py-10" style={{ backgroundColor: sc.bodyBackground ? "transparent" : sc.navBg, fontFamily: sc.fontFamily }}>
      <p
        className="text-4xl text-center mb-8"
        style={{ color: sc.headingColor, fontFamily: sc.fontPageTitles, fontWeight: sc.fontPageTitlesWeight }}
      >
        Praktische Informatie
      </p>
      <div className="flex flex-wrap justify-center gap-5">
        {tiles.map((tile) => (
          <CardWrapper key={tile.id} sc={sc} className="w-full @md:w-[calc(33.333%-1rem)]">
            <span style={{ color: sc.accent }}>
              <ProgramIcon iconId={tile.iconId} strokeWidth={1.5} className="w-16 h-16" />
            </span>
            <p
              className="font-extrabold text-base leading-tight"
              style={{ color: sc.goldBorder ? (sc.cardText ?? sc.headingColor) : sc.headingColor, cursor: onTileDoubleClick ? "pointer" : undefined }}
              onDoubleClick={onTileDoubleClick ? () => onTileDoubleClick(tile.id, 'title') : undefined}
              title={onTileDoubleClick ? "Dubbelklik om te bewerken" : undefined}
            >
              {tile.title}
            </p>
            {tile.text && (
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText, cursor: onTileDoubleClick ? "pointer" : undefined }}
                onDoubleClick={onTileDoubleClick ? () => onTileDoubleClick(tile.id, 'text') : undefined}
                title={onTileDoubleClick ? "Dubbelklik om te bewerken" : undefined}
              >
                {tile.text}
              </p>
            )}
          </CardWrapper>
        ))}
      </div>
    </div>
  )
}
