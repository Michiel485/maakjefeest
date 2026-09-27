"use client"

// De websitebouwer voor het ontwerp op de homepagina (Michiel, 26 en 27
// september 2026). Twee delen, op hun eigen plek in de bouwer:
// - de galerij, onder Ontwerp;
// - de tekstvelden, onder Tekstvelden, in de volgorde van de pagina, met
//   onder elk veld een eigen lettertype en grootte.
// Kies je een ontwerp, dan gaan lettertypes en groottes terug naar die van
// het ontwerp, zodat alles weer binnen de tekening valt, zoals in het tegeltje.

import { useEffect, useRef, useState, type ReactNode } from "react"
import HomeOntwerp, { type HomeOntwerpTekst, type HomeTekstInstellingen } from "@/components/HomeOntwerp"
import type { TekstRol } from "@/components/kaart/KaartVoorkant"
import { CARD_TEMPLATE_LABEL, type NieuwOntwerp } from "@/lib/cards"
import type { SC } from "@/lib/event-styles"
import { HOME_ONTWERPEN, HOME_KOP_STANDAARD } from "@/lib/home-ontwerp"
import { detailsKeuze, detailsOpKaart, type DetailsStand } from "@/lib/kaart-ontwerpen"
import { TITLE_FONT_OPTIONS } from "@/lib/title-fonts"

export interface HomeOntwerpInstellingen {
  ontwerp?: string
  ontwerpKop?: string
  ontwerpTekst?: HomeTekstInstellingen
  tijden?: string
  dresscode?: string
  details?: DetailsStand
}

const invoer =
  "rounded-xl border border-[var(--goud-licht)] px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--goud-vlak)] focus:border-[var(--goud)] transition-all"

