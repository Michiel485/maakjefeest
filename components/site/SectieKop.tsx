// De kop van een sectie op de trouwsite, overal dezelfde: een klein kopje in
// kapitalen, de titel in het titellettertype en een sierlijn. Dat geeft de
// site het ritme dat de losse blokken niet hadden (ontwerpronde, 2 oktober
// 2026). Zonder hooks, zodat de server en de bouwer hem allebei kunnen tekenen.

import type { CSSProperties, ReactNode } from "react"
import type { SC } from "@/lib/event-styles"

export function Sierlijn({ accent, breedte = 44 }: { accent: string; breedte?: number }) {
  const lijn: CSSProperties = { display: "block", width: breedte, height: 1, backgroundColor: accent, opacity: 0.6 }
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span style={lijn} />
      <svg width="7" height="7" viewBox="0 0 8 8" fill={accent}><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
      <span style={lijn} />
    </span>
  )
}

export default function SectieKop({
  sc,
  kopje,
  titel,
  onder,
  onClick,
  klikTitel,
}: {
  sc: SC
  /** Het kleine kopje boven de titel, zoals "De dag" boven Programma */
  kopje?: string | null
  titel: ReactNode
  /** Een regel onder de sierlijn, bijvoorbeeld een korte inleiding */
  onder?: ReactNode
  /** In de bouwer: klikken op de titel opent het veld */
  onClick?: () => void
  klikTitel?: string
}) {
  return (
    <div className="flex flex-col items-center text-center" style={{ gap: 10, padding: "0 16px", marginBottom: 32 }}>
      {kopje && (
        <p
          style={{
            margin: 0,
            fontFamily: sc.fontFamily,
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: sc.accent,
          }}
        >
          {kopje}
        </p>
      )}
      <h2
        onClick={onClick}
        title={klikTitel}
        style={{
          margin: 0,
          fontFamily: sc.fontPageTitles,
          fontWeight: sc.fontPageTitlesWeight,
          color: sc.headingColor,
          fontSize: "clamp(1.85rem, 5cqw, 2.6rem)",
          lineHeight: 1.1,
          textWrap: "balance",
          overflowWrap: "anywhere",
          cursor: onClick ? "pointer" : undefined,
        }}
      >
        {titel}
      </h2>
      <Sierlijn accent={sc.accent} />
      {onder && <div style={{ marginTop: 6, maxWidth: 560 }}>{onder}</div>}
    </div>
  )
}
