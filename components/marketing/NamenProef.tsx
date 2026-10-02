"use client"

// Bovenaan de homepage: typ jullie namen en zie meteen een echte kaart
// (ontwerpronde, ronde 7, 2 oktober 2026). De sterkste verkoper die we
// hebben is het product zelf, niet een tekst erover. Wie zijn namen typt is
// al bezig; de knop zet alles in de browser en opent de kaartbouwer met de
// kaart erin.

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import KaartVoorkant from "@/components/kaart/KaartVoorkant"
import { buildCardDisplay, type NieuwOntwerp } from "@/lib/cards"
import { getStyleConfig } from "@/lib/event-styles"
import { browserLetters } from "@/lib/kaart-ontwerpen"
import { voegNamenSamen } from "@/lib/namen"
import { LS_NAMEN } from "@/lib/nieuw-concept"
import { meetStap } from "@/lib/stap"
import { GOUD, GOUD_LICHT, INKT, IVOOR, TEKST, ZACHT } from "./stijl"

const LS_KAART = "sayingyes_kaart"
const ONTWERP: NieuwOntwerp = "olijf"
const STIJL = "ivoor"

const invoer =
  "w-full rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 transition-all"

export default function NamenProef() {
  const router = useRouter()
  const [een, setEen] = useState("")
  const [twee, setTwee] = useState("")
  const [datum, setDatum] = useState("")
  const sc = getStyleConfig(STIJL)

  // Zo breed als er ruimte is, tot de maat van een kaart
  const vak = useRef<HTMLDivElement>(null)
  const [breedte, setBreedte] = useState(340)
  useEffect(() => {
    const el = vak.current
    if (!el) return
    const meet = () => setBreedte(Math.max(240, Math.min(360, Math.round(el.clientWidth))))
    meet()
    const ro = new ResizeObserver(meet)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

  const namen = voegNamenSamen(een, twee) || "Jullie namen"
  const display = buildCardDisplay(
    "trouwkaart",
    ONTWERP,
    { names: namen },
    { title: namen, frame_names: namen, datum: datum || null, locatie: null }
  )

  function verder() {
    try {
      localStorage.setItem(LS_NAMEN, JSON.stringify({ een: een.trim(), twee: twee.trim() }))
      const vorig = JSON.parse(localStorage.getItem(LS_KAART) ?? "{}") as Record<string, unknown>
      delete vorig.details
      localStorage.setItem(LS_KAART, JSON.stringify({ ...vorig, names: voegNamenSamen(een, twee), datum, type: "trouwkaart" }))
    } catch {}
    meetStap("namen")
    router.push("/kaart-maken?type=trouwkaart")
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-center">
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
          Gratis ontwerpen, zonder account. Je betaalt pas als je de kaart verstuurt: 15 euro.
        </p>
      </form>

      <div ref={vak} className="flex flex-col items-center">
        <div style={{ filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.16))", transform: "rotate(-1.5deg)" }}>
          <KaartVoorkant d={display} ontwerp={ONTWERP} sc={sc} breedte={breedte} letters={browserLetters(ONTWERP)} />
        </div>
        <p className="text-[11px] mt-5" style={{ color: ZACHT, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          <span style={{ color: GOUD }}>&#9670;</span>&nbsp; verandert live mee
        </p>
      </div>
    </div>
  )
}
