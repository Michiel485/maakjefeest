// Een sectie op de trouwsite als alles op één pagina staat. Om en om krijgt
// een sectie een iets andere tint, zodat je ziet waar het ene stopt en het
// andere begint, zonder harde lijnen. De overgang hoort bij de stijl: bij een
// bloemige stijl een zachte golf, anders een dunne lijn in de accentkleur.
// Zonder hooks, zodat de echte site en het voorbeeld in de bouwer hetzelfde
// tekenen (ontwerpronde, 2 oktober 2026).

import type { CSSProperties, ReactNode } from "react"
import type { SC } from "@/lib/event-styles"

const GOLF_HOOGTE = 14

/** De opmaak van een sectie: `band` is de afwisselende tint. */
export function sectieStijl(sc: SC, band: boolean): CSSProperties {
  if (!band) return {}
  const tint = `${sc.accent}0d`
  if (sc.floral) {
    // Een rij halve rondjes in de tint; daarboven schijnt de vorige sectie door
    const golf = `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='${GOLF_HOOGTE}' viewBox='0 0 28 ${GOLF_HOOGTE}'><path d='M0 ${GOLF_HOOGTE} C 7 0 21 0 28 ${GOLF_HOOGTE} Z' fill='${sc.accent}' fill-opacity='0.05'/></svg>`
    )}")`
    return {
      background: `linear-gradient(${tint}, ${tint}) 0 ${GOLF_HOOGTE}px / 100% calc(100% - ${GOLF_HOOGTE}px) no-repeat, ${golf} top left / 28px ${GOLF_HOOGTE}px repeat-x`,
      paddingTop: GOLF_HOOGTE,
    }
  }
  return {
    background: tint,
    borderTop: `1px solid ${sc.accent}26`,
  }
}

export default function Sectie({
  sc,
  band,
  id,
  verschijn = false,
  style,
  children,
}: {
  sc: SC
  band: boolean
  id?: string
  /** Zachtjes in beeld komen bij scrollen (components/site/Verschijn.tsx) */
  verschijn?: boolean
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <section id={id} data-verschijn={verschijn ? "" : undefined} style={{ scrollMarginTop: 64, ...sectieStijl(sc, band), ...style }}>
      {children}
    </section>
  )
}
