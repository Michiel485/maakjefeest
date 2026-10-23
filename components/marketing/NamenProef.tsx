"use client"

// Bovenaan de homepage: typ jullie namen en zie meteen een echte kaart
// (ontwerpronde, ronde 7, 2 oktober 2026). De sterkste verkoper die we
// hebben is het product zelf, niet een tekst erover. Wie zijn namen typt is
// al bezig; de knop zet alles in de browser en opent de kaartbouwer met de
// kaart erin.

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Waaier from "./Waaier"
import type { NieuwOntwerp } from "@/lib/cards"
import { voegNamenSamen } from "@/lib/namen"
import { LS_NAMEN } from "@/lib/nieuw-concept"
import { meetStap } from "@/lib/stap"
import { VOORBEELD } from "@/lib/voorbeeld"
import { GOUD, GOUD_LICHT, INKT, IVOOR, TEKST, ZACHT } from "./stijl"

const LS_KAART = "sayingyes_kaart"
// Dezelfde kaart als die van het voorbeeldpaar (lib/voorbeeld.ts): sinds 11
// oktober 2026 de krans met takjes in Zand, met de namen in Montserrat, zoals
// Michiels testsite. Eerder Olijf in Parel, Boog in Zand en Hart met schaduw
// in Smaragd.
const ONTWERP: NieuwOntwerp = VOORBEELD.ontwerp
const STIJL = VOORBEELD.stijl

const invoer =
  "w-full rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 transition-all"

export default function NamenProef({ intro }: { intro?: React.ReactNode } = {}) {
  const router = useRouter()
  const [een, setEen] = useState("")
  const [twee, setTwee] = useState("")
  const [datum, setDatum] = useState("")

  // Wie hier eerder was, ziet zijn namen staan
  useEffect(() => {
    try {
      const n = JSON.parse(localStorage.getItem(LS_NAMEN) ?? "null") as { een?: string; twee?: string } | null
      if (n?.een) setEen(n.een)
      if (n?.twee) setTwee(n.twee)
      const k = JSON.parse(localStorage.getItem(LS_KAART) ?? "{}") as { datum?: unknown }
      if (typeof k.datum === "string") setDatum(k.datum)
    } catch {}
  }, [])

  // Zolang er niets getypt is: het voorbeeldpaar. "Jullie namen" gaf in de
  // boog de initialen J | N.
  const namen = voegNamenSamen(een, twee) || VOORBEELD.namen

  function verder() {
    try {
      localStorage.setItem(LS_NAMEN, JSON.stringify({ een: een.trim(), twee: twee.trim() }))
      const vorig = JSON.parse(localStorage.getItem(LS_KAART) ?? "{}") as Record<string, unknown>
      delete vorig.details
      // De bouwer opent met de kaart die je hier zag, tenzij je daar al een
      // ontwerp had gekozen
      const ontwerp = vorig.template ? {} : { template: ONTWERP, style: STIJL, namenFont: VOORBEELD.kaartNamenLetter }
      localStorage.setItem(LS_KAART, JSON.stringify({ ...vorig, ...ontwerp, names: voegNamenSamen(een, twee), datum, type: "trouwkaart" }))
    } catch {}
    meetStap("namen")
    router.push("/kaart-maken?type=trouwkaart")
  }

  return (
    // De kop en de uitleg staan links boven het formulier, naast de kaart.
    // Stonden ze erboven over de hele breedte, dan zakte het formulier naar
    // het midden van de hoge kaart en bleef er een gat onder de tekst
    // (Michiel, 11 oktober 2026).
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
      <div className="flex flex-col gap-8 min-w-0 max-w-xl">
      {intro}
      <form
        onSubmit={(e) => { e.preventDefault(); verder() }}
        className="flex flex-col gap-3"
        aria-label="Jullie namen en datum"
      >
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={een}
            onChange={(e) => setEen(e.target.value)}
            placeholder="Jouw naam"
            maxLength={40}
            autoComplete="given-name"
            className={invoer}
            style={{ borderColor: GOUD_LICHT, backgroundColor: "#fff", color: INKT }}
            aria-label="Jouw naam"
          />
          <input
            type="text"
            value={twee}
            onChange={(e) => setTwee(e.target.value)}
            placeholder="Naam van je partner"
            maxLength={40}
            className={invoer}
            style={{ borderColor: GOUD_LICHT, backgroundColor: "#fff", color: INKT }}
            aria-label="Naam van je partner"
          />
        </div>
        <input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className={invoer}
          style={{ borderColor: GOUD_LICHT, backgroundColor: "#fff", color: datum ? INKT : ZACHT }}
          aria-label="Trouwdatum"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2.5 text-base font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
          style={{ backgroundColor: INKT, color: IVOOR, boxShadow: "0 8px 32px rgba(26,26,26,0.18)", border: 0, cursor: "pointer" }}
        >
          Bekijk jullie kaart
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
        <p className="text-xs" style={{ color: TEKST }}>
          Gratis ontwerpen, zonder account. Je betaalt pas als je de kaart verstuurt.
        </p>
        {/* Eén regel vertrouwen, zolang er nog geen klantreviews zijn (Michiel, 23 oktober 2026) */}
        <p className="text-xs flex items-center gap-2 mt-1" style={{ color: TEKST }}>
          <span aria-hidden="true" style={{ color: GOUD }}>&#10003;</span>
          Gebruikt op onze eigen bruiloft, 24 mei 2026. Gemaakt in Nederland.
        </p>
      </form>
      </div>

      {/* Wat je allemaal krijgt, met jullie namen erop (Michiel, 11 oktober 2026) */}
      <Waaier namen={namen} datum={datum} />
    </div>
  )
}