/** Een ontwerp als klein tegeltje, precies zoals het op de pagina komt */
function Tegel({ ontwerp, sc, tekst, gekozen, onKies }: { ontwerp: NieuwOntwerp; sc: SC; tekst: HomeOntwerpTekst; gekozen: boolean; onKies: () => void }) {
  const vak = useRef<HTMLButtonElement>(null)
  const [breedte, setBreedte] = useState(96)
  useEffect(() => {
    const el = vak.current
    if (!el) return
    const meet = () => setBreedte(Math.max(60, el.clientWidth))
    const ro = new ResizeObserver(meet)
    ro.observe(el)
    const t = setTimeout(meet, 0)
    return () => { ro.disconnect(); clearTimeout(t) }
  }, [])
  const schaal = breedte / 400
  return (
    <div className="flex flex-col gap-1">
      <button
        ref={vak}
        type="button"
        onClick={onKies}
        title={CARD_TEMPLATE_LABEL[ontwerp]}
        aria-pressed={gekozen}
        className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${gekozen ? "border-[#C5A059] ring-2 ring-[#C5A059]/30" : "border-gray-100 hover:border-gray-300"}`}
        style={{ backgroundColor: sc.bodyBg, cursor: "pointer" }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width: 400, flexShrink: 0, transform: `scale(${schaal})`, transformOrigin: "center" }}>
            <HomeOntwerp ontwerp={ontwerp} sc={sc} tekst={tekst} vasteBreedte={400} />
          </div>
        </div>
      </button>
      <span className="text-[11px] text-center leading-tight" style={{ color: gekozen ? "#C5A059" : "#6B7280", fontWeight: gekozen ? 700 : 500 }}>
        {CARD_TEMPLATE_LABEL[ontwerp]}
      </span>
    </div>
  )
}

/** De galerij met ontwerpen */
export default function HomeOntwerpGalerij({
  instellingen,
  onWijzig,
  ontwerp,
  sc,
  namen,
  datum,
  locatie,
}: {
  instellingen: HomeOntwerpInstellingen
  onWijzig: (w: Partial<HomeOntwerpInstellingen>) => void
  /** Het ontwerp dat nu getoond wordt, ook als er nog niets gekozen is */
  ontwerp: NieuwOntwerp
  sc: SC
  namen: string
  datum: string
  locatie: string
}) {
  const tekst: HomeOntwerpTekst = {
    kop: instellingen.ontwerpKop ?? HOME_KOP_STANDAARD,
    namen: namen || "Jullie namen",
    datum: datum || null,
    locatie: locatie || null,
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-gray-400 leading-snug">De tekst op het ontwerp pas je aan bij Tekstvelden.</p>
      <div className="grid grid-cols-3 gap-2">
        {HOME_ONTWERPEN.map((o) => (
          <Tegel
            key={o}
            ontwerp={o}
            sc={sc}
            tekst={tekst}
            gekozen={o === ontwerp}
            // Een ander ontwerp: lettertypes en groottes weer zoals dat
            // ontwerp ze heeft, zodat alles binnen de tekening valt
            onKies={() => onWijzig({ ontwerp: o, ontwerpTekst: {} })}
          />
        ))}
      </div>
    </div>
  )
}

/** Lettertype en grootte, direct onder een tekstveld */
function LetterRegel({ waarde, schaal, onFont, onSchaal }: { waarde?: string; schaal: number; onFont: (v: string | undefined) => void; onSchaal: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl px-3 py-2.5 bg-white border border-[var(--goud-licht)]">
      <select
        value={waarde ?? ""}
        onChange={(e) => onFont(e.target.value || undefined)}
        aria-label="Lettertype"
        className="rounded-lg border border-[var(--goud-licht)] bg-white px-2 py-1.5 text-[11px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-[var(--goud-vlak)]"
      >
        <option value="">Lettertype van het ontwerp</option>
        {TITLE_FONT_OPTIONS.map((f) => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500 w-12 flex-shrink-0">Grootte</span>
        <input
          type="range"
          min={0.5}
          max={1.8}
          step={0.05}
          value={schaal}
          onChange={(e) => onSchaal(Number(e.target.value))}
          aria-label="Grootte"
          className="flex-1 accent-[#C5A059]"
        />
        <span className="text-[11px] text-gray-400 w-9 text-right flex-shrink-0">{Math.round(schaal * 100)}%</span>
      </div>
    </div>
  )
}

function Veld({ id, label, children }: { id: string; label: ReactNode; children: ReactNode }) {
  return (
    <div id={id} className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      {children}
    </div>
  )
}

/** De tekstvelden op het ontwerp, in de volgorde van de pagina */
export function HomeOntwerpTekstvelden({
  instellingen,
  onWijzig,
  ontwerp,
  namen,
  datum,
  locatie,
  onNamen,
  onDatum,
  onLocatie,
}: {
  instellingen: HomeOntwerpInstellingen
  onWijzig: (w: Partial<HomeOntwerpInstellingen>) => void
  ontwerp: NieuwOntwerp
  namen: string
  datum: string
  locatie: string
  onNamen: (v: string) => void
  onDatum: (v: string) => void
  onLocatie: (v: string) => void
}) {
  const tekstInst = instellingen.ontwerpTekst ?? {}
  const letter = (rol: TekstRol) => (
    <LetterRegel
      waarde={tekstInst[rol]?.font}
      schaal={tekstInst[rol]?.schaal ?? 1}
      onFont={(v) => onWijzig({ ontwerpTekst: { ...tekstInst, [rol]: { ...tekstInst[rol], font: v } } })}
      onSchaal={(v) => onWijzig({ ontwerpTekst: { ...tekstInst, [rol]: { ...tekstInst[rol], schaal: v } } })}
    />
  )
  const aangepast = Object.values(tekstInst).some((w) => w && (w.font || (w.schaal != null && w.schaal !== 1)))
  const kanKiezen = detailsKeuze(ontwerp)
  const waar: DetailsStand = detailsOpKaart(ontwerp, instellingen.details) ? "op" : "onder"

  return (
    <div className="flex flex-col gap-4">
      <Veld id="hp-field-ontwerp-kop" label="Kop">
        <input type="text" value={instellingen.ontwerpKop ?? HOME_KOP_STANDAARD} onChange={(e) => onWijzig({ ontwerpKop: e.target.value })} placeholder={HOME_KOP_STANDAARD} className={invoer} />
        {letter("kop")}
      </Veld>
      <Veld id="hp-field-namen" label="Namen">
        <textarea rows={2} value={namen} onChange={(e) => onNamen(e.target.value)} placeholder="Michiel & Lindsey" className={`${invoer} resize-none`} />
        <p className="text-[10px] text-gray-400 leading-snug -mt-0.5">Op één regel getypt staat op één regel. Met een enter ertussen onder elkaar.</p>
        {letter("namen")}
      </Veld>
      <Veld id="hp-field-datum" label="Datum">
        <input type="date" value={datum} onChange={(e) => onDatum(e.target.value)} className={invoer} />
        {letter("datum")}
      </Veld>
      <Veld id="hp-field-locatie" label="Locatie">
        <input type="text" value={locatie} onChange={(e) => onLocatie(e.target.value)} placeholder="Kasteel de Haar" className={invoer} />
        {letter("locatie")}
      </Veld>
      <Veld id="hp-field-tijden" label={<>Tijden <span className="font-normal text-gray-400">(optioneel)</span></>}>
        <input type="text" value={instellingen.tijden ?? ""} onChange={(e) => onWijzig({ tijden: e.target.value })} placeholder="Van 14:00 tot 23:00 uur" maxLength={60} className={invoer} />
        {instellingen.tijden?.trim() && letter("tijden")}
      </Veld>
      <Veld id="hp-field-dresscode" label={<>Dresscode <span className="font-normal text-gray-400">(optioneel)</span></>}>
        <input type="text" value={instellingen.dresscode ?? ""} onChange={(e) => onWijzig({ dresscode: e.target.value })} placeholder="Feestelijk" maxLength={40} className={invoer} />
        {instellingen.dresscode?.trim() && letter("dresscode")}
      </Veld>
      {kanKiezen && (instellingen.tijden?.trim() || instellingen.dresscode?.trim()) && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">Tijden en dresscode</span>
          <div className="inline-flex rounded-xl p-0.5 bg-[#FBF5E8] border border-[var(--goud-licht)]" role="radiogroup" aria-label="Tijden en dresscode op of onder het ontwerp">
            {(["op", "onder"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={waar === s}
                onClick={() => onWijzig({ details: s })}
                className="text-xs font-semibold px-3 py-1.5 rounded-[10px]"
                style={{ backgroundColor: waar === s ? "#fff" : "transparent", color: waar === s ? "#1A1A1A" : "#9A8E82", boxShadow: waar === s ? "0 1px 3px rgba(0,0,0,0.1)" : "none", border: 0, cursor: "pointer" }}
              >
                {s === "op" ? "Op het ontwerp" : "Eronder"}
              </button>
            ))}
          </div>
        </div>
      )}
      {aangepast && (
        <button
          type="button"
          onClick={() => onWijzig({ ontwerpTekst: {} })}
          className="self-start text-xs font-semibold text-[#C5A059] hover:underline"
          style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
        >
          Lettertypes en groottes terug zoals het ontwerp
        </button>
      )}
    </div>
  )
}
