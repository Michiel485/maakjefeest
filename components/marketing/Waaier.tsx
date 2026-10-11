"use client"

// Wat SayingYes allemaal is, in één beeld naast het formulier bovenaan de
// homepage en de zoekpagina's (Michiel, 11 oktober 2026): de Save the Date, de
// trouwkaart, de website in een telefoon en een stukje gastenlijst, half over
// elkaar als foto's op tafel. Ze schuiven bij het laden één voor één uit de
// stapel en dragen allemaal de namen die je typt.
//
// Alles staat op een vast podium van 560 bij 600 en wordt als geheel
// geschaald naar de ruimte die er is, zodat de stukken op de telefoon precies
// zo over elkaar liggen als op de laptop.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import KaartVoorkant from "@/components/kaart/KaartVoorkant"
import HomeOntwerp from "@/components/HomeOntwerp"
import { buildCardDisplay, type NieuwOntwerp } from "@/lib/cards"
import { formatDate } from "@/lib/event-styles"
import { browserLetters } from "@/lib/kaart-ontwerpen"
import { VOORBEELD, voorbeeldStijl } from "@/lib/voorbeeld"
import { GOUD, INKT, TEKST, ZACHT } from "./stijl"

const PODIUM = 560
const PODIUM_HOOG = 600
const ONTWERP = VOORBEELD.ontwerp as NieuwOntwerp
// De Save the Date in een ander ontwerp, zodat je ziet dat er keus is: Groot
// krijthart (Michiel, 11 oktober 2026)
const ONTWERP_STD: NieuwOntwerp = "krijtgroot"

interface Stuk {
  label: string
  /** Waar het stuk staat op het podium, en hoe het ligt */
  x: number
  y: number
  draai: number
  z: number
  /** Waar het label komt: onder of boven het stuk */
  labelBoven?: boolean
  inhoud: ReactNode
}

