"use client"

import type { SC } from "@/lib/event-styles"
import { ProgramIcon } from "./EventProgramPreview"

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

export default function WishlistPreview({
  items,
  sc,
}: {
  items: WishlistItem[]
  sc: SC
}) {
  return (
    <div className="@container px-6 py-10" style={{ backgroundColor: sc.navBg, fontFamily: sc.fontFamily }}>
      <p
        className="text-4xl text-center mb-8"
        style={{ color: sc.headingColor, fontFamily: sc.titleFont, fontWeight: sc.titleFontWeight }}
      >
        Cadeautips
      </p>
      <div className="flex flex-wrap justify-center gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="w-full @md:w-[calc(33.333%-1rem)] flex flex-col items-center text-center rounded-2xl px-6 py-8 gap-3"
            style={{ backgroundColor: `${sc.accent}08`, border: `1px solid ${sc.accent}20` }}
          >
            <span style={{ color: sc.accent }}>
              <ProgramIcon iconId={item.iconId} strokeWidth={1.5} className="w-16 h-16" />
            </span>
            <p className="font-extrabold text-base leading-tight" style={{ color: sc.headingColor }}>
              {item.title}
            </p>
            {item.text && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: sc.bodyText }}>
                {item.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
