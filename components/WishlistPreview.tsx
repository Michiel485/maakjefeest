"use client"

import { useState } from "react"
import type { SC } from "@/lib/event-styles"
import { ProgramIcon } from "./EventProgramPreview"
import SectieKop from "./site/SectieKop"
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

/** Een bijdrage overmaken: rekeningnummer of betaalverzoek, alleen als het is ingevuld */
export interface Rekening {
  iban?: string
  naam?: string
  link?: string
}

function RekeningBlok({ rekening, sc }: { rekening: Rekening; sc: SC }) {
  const [gekopieerd, setGekopieerd] = useState(false)
  const iban = rekening.iban?.trim() || null
  const link = rekening.link?.trim() || null
  if (!iban && !link) return null
  const kleurTekst = sc.goldBorder ? (sc.cardText ?? sc.bodyText) : sc.bodyText
  async function kopieer() {
    if (!iban) return
    try {
      await navigator.clipboard.writeText(iban.replace(/\s+/g, ""))
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 2000)
    } catch {
      // Dan staat het nummer er gewoon, de gast kan het zelf overnemen
    }
  }
  return (
    <div className="flex flex-col items-center text-center mx-auto" style={{ marginTop: 28, gap: 10, maxWidth: 420 }}>
      <p style={{ margin: 0, fontSize: "0.9375rem", color: kleurTekst }}>
        Liever een bijdrage overmaken?
      </p>
      {iban && (
        <p style={{ margin: 0, fontFamily: sc.fontPageTitles, fontWeight: sc.fontPageTitlesWeight, fontSize: "1.25rem", color: sc.headingColor, letterSpacing: "0.04em" }}>
          {iban}
          {rekening.naam?.trim() && <span style={{ display: "block", fontFamily: sc.fontFamily, fontSize: "0.8125rem", fontWeight: 400, color: kleurTekst, letterSpacing: 0, marginTop: 2 }}>t.n.v. {rekening.naam.trim()}</span>}
        </p>
      )}
      <div className="flex flex-wrap justify-center" style={{ gap: 8 }}>
        {iban && (
          <button
            type="button"
            onClick={kopieer}
            className="text-sm font-bold transition-transform hover:-translate-y-0.5"
            style={{ padding: "9px 18px", borderRadius: 999, border: `1px solid ${sc.accent}`, color: sc.accent, background: "transparent", cursor: "pointer" }}
          >
            {gekopieerd ? "Gekopieerd" : "Kopieer IBAN"}
          </button>
        )}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener"
            className="text-sm font-bold transition-transform hover:-translate-y-0.5"
            style={{ padding: "9px 18px", borderRadius: 999, backgroundColor: sc.buttonBg, color: sc.buttonText, textDecoration: "none" }}
          >
            Open betaalverzoek
          </a>
        )}
      </div>
    </div>
  )
}

export default function WishlistPreview({
  items,
  sc,
  rekening,
  onItemClick,
}: {
  items: WishlistItem[]
  sc: SC
  rekening?: Rekening | null
  onItemClick?: (itemId: string, field: 'title' | 'text') => void
}) {
  const locale = useUILocale()
  return (
    <div className="@container px-6 pt-12 pb-14" style={{ fontFamily: sc.fontFamily }}>
      <SectieKop sc={sc} kopje="Een cadeau?" titel={<span className="notranslate">{getUILabel(locale, "cadeautips")}</span>} />
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
      {rekening && <RekeningBlok rekening={rekening} sc={sc} />}
    </div>
  )
}
