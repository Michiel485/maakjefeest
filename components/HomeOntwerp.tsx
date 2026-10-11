"use client"

// Het ontwerp op de homepagina: hetzelfde als een kaart, maar vrij op de
// pagina (lib/home-ontwerp.ts). De tekst komt uit de site, de kleuren van de
// website, en per tekst kan het bruidspaar een eigen letter en grootte kiezen.

import { useEffect, useRef, useState } from "react"
import KaartVoorkant, { type EigenTekst, type TekstRol } from "@/components/kaart/KaartVoorkant"
import { buildCardDisplay, type DetailsStijl, type NieuwOntwerp } from "@/lib/cards"
import type { SC } from "@/lib/event-styles"
import { browserLetters, detailsKeuze, detailsOpKaart, type DetailsStand } from "@/lib/kaart-ontwerpen"
import { gemetenLetter, getTitleFont } from "@/lib/title-fonts"
import { homeOntwerpMaxBreedte } from "@/lib/home-ontwerp"

export interface HomeOntwerpTekst {
  kop: string
  namen: string
  datum: string | null
  locatie: string | null
  tijden?: string | null
  dresscode?: string | null
  details?: DetailsStand | null
  detailsStijl?: DetailsStijl | null
  detailsIcoon?: boolean
}

/** Per tekst een lettertype (een id uit lib/title-fonts.ts) en een grootte (1 is zoals ontworpen) */
export type HomeTekstInstellingen = Partial<Record<TekstRol, { font?: string; schaal?: number }>>

/** Een kleur richting wit; deel 0 is de kleur zelf, 1 is wit */
function lichter(hex: string, deel: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return "#F3E6CF"
  const n = parseInt(m[1], 16)
  const kanaal = (v: number) => Math.round(v + (255 - v) * deel).toString(16).padStart(2, "0")
  return `#${kanaal((n >> 16) & 255)}${kanaal((n >> 8) & 255)}${kanaal(n & 255)}`
}

export default function HomeOntwerp({
  ontwerp,
  sc,
  tekst,
  instellingen,
  vasteBreedte,
  opFoto = false,
}: {
  ontwerp: NieuwOntwerp
  sc: SC
  tekst: HomeOntwerpTekst
  instellingen?: HomeTekstInstellingen
  /** Voor een tegeltje in de bouwer: altijd deze breedte, zonder te meten */
  vasteBreedte?: number
  /** Alleen het ontwerp op een foto, zonder achtergrond, in lichte kleuren */
  opFoto?: boolean
}) {
  // Op een foto rekent het ontwerp met een donkere achtergrond: dan kiest het
  // overal lichte tekst die leesbaar is op de foto
  // De accentkleur wordt licht: goud of groen in de stijlkleur viel weg op een
  // donkere foto (Michiel, 11 oktober 2026)
  const scNu: SC = opFoto ? { ...sc, bodyBg: "#2B2622", headingColor: "#FFFFFF", bodyText: "#F4EFE9", accent: lichter(sc.accent, 0.62), labelColor: lichter(sc.accent, 0.72) } : sc

  // Zo breed als er ruimte is, tot de breedte die bij het ontwerp past
  const vak = useRef<HTMLDivElement>(null)
  const [ruimte, setRuimte] = useState(420)
  useEffect(() => {
    const el = vak.current
    if (!el) return
    const meet = () => setRuimte(Math.max(260, Math.round(el.clientWidth)))
    const ro = new ResizeObserver(meet)
    ro.observe(el)
    // Een ResizeObserver meldt zich niet in een tabblad op de achtergrond
    const t = setTimeout(meet, 0)
    return () => { ro.disconnect(); clearTimeout(t) }
  }, [])
  const breedte = vasteBreedte ?? Math.min(ruimte, homeOntwerpMaxBreedte(ontwerp))

  const tijden = tekst.tijden?.trim() || null
  const dresscode = tekst.dresscode?.trim() || null
  const display = {
    ...buildCardDisplay(
      "trouwkaart",
      ontwerp,
      {
        names: tekst.namen,
        location: tekst.locatie ?? undefined,
        timeText: tijden ?? undefined,
        dresscode: dresscode ?? undefined,
        details: tekst.details ?? undefined,
        detailsStijl: tekst.detailsStijl ?? undefined,
        detailsIcoon: tekst.detailsIcoon || undefined,
      },
      { title: tekst.namen, frame_names: tekst.namen, datum: tekst.datum, locatie: tekst.locatie }
    ),
    heading: tekst.kop,
    // De ontwerpen van de homepagina zijn geen kaart; buildCardDisplay kent
    // ze niet en zou er Strak van maken
    design: ontwerp,
    // Op de homepagina geen boodschap op het ontwerp: daarvoor is de tekst
    // eronder
    message: "",
    eigenBericht: false,
    inviteLine: null,
  }
  // Welke regel van de details wat is: eerst de tijden, dan de dresscode
  const detailRollen: ("tijden" | "dresscode")[] = [...(tijden ? ["tijden" as const] : []), ...(dresscode ? ["dresscode" as const] : [])]

  // De gekozen lettertypes als font-family, de groottes zoals ze zijn
  const eigen: EigenTekst = {}
  for (const [rol, w] of Object.entries(instellingen ?? {}) as [TekstRol, { font?: string; schaal?: number }][]) {
    eigen[rol] = { font: w?.font ? getTitleFont(w.font).family : undefined, schaal: w?.schaal }
  }

  const eronder = detailsKeuze(ontwerp) && !detailsOpKaart(ontwerp, tekst.details) && display.timeText
  const tekstLetter = browserLetters(ontwerp).tekst

  return (
    <div ref={vak} className="w-full flex flex-col items-center">
      <KaartVoorkant
        d={display}
        ontwerp={ontwerp}
        sc={scNu}
        breedte={breedte}
        letters={browserLetters(ontwerp)}
        vrij
        opFoto={opFoto}
        eigen={eigen}
        detailRollen={detailRollen}
        namenMeting={gemetenLetter(instellingen?.namen?.font)}
      />
      {eronder && (
        <div className="flex flex-col items-center mt-4 gap-0.5">
          {display.timeText!.split("\n").map((regel, i) => {
            const rol = detailRollen[i] ?? "tijden"
            return (
              <p
                key={i}
                className="text-center"
                style={{
                  color: sc.accent,
                  fontFamily: eigen[rol]?.font ?? tekstLetter,
                  fontSize: `${0.9 * (eigen[rol]?.schaal ?? 1)}rem`,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  lineHeight: 1.6,
                }}
              >
                {regel}
              </p>
            )
          })}
        </div>
      )}
    </div>
  )
}
