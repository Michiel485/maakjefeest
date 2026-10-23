"use client"

// De tekst-tool op /trouwkaart-tekst (23 oktober 2026). Links vul je in wie,
// wanneer, waar en voor welke gasten; rechts staat de tekst meteen op een
// echte kaart, met daaronder de volledige tekst om te kopiëren. De knop zet
// alles in de browser en opent de kaartbouwer met de boodschap erin, net als
// het namenformulier op de homepage (NamenProef).

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import KaartVoorkant from "@/components/kaart/KaartVoorkant"
import { buildCardDisplay, type NieuwOntwerp } from "@/lib/cards"
import { browserLetters } from "@/lib/kaart-ontwerpen"
import { voegNamenSamen } from "@/lib/namen"
import { LS_NAMEN } from "@/lib/nieuw-concept"
import { meetStap } from "@/lib/stap"
import {
  GROEPEN,
  LEEG_INVOER,
  TONEN,
  antwoordRegel,
  boodschap,
  tijdenRegel,
  volledigeTekst,
  type Groep,
  type TekstInvoer,
  type Toon,
} from "@/lib/trouwkaart-tekst"
import { VOORBEELD, voorbeeldStijl } from "@/lib/voorbeeld"
import { GOUD, GOUD_LICHT, GOUD_VLAK, INKT, IVOOR, IVOOR_KAART, TEKST, ZACHT } from "./stijl"

const LS_KAART = "sayingyes_kaart"
const LS_LOCATIE = "sayingyes_bruiloft_locatie"
const ONTWERP = VOORBEELD.ontwerp as NieuwOntwerp
const KAART_BREEDTE = 300

const invoer = "w-full rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 transition-all"
const invoerStijl = { borderColor: GOUD_LICHT, backgroundColor: "#fff", color: INKT }
const label = "text-xs font-semibold uppercase tracking-[0.14em]"

