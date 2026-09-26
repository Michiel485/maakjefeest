"use client"

// Het ontwerp op de homepagina: hetzelfde als een kaart, maar vrij op de
// pagina (lib/home-ontwerp.ts). De tekst komt uit de site, de kleuren van de
// website, en lettertype en grootte kan het bruidspaar zelf kiezen.

import { useEffect, useRef, useState } from "react"
import KaartVoorkant from "@/components/kaart/KaartVoorkant"
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

export default function HomeOntwerp({
  ontwerp,
  sc,
  tekst,
  letters,
  schaal,
  vasteBreedte,
}: {
  ontwerp: NieuwOntwerp
  sc: SC
  tekst: HomeOntwerpTekst
  /** Eigen lettertypes (een id uit lib/title-fonts.ts); leeg is die van het ontwerp */
  letters?: { kop?: string; namen?: string; tekst?: string }
  schaal?: { kop?: number; namen?: number; tekst?: number }
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

  const display = {
    ...buildCardDisplay(
      "trouwkaart",
      ontwerp,
      {
        names: tekst.namen,
        location: tekst.locatie ?? undefined,
        timeText: tekst.tijden ?? undefined,
        dresscode: tekst.dresscode ?? undefined,
        details: tekst.details ?? undefined,
      },
      { title: tekst.namen, frame_names: tekst.namen, datum: tekst.datum, locatie: tekst.locatie }
    ),
    heading: tekst.kop,
    // Op de homepagina geen boodschap op het ontwerp: daarvoor is de tekst
    // eronder
    message: "",
    eigenBericht: false,
    inviteLine: null,
  }

  const ontwerpLetters = browserLetters(ontwerp)
  const eigen = (id?: string) => (id ? getTitleFont(id).family : null)
  const lettersNu = {
    ...ontwerpLetters,
    kop: eigen(letters?.kop) ?? ontwerpLetters.kop,
    namen: eigen(letters?.namen) ?? ontwerpLetters.namen,
    tekst: eigen(letters?.tekst) ?? ontwerpLetters.tekst,
  }

  const eronder = detailsKeuze(ontwerp) && !detailsOpKaart(ontwerp, tekst.details) && display.timeText

  return (
    <div ref={vak} className="w-full flex flex-col items-center">
      <KaartVoorkant
        d={display}
        ontwerp={ontwerp}
        sc={sc}
        breedte={breedte}
        letters={lettersNu}
        vrij
        schaal={schaal}
        namenMeting={gemetenLetter(letters?.namen)}
      />
      {eronder && (
        <p
          className="text-center mt-4"
          style={{ color: sc.accent, fontFamily: lettersNu.tekst, fontSize: `${0.9 * (schaal?.tekst ?? 1)}rem`, fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "pre-line", lineHeight: 1.6 }}
        >
          {display.timeText}
        </p>
      )}
    </div>
  )
}
