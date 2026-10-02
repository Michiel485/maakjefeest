// Tijden en dresscode op de trouwsite, in dezelfde drie weergaven als op de
// trouwkaart (components/kaart/KaartVoorkant.tsx, tijdEnDresscode): kopjes
// naast elkaar, onder elkaar, of onder een sierlijn, met of zonder
// lijnicoontjes. Voor de opening Foto, waar de tekst niet op een ontwerp
// staat (Michiel, 2 oktober 2026: de knoppen deden daar niets).

import type { CSSProperties } from "react"
import { Klokje, Kleerhanger } from "@/components/kaart/KaartVoorkant"
import type { DetailsStijl } from "@/lib/cards"

export interface TekstLetter {
  family?: string
  schaal?: number
}

export default function TijdenDresscode({
  tijden,
  dresscode,
  stijl = "kopjes",
  icoon = false,
  accent,
  tekst,
  font,
  eigen,
  grootte = 1,
}: {
  tijden: string | null
  dresscode: string | null
  stijl?: DetailsStijl | null
  icoon?: boolean
  /** Kleur van de kopjes, lijnen en icoontjes */
  accent: string
  /** Kleur van de waarden */
  tekst: string
  font: string
  /** Per regel een eigen letter en grootte, zoals op het ontwerp gekozen */
  eigen?: Partial<Record<"tijden" | "dresscode", TekstLetter>>
  /** 1 is de maat van de kaart; de opening mag iets groter */
  grootte?: number
}) {
  if (!tijden && !dresscode) return null
  const s = stijl ?? "kopjes"
  const g = 16 * grootte
  const ik = Math.round(g * 1.25)
  const klok = <Klokje maat={ik} kleur={accent} />
  const hanger = <Kleerhanger maat={ik} kleur={accent} />
  const rolFont = (rol: "tijden" | "dresscode") => eigen?.[rol]?.family ?? font
  const rolSchaal = (rol: "tijden" | "dresscode") => eigen?.[rol]?.schaal ?? 1
  const waarde = (t: string, rol: "tijden" | "dresscode", extra: CSSProperties = {}) => (
    <span style={{ fontFamily: rolFont(rol), fontSize: g * 1.05 * rolSchaal(rol), lineHeight: 1.35, color: tekst, ...extra }}>{t}</span>
  )
  const lijn: CSSProperties = { display: "block", width: 40, height: 1, backgroundColor: accent }

  if (s === "kopjes") {
    const kolom = (label: string, t: string, ic: React.ReactNode, rol: "tijden" | "dresscode") => (
      <div className="flex flex-col items-center" style={{ gap: 2, maxWidth: 220 }}>
        <div className="flex items-center" style={{ gap: 5 }}>
          {icoon && ic}
          <span style={{ fontFamily: font, fontSize: g * 0.7 * rolSchaal(rol), fontWeight: 600, letterSpacing: "0.26em", textTransform: "uppercase", color: accent }}>{label}</span>
        </div>
        {waarde(t, rol, { textAlign: "center" })}
      </div>
    )
    return (
      <div className="flex items-stretch justify-center" style={{ gap: 14 }}>
        {tijden && kolom("Tijd", tijden, klok, "tijden")}
        {tijden && dresscode && <span style={{ display: "block", width: 1, backgroundColor: accent, opacity: 0.45 }} />}
        {dresscode && kolom("Dresscode", dresscode, hanger, "dresscode")}
      </div>
    )
  }
  if (s === "lijst") {
    const regel = (t: string, ic: React.ReactNode, rol: "tijden" | "dresscode") => (
      <div className="flex items-center" style={{ gap: 7 }}>
        {icoon && ic}
        {waarde(t, rol)}
      </div>
    )
    return (
      <div className="flex flex-col items-center" style={{ gap: 4 }}>
        {tijden && regel(tijden, klok, "tijden")}
        {dresscode && regel(icoon ? dresscode : `Dresscode: ${dresscode}`, hanger, "dresscode")}
      </div>
    )
  }
  // Onder een sierlijn
  return (
    <div className="flex flex-col items-center" style={{ gap: 3 }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
        <span style={lijn} />
        <span style={{ display: "block", width: 5, height: 5, backgroundColor: accent, transform: "rotate(45deg)" }} />
        <span style={lijn} />
      </div>
      {tijden && (
        <div className="flex items-center" style={{ gap: 7 }}>
          {icoon && klok}
          {waarde(tijden, "tijden")}
        </div>
      )}
      {dresscode && (
        <div className="flex items-center" style={{ gap: 7 }}>
          {icoon && hanger}
          {waarde(icoon ? dresscode : `dresscode: ${dresscode}`, "dresscode", { fontSize: g * 0.95 * rolSchaal("dresscode"), opacity: 0.85 })}
        </div>
      )}
    </div>
  )
}
