"use client"

// Het paneel in de websitebouwer voor het ontwerp op de homepagina: kiezen
// uit de ontwerpen, de tekst erop, lettertypes en groottes, en tijden en
// dresscode op of onder het ontwerp (Michiel, 26 september 2026).

import { useEffect, useRef, useState } from "react"
import HomeOntwerp, { type HomeOntwerpTekst } from "@/components/HomeOntwerp"
import { CARD_TEMPLATE_LABEL, type NieuwOntwerp } from "@/lib/cards"
import type { SC } from "@/lib/event-styles"
import { HOME_ONTWERPEN, HOME_KOP_STANDAARD } from "@/lib/home-ontwerp"
import { browserLetters, detailsKeuze, detailsOpKaart, type DetailsStand } from "@/lib/kaart-ontwerpen"
import { TITLE_FONT_OPTIONS } from "@/lib/title-fonts"

type Rol = "kop" | "namen" | "tekst"

export interface HomeOntwerpInstellingen {
  ontwerp?: string
  ontwerpKop?: string
  ontwerpLetters?: { kop?: string; namen?: string; tekst?: string }
  ontwerpSchaal?: { kop?: number; namen?: number; tekst?: number }
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

/** Lettertype en grootte voor één soort tekst */
function LetterKeuze({
  label,
  uitleg,
  waarde,
  ontwerpFont,
  schaal,
  onFont,
  onSchaal,
}: {
  label: string
  uitleg?: string
  waarde?: string
  ontwerpFont: string
  schaal: number
  onFont: (v: string | undefined) => void
  onSchaal: (v: number) => void
}) {
  const cur = TITLE_FONT_OPTIONS.find((f) => f.id === waarde)
  return (
    <div className="flex flex-col gap-1.5 bg-white rounded-xl p-3 border border-[var(--goud-licht)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-sm text-gray-600 leading-none" style={{ fontFamily: cur ? `var(${cur.cssVar})` : ontwerpFont, fontWeight: cur?.weight }}>Aa</span>
      </div>
      {uitleg && <p className="text-[10px] text-gray-400 leading-snug -mt-1">{uitleg}</p>}
      <select
        value={waarde ?? ""}
        onChange={(e) => onFont(e.target.value || undefined)}
        className="rounded-lg border border-[var(--goud-licht)] bg-white px-2 py-1.5 text-[11px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-[var(--goud-vlak)]"
      >
        <option value="">Zoals het ontwerp</option>
        {TITLE_FONT_OPTIONS.map((f) => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Grootte</span>
        <span className="text-xs text-gray-400">{Math.round(schaal * 100)}%</span>
      </div>
      <input type="range" min={0.6} max={1.6} step={0.05} value={schaal} onChange={(e) => onSchaal(Number(e.target.value))} className="w-full accent-[#C5A059]" />
    </div>
  )
}

export default function HomeOntwerpPaneel({
  instellingen,
  onWijzig,
  ontwerp,
  sc,
  namen,
  datum,
  locatie,
  onNamen,
  onDatum,
  onLocatie,
}: {
  instellingen: HomeOntwerpInstellingen
  onWijzig: (w: Partial<HomeOntwerpInstellingen>) => void
  /** Het ontwerp dat nu getoond wordt, ook als er nog niets gekozen is */
  ontwerp: NieuwOntwerp
  sc: SC
  namen: string
  datum: string
  locatie: string
  onNamen: (v: string) => void
  onDatum: (v: string) => void
  onLocatie: (v: string) => void
}) {
  const kop = instellingen.ontwerpKop ?? HOME_KOP_STANDAARD
  const tekst: HomeOntwerpTekst = { kop, namen: namen || "Jullie namen", datum: datum || null, locatie: locatie || null }
  const letters = instellingen.ontwerpLetters ?? {}
  const schaal = instellingen.ontwerpSchaal ?? {}
  const ontwerpLetters = browserLetters(ontwerp)
  const zetLetter = (rol: Rol, v: string | undefined) => onWijzig({ ontwerpLetters: { ...letters, [rol]: v } })
  const zetSchaal = (rol: Rol, v: number) => onWijzig({ ontwerpSchaal: { ...schaal, [rol]: v } })
  const kanKiezen = detailsKeuze(ontwerp)
  const waar: DetailsStand = detailsOpKaart(ontwerp, instellingen.details) ? "op" : "onder"

  return (
    <div className="flex flex-col gap-5">
      {/* ── De ontwerpen ── */}
      <div className="grid grid-cols-3 gap-2">
        {HOME_ONTWERPEN.map((o) => (
          <Tegel key={o} ontwerp={o} sc={sc} tekst={tekst} gekozen={o === ontwerp} onKies={() => onWijzig({ ontwerp: o })} />
        ))}
      </div>

      {/* ── De tekst op het ontwerp ── */}
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Kop</span>
          <input type="text" value={kop} onChange={(e) => onWijzig({ ontwerpKop: e.target.value })} placeholder={HOME_KOP_STANDAARD} className={invoer} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Namen</span>
          <textarea rows={2} value={namen} onChange={(e) => onNamen(e.target.value)} placeholder="Michiel & Lindsey" className={`${invoer} resize-none`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Datum</span>
          <input type="date" value={datum} onChange={(e) => onDatum(e.target.value)} className={invoer} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Locatie</span>
          <input type="text" value={locatie} onChange={(e) => onLocatie(e.target.value)} placeholder="Kasteel de Haar" className={invoer} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Tijden <span className="font-normal text-gray-400">(optioneel)</span></span>
          <input type="text" value={instellingen.tijden ?? ""} onChange={(e) => onWijzig({ tijden: e.target.value })} placeholder="Van 14:00 tot 23:00 uur" maxLength={60} className={invoer} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Dresscode <span className="font-normal text-gray-400">(optioneel)</span></span>
          <input type="text" value={instellingen.dresscode ?? ""} onChange={(e) => onWijzig({ dresscode: e.target.value })} placeholder="Feestelijk" maxLength={40} className={invoer} />
        </label>
        {kanKiezen && (instellingen.tijden || instellingen.dresscode) && (
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
      </div>

      {/* ── Lettertypes en groottes ── */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#C5A059]">Lettertypes</span>
        <LetterKeuze
          label="Kop en datum"
          waarde={letters.kop}
          ontwerpFont={ontwerpLetters.kop}
          schaal={schaal.kop ?? 1}
          onFont={(v) => zetLetter("kop", v)}
          onSchaal={(v) => zetSchaal("kop", v)}
        />
        <LetterKeuze
          label="Namen"
          waarde={letters.namen}
          ontwerpFont={ontwerpLetters.namen}
          schaal={schaal.namen ?? 1}
          onFont={(v) => zetLetter("namen", v)}
          onSchaal={(v) => zetSchaal("namen", v)}
        />
        <LetterKeuze
          label="Overige tekst"
          uitleg="De locatie, tijden en dresscode"
          waarde={letters.tekst}
          ontwerpFont={ontwerpLetters.tekst}
          schaal={schaal.tekst ?? 1}
          onFont={(v) => zetLetter("tekst", v)}
          onSchaal={(v) => zetSchaal("tekst", v)}
        />
      </div>
    </div>
  )
}
