"use client"

import type { SC } from "@/lib/event-styles"
import { ProgramIcon } from "./EventProgramPreview"
import { useUILocale } from "@/hooks/useUILocale"
import { getUILabel } from "@/lib/ui-translations"

export interface WishlistItem {
  id: string
  iconId: string
  title: string
  text: string
}

export const DEFAULT_WISHLIST_ITEMS: WishlistItem[] = [
  {
    id: "1",
    iconId: "letter",
    title: "Money Money Money",
    text: "Jullie aanwezigheid is ons grootste geschenk, maar als jullie ons echt willen verrassen, dan is een bijdrage aan onze droomreis naar Bali fantastisch. We hebben de pannen en potten namelijk al!",
  },
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

export default function WishlistPreview({
  items,
  sc,
  onItemClick,
}: {
  items: WishlistItem[]
  sc: SC
  onItemClick?: (itemId: string, field: 'title' | 'text') => void
}) {
  const locale = useUILocale()
  return (
    <div className="@container px-6 py-10" style={{ backgroundColor: sc.bodyBackground ? "transparent" : sc.navBg, fontFamily: sc.fontFamily }}>
      <p
        className="notranslate text-4xl text-center mb-8"
        style={{ color: sc.headingColor, fontFamily: sc.fontPageTitles, fontWeight: sc.fontPageTitlesWeight }}
      >
        {getUILabel(locale, "cadeautips")}
      </p>
      <div className="flex flex-wrap justify-center gap-5">
        {items.map((item) => (
          <CardWrapper key={item.id} sc={sc} className="w-full @md:w-[calc(33.333%-1rem)]">
            <span style={{ color: sc.accent }}>
              <ProgramIcon iconId={item.iconId} strokeWidth={1.5} className="w-16 h-16" />
            </span>
            <p
              className="font-extrabold text-base leading-tight"
              style={{ color: sc.goldBorder ? (sc.cardText ?? sc.headingColor) : sc.headingColor, cursor: onItemClick ? "pointer" : undefined }}
              onClick={onItemClick ? () => onItemClick(item.id, 'title') : undefined}
              title={onItemClick ? "Klik om te bewerken" : undefined}
            >
              {item.title}
            </p>
            {item.text && (
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText, cursor: onItemClick ? "pointer" : undefined }}
                onClick={onItemClick ? () => onItemClick(item.id, 'text') : undefined}
                title={onItemClick ? "Klik om te bewerken" : undefined}
              >
                {item.text}
              </p>
            )}
          </CardWrapper>
        ))}
      </div>
    </div>
  )
}