export default function Waaier({ namen, datum }: { namen: string; datum: string }) {
  const vak = useRef<HTMLDivElement>(null)
  const [schaal, setSchaal] = useState(0.8)
  useEffect(() => {
    const el = vak.current
    if (!el) return
    const meet = () => setSchaal(Math.min(1, el.clientWidth / PODIUM))
    meet()
    const ro = new ResizeObserver(meet)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const sc = voorbeeldStijl()
  const letters = browserLetters(ONTWERP)
  const event = { title: namen, frame_names: namen, datum: datum || VOORBEELD.datum, locatie: null }
  const inhoud = { names: namen, namenFont: VOORBEELD.kaartNamenLetter }
  const trouwkaart = buildCardDisplay("trouwkaart", ONTWERP, inhoud, event)
  // Zonder de eigen letter van het voorbeeldpaar: die hoort bij de krans
  const saveTheDate = buildCardDisplay("save_the_date", ONTWERP_STD, { names: namen }, event)
  const datumTekst = formatDate(datum || VOORBEELD.datum)

  const stukken: Stuk[] = [
    {
      label: "Save the Date",
      x: 18, y: 40, draai: -9, z: 1, labelBoven: true,
      inhoud: <KaartVoorkant d={saveTheDate} ontwerp={ONTWERP_STD} sc={sc} breedte={190} letters={browserLetters(ONTWERP_STD)} />,
    },
    {
      label: "Website",
      x: 352, y: 34, draai: 6, z: 2, labelBoven: true,
      inhoud: <Telefoon namen={namen} datum={datum || VOORBEELD.datum} />,
    },
    {
      label: "Trouwkaart",
      x: 150, y: 70, draai: -1.5, z: 3, labelBoven: true,
      inhoud: <KaartVoorkant d={trouwkaart} ontwerp={ONTWERP} sc={sc} breedte={230} letters={letters} />,
    },
    {
      label: "Gastenlijst",
      x: 0, y: 388, draai: 3, z: 4,
      inhoud: <Gastenlijst namen={namen} datumTekst={datumTekst} />,
    },
  ]

  return (
    <div ref={vak} className="w-full min-w-0 flex flex-col items-center">
      <style>{`
        @keyframes waaier-in {
          from { opacity: 0; transform: translate(var(--vx), var(--vy)) rotate(0deg) scale(0.9); }
        }
        .waaier-stuk { animation: waaier-in 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .waaier-stuk > .waaier-til { transition: transform 0.25s ease; }
        @media (hover: hover) { .waaier-stuk:hover > .waaier-til { transform: translateY(-8px) scale(1.02); } }
        @media (prefers-reduced-motion: reduce) { .waaier-stuk { animation: none; } }
      `}</style>
      <div style={{ width: PODIUM * schaal, height: PODIUM_HOOG * schaal }}>
        <div className="relative" style={{ width: PODIUM, height: PODIUM_HOOG, transform: `scale(${schaal})`, transformOrigin: "top left" }}>
          {stukken.map((s, i) => {
            // Ze komen uit het midden van de stapel, waar de trouwkaart ligt
            const stijl: CSSProperties & Record<"--vx" | "--vy", string> = {
              position: "absolute",
              left: s.x,
              top: s.y,
              zIndex: s.z,
              transform: `rotate(${s.draai}deg)`,
              animationDelay: `${0.15 + i * 0.14}s`,
              "--vx": `${170 - s.x}px`,
              "--vy": `${90 - s.y}px`,
            }
            return (
              <div key={s.label} className="waaier-stuk" style={stijl}>
                <div className="waaier-til flex flex-col items-center gap-2">
                  {s.labelBoven && <Label tekst={s.label} />}
                  <div style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.16))" }}>{s.inhoud}</div>
                  {!s.labelBoven && <Label tekst={s.label} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="text-[11px] mt-3" style={{ color: ZACHT, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        <span style={{ color: GOUD }}>&#9670;</span>&nbsp; alles verandert live mee
      </p>
    </div>
  )
}

function Label({ tekst }: { tekst: string }) {
  return (
    <span
      className="text-[11px] font-semibold uppercase rounded-full px-2.5 py-1"
      style={{ letterSpacing: "0.14em", color: INKT, backgroundColor: "#fff", border: `1px solid ${GOUD}55` }}
    >
      {tekst}
    </span>
  )
}

/** De homepage van de trouwsite in een telefoon: het ontwerp op de heidefoto */
function Telefoon({ namen, datum }: { namen: string; datum: string }) {
  const sc = voorbeeldStijl()
  return (
    <div style={{ width: 176, height: 352, borderRadius: 30, border: `8px solid ${INKT}`, backgroundColor: INKT, overflow: "hidden", position: "relative" }}>
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 z-10" style={{ width: 56, height: 14, borderRadius: "0 0 10px 10px", backgroundColor: INKT }} />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          borderRadius: 22,
          backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.30), rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.40)), url(/voorbeeld/home-heide.webp)",
          backgroundSize: "cover",
          backgroundPosition: "50% 60%",
        }}
      >
        <HomeOntwerp
          ontwerp={ONTWERP}
          sc={sc}
          tekst={{ kop: "Wij gaan trouwen", namen, datum: formatDate(datum), locatie: null }}
          vasteBreedte={156}
          opFoto
        />
      </div>
    </div>
  )
}

/** Een stukje van de gastenlijst in het dashboard */
function Gastenlijst({ namen, datumTekst }: { namen: string; datumTekst: string }) {
  const regels: [string, string, string][] = [
    ["Oma Riet", "komt, 2 personen", "#2F7D4F"],
    ["Lotte en Bram", "komen, vegetarisch", "#2F7D4F"],
    ["Jasper", "nog geen antwoord", "#B98A2E"],
  ]
  return (
    <div className="rounded-2xl px-4 py-3.5" style={{ width: 236, backgroundColor: "#fff", border: `1px solid ${GOUD}40`, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
      <p className="m-0 text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.14em", color: GOUD }}>Gastenlijst</p>
      <p className="m-0 mt-0.5 text-[13px] font-semibold truncate" style={{ color: INKT }}>{namen}</p>
      <p className="m-0 text-[10px]" style={{ color: TEKST }}>{datumTekst}</p>
      <div className="flex gap-3 mt-2.5 text-[11px] tabular-nums" style={{ color: TEKST }}>
        <span><b style={{ color: "#2F7D4F" }}>24</b> komen</span>
        <span><b style={{ color: INKT }}>3</b> niet</span>
        <span><b style={{ color: "#B98A2E" }}>9</b> nog stil</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: "#F1ECE3" }}>
        <span style={{ width: "67%", backgroundColor: "#2F7D4F" }} />
        <span style={{ width: "8%", backgroundColor: "#C9BBA6" }} />
      </div>
      <ul className="m-0 p-0 list-none mt-2.5 flex flex-col gap-1.5">
        {regels.map(([wie, wat, kleur]) => (
          <li key={wie} className="flex items-center gap-2 text-[11px]" style={{ color: TEKST }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: kleur }} />
            <span className="font-semibold" style={{ color: INKT }}>{wie}</span>
            <span className="truncate">{wat}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
