// Het beginscherm van de trouwwebsite (lib/site-opening.ts). Zonder hooks, zodat
// de site het op de server kan tekenen en de kaart in de browser.

import type { CSSProperties } from "react"
import type { SiteOpeningData } from "@/lib/site-opening"

export default function SiteOpening({
  data,
  id,
  style,
  onderdrukHydratie = false,
  inhoudStijl,
}: {
  data: SiteOpeningData
  id?: string
  style?: CSSProperties
  /** Op de site zet een scriptje hem aan voordat React er is; dat mag */
  onderdrukHydratie?: boolean
  /** Voor de namen en de datum apart, zodat die later kunnen opkomen dan de kleur */
  inhoudStijl?: CSSProperties
}) {
  const lijn: CSSProperties = { display: "block", width: 48, height: 1, backgroundColor: data.accent }
  return (
    <div
      id={id}
      aria-hidden="true"
      suppressHydrationWarning={onderdrukHydratie}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        backgroundColor: data.bg,
        ...style,
      }}
    >
      {data.fontImport && <style>{data.fontImport}</style>}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, ...inhoudStijl }}>
      <span style={lijn} />
      <span
        style={{
          fontFamily: data.fontNamen,
          fontWeight: data.fontNamenGewicht,
          fontSize: "clamp(40px, 10vw, 76px)",
          lineHeight: 1.12,
          color: data.tekst,
          textAlign: "center",
          maxWidth: 720,
        }}
      >
        {data.namen}
      </span>
      {data.datum && (
        <span
          style={{
            fontFamily: data.fontTekst,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: data.accent,
            textAlign: "center",
          }}
        >
          {data.datum}
        </span>
      )}
      <span style={lijn} />
      </div>
    </div>
  )
}
