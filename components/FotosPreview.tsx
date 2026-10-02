"use client"

import { type SC } from "@/lib/event-styles"
import { useUILocale } from "@/hooks/useUILocale"
import { getUILabel } from "@/lib/ui-translations"
import SectieKop from "./site/SectieKop"

interface Props {
  title?: string | null
  intro?: string | null
  urls: string[]
  sc: SC
  useTranslatedTitle?: boolean
  /** In de bouwer: een hint als er nog geen foto's zijn */
  bouwer?: boolean
}

export default function FotosPreview({ title, intro, urls, sc, useTranslatedTitle, bouwer = false }: Props) {
  const locale = useUILocale()
  const displayTitle = useTranslatedTitle ? getUILabel(locale, "fotos") : title
  return (
    <div className="@container" style={{ padding: "48px 32px 64px", fontFamily: sc.fontFamily }}>
      <SectieKop
        sc={sc}
        kopje="Herinneringen"
        titel={<span className="notranslate">{displayTitle || "Foto's"}</span>}
        onder={intro ? <p style={{ fontSize: "0.9375rem", color: sc.bodyText, lineHeight: 1.65, margin: 0 }}>{intro}</p> : undefined}
      />
      {urls.length === 0 ? (
        // Alleen in de bouwer; op de echte site staat een lege sectie er niet
        bouwer ? (
          <p style={{ fontSize: "0.875rem", color: sc.bodyText, opacity: 0.5, textAlign: "center" }}>
            Hiernaast kun je foto&apos;s toevoegen.
          </p>
        ) : null
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {urls.map((url, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "1" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="transition-transform duration-300 hover:scale-110"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