export default function TrouwkaartTekst() {
  const router = useRouter()
  const [i, setI] = useState<TekstInvoer>(LEEG_INVOER)
  const [gekopieerd, setGekopieerd] = useState(false)

  // Wie hier eerder was, of op de homepage zijn namen typte, ziet ze staan
  useEffect(() => {
    try {
      const n = JSON.parse(localStorage.getItem(LS_NAMEN) ?? "null") as { een?: string; twee?: string } | null
      const k = JSON.parse(localStorage.getItem(LS_KAART) ?? "{}") as { datum?: unknown; location?: unknown }
      const locatie = localStorage.getItem(LS_LOCATIE)
      setI((v) => ({
        ...v,
        een: n?.een ?? v.een,
        twee: n?.twee ?? v.twee,
        datum: typeof k.datum === "string" ? k.datum : v.datum,
        locatie: (typeof k.location === "string" && k.location) || locatie || v.locatie,
      }))
    } catch {}
  }, [])

  function zet<K extends keyof TekstInvoer>(veld: K, waarde: TekstInvoer[K]) {
    setI((v) => ({ ...v, [veld]: waarde }))
    setGekopieerd(false)
  }

  const namen = voegNamenSamen(i.een, i.twee) || VOORBEELD.namen
  const bericht = boodschap(i.groep, i.toon)
  const tijden = tijdenRegel(i.van, i.tot, i.groep)
  const tekst = volledigeTekst(i, namen)

  const sc = useMemo(() => voorbeeldStijl(), [])
  const letters = useMemo(() => browserLetters(ONTWERP), [])
  const display = buildCardDisplay(
    "trouwkaart",
    ONTWERP,
    {
      names: namen,
      namenFont: VOORBEELD.kaartNamenLetter,
      message: bericht,
      guestType: i.groep === "iedereen" ? undefined : i.groep,
      timeText: tijden || undefined,
      details: "op",
      detailsStijl: "sierlijn",
      location: i.locatie.trim() || undefined,
      antwoordVoor: i.antwoordVoor || undefined,
    },
    { title: namen, frame_names: namen, datum: i.datum || VOORBEELD.datum, locatie: i.locatie.trim() || VOORBEELD.locatie },
  )

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst)
      setGekopieerd(true)
    } catch {
      // Geen klembord (oude browser, geen https): de tekst staat eronder om te selecteren
      const el = document.getElementById("trouwkaart-tekst-uit")
      if (el) {
        const r = document.createRange()
        r.selectNodeContents(el)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(r)
      }
    }
  }

  function opDeKaart() {
    try {
      localStorage.setItem(LS_NAMEN, JSON.stringify({ een: i.een.trim(), twee: i.twee.trim() }))
      const vorig = JSON.parse(localStorage.getItem(LS_KAART) ?? "{}") as Record<string, unknown>
      // De bouwer opent met de kaart die je hier zag, tenzij je daar al een
      // ontwerp had gekozen
      const ontwerp = vorig.template ? {} : { template: ONTWERP, style: VOORBEELD.stijl, namenFont: VOORBEELD.kaartNamenLetter }
      localStorage.setItem(
        LS_KAART,
        JSON.stringify({
          ...vorig,
          ...ontwerp,
          type: "trouwkaart",
          names: voegNamenSamen(i.een, i.twee),
          datum: i.datum,
          location: i.locatie.trim(),
          message: bericht,
          guestType: i.groep === "iedereen" ? "" : i.groep,
          timeText: tijden,
          details: "op",
          antwoordVoor: i.antwoordVoor,
        }),
      )
      if (i.locatie.trim()) localStorage.setItem(LS_LOCATIE, i.locatie.trim())
    } catch {}
    meetStap("tekst")
    router.push("/kaart-maken?type=trouwkaart")
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      {/* Links: wat je invult */}
      <form onSubmit={(e) => { e.preventDefault(); opDeKaart() }} className="flex flex-col gap-5 min-w-0" aria-label="Gegevens voor de tekst">
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={i.een} onChange={(e) => zet("een", e.target.value)} placeholder="Jouw naam" maxLength={40} autoComplete="given-name" className={invoer} style={invoerStijl} aria-label="Jouw naam" />
          <input type="text" value={i.twee} onChange={(e) => zet("twee", e.target.value)} placeholder="Naam van je partner" maxLength={40} className={invoer} style={invoerStijl} aria-label="Naam van je partner" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={label} style={{ color: TEKST }}>Trouwdatum</span>
            <input type="date" value={i.datum} onChange={(e) => zet("datum", e.target.value)} className={invoer} style={{ ...invoerStijl, color: i.datum ? INKT : ZACHT }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label} style={{ color: TEKST }}>Locatie</span>
            <input type="text" value={i.locatie} onChange={(e) => zet("locatie", e.target.value)} placeholder="Landgoed Duno, Doorwerth" maxLength={120} className={invoer} style={invoerStijl} />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
          <legend className={label} style={{ color: TEKST, marginBottom: 6 }}>Voor wie is deze kaart?</legend>
          <div className="grid grid-cols-2 gap-2">
            {GROEPEN.map(([id, naam, uitleg]) => (
              <Keuze key={id} actief={i.groep === id} onClick={() => zet("groep", id as Groep)} naam={naam} uitleg={uitleg} />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
          <legend className={label} style={{ color: TEKST, marginBottom: 6 }}>Welke toon?</legend>
          <div className="grid grid-cols-3 gap-2">
            {TONEN.map(([id, naam]) => (
              <Keuze key={id} actief={i.toon === id} onClick={() => zet("toon", id as Toon)} naam={naam} />
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={label} style={{ color: TEKST }}>Welkom vanaf</span>
            <input type="time" value={i.van} onChange={(e) => zet("van", e.target.value)} className={invoer} style={{ ...invoerStijl, color: i.van ? INKT : ZACHT }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label} style={{ color: TEKST }}>Tot (optioneel)</span>
            <input type="time" value={i.tot} onChange={(e) => zet("tot", e.target.value)} className={invoer} style={{ ...invoerStijl, color: i.tot ? INKT : ZACHT }} />
          </label>
          <label className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
            <span className={label} style={{ color: TEKST }}>Antwoord vóór</span>
            <input type="date" value={i.antwoordVoor} onChange={(e) => zet("antwoordVoor", e.target.value)} className={invoer} style={{ ...invoerStijl, color: i.antwoordVoor ? INKT : ZACHT }} />
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2.5 text-base font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
          style={{ backgroundColor: INKT, color: IVOOR, boxShadow: "0 8px 32px rgba(26,26,26,0.18)", border: 0, cursor: "pointer" }}
        >
          Zet deze tekst op jullie digitale kaart
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </button>
        <p className="text-xs" style={{ color: TEKST }}>
          Gratis ontwerpen, zonder account. Je betaalt pas als je de kaart verstuurt. Liever een papieren kaart? Kopieer de volledige tekst onder de kaart.
        </p>
      </form>

      {/* Rechts: de tekst op een echte kaart, en de volledige tekst om te kopiëren */}
      <div className="flex flex-col gap-6 min-w-0 items-center lg:items-stretch">
        <div className="flex justify-center">
          <div style={{ width: KAART_BREEDTE, maxWidth: "100%" }}>
            <KaartVoorkant d={display} ontwerp={ONTWERP} sc={sc} breedte={KAART_BREEDTE} letters={letters} />
          </div>
        </div>
        <div className="w-full rounded-3xl p-6 sm:p-7" style={{ backgroundColor: IVOOR_KAART, border: `1px solid ${GOUD_LICHT}` }}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className={label} style={{ color: GOUD, margin: 0 }}>De volledige tekst</p>
            <button
              type="button"
              onClick={kopieer}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl transition-all hover:opacity-85"
              style={{ backgroundColor: gekopieerd ? GOUD : "#fff", color: gekopieerd ? "#fff" : INKT, border: `1px solid ${GOUD_LICHT}`, cursor: "pointer" }}
            >
              {gekopieerd ? "Gekopieerd" : "Kopieer tekst"}
            </button>
          </div>
          <p id="trouwkaart-tekst-uit" className="m-0 text-[15px] leading-relaxed whitespace-pre-line" style={{ color: INKT }}>
            {tekst}
          </p>
          {!i.antwoordVoor && (
            <p className="mt-4 mb-0 text-xs" style={{ color: ZACHT }}>
              Tip: vul een antwoorddatum in, dan komt de zin &ldquo;{antwoordRegel("2027-05-01")}&rdquo; erbij. Zonder vraag krijg je geen antwoord.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Keuze({ actief, onClick, naam, uitleg }: { actief: boolean; onClick: () => void; naam: string; uitleg?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actief}
      className="rounded-xl px-3 py-2.5 text-left transition-all"
      style={{
        backgroundColor: actief ? GOUD_VLAK : "#fff",
        border: `1px solid ${actief ? GOUD : GOUD_LICHT}`,
        boxShadow: actief ? `0 0 0 1px ${GOUD}` : "none",
        cursor: "pointer",
      }}
    >
      <span className="block text-sm font-semibold" style={{ color: INKT }}>{naam}</span>
      {uitleg && <span className="block text-[11px] mt-0.5" style={{ color: TEKST }}>{uitleg}</span>}
    </button>
  )
}
