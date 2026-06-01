"use client"

import { type SC } from "@/lib/event-styles"
import { useUILocale } from "@/hooks/useUILocale"
import { getUILabel } from "@/lib/ui-translations"

interface Props {
  title?: string | null
  intro?: string | null
  urls: string[]
  sc: SC
  useTranslatedTitle?: boolean
}

export default function FotosPreview({ title, intro, urls, sc, useTranslatedTitle }: Props) {
  const locale = useUILocale()
  const displayTitle = useTranslatedTitle ? getUILabel(locale, "fotos") : title
  return (
    <div style={{ padding: "36px 32px 64px", backgroundColor: sc.navBg }}>
      {displayTitle && (
        <h1
          className="notranslate"
          style={{
            fontSize: "1.75rem",
            fontWeight: sc.fontPageTitlesWeight,
            color: sc.headingColor,
            fontFamily: sc.fontPageTitles,
            margin: "0 0 16px",
          }}
        >
          {displayTitle}
        </h1>
      )}
      {intro && (
        <p style={{ fontSize: "0.9375rem", color: sc.bodyText, lineHeight: 1.65, margin: "0 0 24px" }}>
          {intro}
        </p>
      )}
      {urls.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: sc.bodyText, opacity: 0.5 }}>
          Foto&apos;s worden binnenkort toegevoegd.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              style={{ borderRadius: 12, aspectRatio: "1", objectFit: "cover", width: "100%", display: "block" }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
