"use client"

// Het ontwerp op de homepagina: hetzelfde als een kaart, maar vrij op de
// pagina (lib/home-ontwerp.ts). De tekst komt uit de site, de kleuren van de
// website, en per tekst kan het bruidspaar een eigen letter en grootte kiezen.

import { useEffect, useRef, useState } from "react"
import KaartVoorkant, { type EigenTekst, type TekstRol } from "@/components/kaart/KaartVoorkant"
import { buildCardDisplay, type NieuwOntwerp } from "@/lib/cards"
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
}

/** Per tekst een lettertype (een id uit lib/title-fonts.ts) en een grootte (1 is zoals ontworpen) */
export type HomeTekstInstellingen = Partial<Record<TekstRol, { font?: string; schaal?: number }>>

export default function HomeOntwerp({
  ontwerp,
  sc,
  tekst,
  instellingen,
  vasteBreedte,
}: {
  ontwerp: NieuwOntwerp
  sc: SC
  tekst: HomeOntwerpTekst
  instellingen?: HomeTekstInstellingen
  /** Voor een tegeltje in de bouwer: altijd deze breedte, zonder te meten */
  vasteBreedte?: number
}) {
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
        sc={sc}
        breedte={breedte}
        letters={browserLetters(ontwerp)}
        vrij
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
