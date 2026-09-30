// De voorkant van de nieuwe kaartontwerpen (25 september 2026), voor de
// browser én voor de afbeelding. Zie docs/PLAN-kaartontwerpen.md.
//
// Eén stuk code voor twee plekken, zodat de download precies lijkt op wat de
// gast ziet. Daarom alleen wat satori (next/og) kan tekenen:
// - inline styles, geen Tailwind-klassen
// - elke div met meer dan één kind is een flexbox
// - geen clip-path, geen filters, geen white-space: pre-line (een enter in de
//   tekst wordt een eigen regel, zie Regels)
// - maten in pixels, geschaald met de breedte: ontworpen op 400 pixels breed
//
// De drie oudere ontwerpen (Strak, Sierlijk, Bohemian) staan hier bewust niet
// in: die hebben hun eigen code en blijven precies zoals ze waren.

import { cloneElement, isValidElement, type CSSProperties, type ReactNode } from "react"
import type { CardDisplay, NieuwOntwerp } from "@/lib/cards"
import type { SC } from "@/lib/event-styles"
import { detailsKeuze, detailsOpKaart, illustratie, KADERS, ONTWERP_LETTERS, VERBINDER, type Verbinder, type VoorkantLetters } from "@/lib/kaart-ontwerpen"
import { splitsNamen } from "@/lib/namen"
import { namenOpmaak, namenPlek, type NamenPlek } from "@/lib/namen-opmaak"
import { tekstBreedte, type GemetenLetter } from "@/lib/letterbreedtes"
import { initialenLijst } from "@/lib/initialen"
import { leesbaar } from "@/lib/contrast"

/** Een flexbox, want satori wil dat bij elke div met meer dan één kind. */
function D({ style, children }: { style?: CSSProperties; children?: ReactNode }) {
  return <div style={{ display: "flex", ...style }}>{children}</div>
}

/** Tekst met enters erin: elke regel een eigen blok. */
function Regels({
  tekst,
  style,
  uitlijnen = "center",
  heel = false,
}: {
  tekst: string
  style?: CSSProperties
  uitlijnen?: "center" | "flex-start"
  /** Elke regel blijft heel; alleen als vaststaat dat hij past */
  heel?: boolean
}) {
  const regels = tekst.split(/\r?\n/).map((r) => r.trim())
  return (
    <D style={{ flexDirection: "column", alignItems: uitlijnen, ...style }}>
      {regels.map((r, i) =>
        r ? (
          <div key={i} style={{ display: "flex", textAlign: uitlijnen === "center" ? "center" : "left", justifyContent: uitlijnen, ...(heel ? { whiteSpace: "nowrap" } : {}) }}>
            {r}
          </div>
        ) : (
          <div key={i} style={{ display: "flex", height: "0.7em" }} />
        )
      )}
    </D>
  )
}



// ── Tekeningen voor de themaontwerpen (27 september 2026) ──────────────────
// Lijnen en vormen in de kleur van de stijl, zodat elk thema bij elke
// kleurstijl past. Geen tekst in SVG, want die tekent satori niet.

const rond = (n: number) => Math.round(n * 100) / 100

/** Een sneeuwkristal: zes armen met elk twee paar zijtakjes */
function Sneeuwvlok({ maat, kleur, dikte = 0.9 }: { maat: number; kleur: string; dikte?: number }) {
  let pad = ""
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3
    const c = Math.cos(a)
    const s = Math.sin(a)
    pad += `M0 0L${rond(9 * c)} ${rond(9 * s)}`
    for (const [r, l] of [[5, 3], [7.6, 1.8]] as const) {
      const px0 = r * c
      const py0 = r * s
      for (const draai of [Math.PI / 4, -Math.PI / 4]) {
        pad += `M${rond(px0)} ${rond(py0)}L${rond(px0 + l * Math.cos(a + draai))} ${rond(py0 + l * Math.sin(a + draai))}`
      }
    }
  }
  return (
    <svg width={maat} height={maat} viewBox="-10 -10 20 20" fill="none">
      <path d={pad} stroke={kleur} strokeWidth={dikte} strokeLinecap="round" />
      <circle cx="0" cy="0" r="1.1" fill={kleur} />
    </svg>
  )
}

/** Een opkomende zon boven de horizon */
function Zonsopgang({ breedte, kleur }: { breedte: number; kleur: string }) {
  let stralen = ""
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i * Math.PI) / 12
    stralen += `M${rond(100 + 44 * Math.cos(a))} ${rond(80 + 44 * Math.sin(a))}L${rond(100 + (i % 2 ? 56 : 62) * Math.cos(a))} ${rond(80 + (i % 2 ? 56 : 62) * Math.sin(a))}`
  }
  return (
    <svg width={breedte} height={rond((breedte * 86) / 200)} viewBox="0 0 200 86" fill="none">
      <path d={stralen} stroke={kleur} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M64 80A36 36 0 0 1 136 80Z" fill={kleur} />
      <path d="M16 80H184" stroke={kleur} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M44 85H78M122 85H156" stroke={kleur} strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  )
}

/** Een klokje in een fijne lijn, voor bij de tijden */
function Klokje({ maat, kleur }: { maat: number; kleur: string }) {
  return (
    <svg width={maat} height={maat} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke={kleur} strokeWidth="1.4" />
      <path d="M12 7.5V12l3 2" stroke={kleur} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Een kleerhanger in een fijne lijn, voor bij de dresscode */
function Kleerhanger({ maat, kleur }: { maat: number; kleur: string }) {
  return (
    <svg width={maat} height={maat} viewBox="0 0 24 24" fill="none">
      <path d="M10.2 7.2a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.7-.8 1.2v.9M3.5 18.5L12 11.5l8.5 7H3.5z" stroke={kleur} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const HART = "M50 86C22 66 4 48 4 28 4 14 15 4 28 4c10 0 18 6 22 14 4-8 12-14 22-14 13 0 24 10 24 24 0 20-18 38-46 58z"

/** Een hart uit een fijne lijn, of gevuld voor de kleine hartjes */
function Hart({ breedte, kleur, vol = false, dikte = 1.4 }: { breedte: number; kleur: string; vol?: boolean; dikte?: number }) {
  return (
    <svg width={breedte} height={rond((breedte * 90) / 100)} viewBox="0 0 100 90" fill="none">
      <path d={HART} {...(vol ? { fill: kleur } : { stroke: kleur, strokeWidth: dikte, strokeLinejoin: "round" as const })} />
    </svg>
  )
}

/** Eén fijne lijn die van links komt, in het midden een hart vormt en rechts verder gaat */
function Hartlijn({ breedte, kleur }: { breedte: number; kleur: string }) {
  return (
    <svg width={breedte} height={rond((breedte * 110) / 400)} viewBox="0 0 400 110" fill="none">
      <path
        d="M0 90C90 92 150 98 200 96C182 84 160 68 163 50C166 32 190 26 200 44C210 26 234 32 237 50C240 68 218 84 200 96C250 98 310 92 400 90"
        stroke={kleur}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Twee dunne harten die elkaar overlappen, als twee ringen */
function TweeHarten({ breedte, kleur }: { breedte: number; kleur: string }) {
  return (
    <svg width={breedte} height={rond((breedte * 100) / 160)} viewBox="0 0 160 100" fill="none">
      <g transform="translate(14 6) rotate(-9 50 45)">
        <path d={HART} stroke={kleur} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g transform="translate(46 8) rotate(9 50 45)">
        <path d={HART} stroke={kleur} strokeWidth="1.5" strokeLinejoin="round" strokeOpacity="0.6" />
      </g>
    </svg>
  )
}

/**
 * Een hart als met krijt of een stift getekend: twee lange halen die elkaar
 * onderaan kruisen (Michiel, 27 september 2026, naar een voorbeeld)
 */
function KrijtHart({ breedte, kleur }: { breedte: number; kleur: string }) {
  const links = "M71 146C55 127 30 95 13 62C3 42 5 17 20 12C34 8 44 29 50 51"
  const rechts = "M50 51C58 30 73 7 89 5C99 4 99 22 94 36C84 64 64 104 44 146"
  return (
    <svg width={breedte} height={rond((breedte * 150) / 100)} viewBox="0 0 100 150" fill="none">
      <path d={links} stroke={kleur} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={rechts} stroke={kleur} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Een droge rand, zoals krijt op papier */}
      <path d={links} stroke={kleur} strokeWidth="7" strokeLinecap="round" strokeDasharray="1.2 5" strokeOpacity="0.35" />
      <path d={rechts} stroke={kleur} strokeWidth="7" strokeLinecap="round" strokeDasharray="1.2 6" strokeOpacity="0.35" />
    </svg>
  )
}

/** Een open hart als een penseelstreek: dik en dun, met een lange uithaal */
function KalligrafieHart({ breedte, kleur }: { breedte: number; kleur: string }) {
  return (
    <svg width={breedte} height={rond((breedte * 110) / 100)} viewBox="0 0 100 110" fill="none">
      <path
        d="M40 79C21 71 3 53 5 34C7 17 22 11 33 17C41 21 46 32 47.5 44L46.5 45C44 34 38 26 31 24C22 22 13.5 28 13.5 39C13.5 55 27 68 40 79Z"
        fill={kleur}
      />
      <path
        d="M47.5 44C52 26 66 9 80 9C95 9 101 24 95 41C89 59 73 80 60 102L58.5 101.5C68 80 80 60 84.5 42C88 28 84 18 76 18C64 18 54 30 48.5 45.5Z"
        fill={kleur}
      />
    </svg>
  )
}

/** Een zacht gevuld hart met een losse, verschoven lijn eroverheen */
function SchaduwHart({ breedte, kleur, lijnKleur }: { breedte: number; kleur: string; lijnKleur: string }) {
  return (
    <svg width={breedte} height={breedte} viewBox="0 0 100 100" fill="none">
      <path d="M54 94C32 75 16 58 16 37C16 22 27 14 38 17C46 19 51 28 53 36C57 24 67 16 79 18C92 20 96 35 90 49C82 67 67 82 54 94Z" fill={kleur} fillOpacity="0.4" />
      <path
        d="M45 91C27 69 9 47 11 24C12 10 24 4 34 8C42 11 46 25 48 33C54 21 66 14 80 16C93 18 97 32 89 46C79 64 60 79 45 91Z"
        stroke={lijnKleur}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Een kader met golvende randen, als met de hand getrokken: rond een
 * afgeronde rechthoek, de golven loodrecht op de rand. In de maten van een
 * kaart van 400 breed. golf: de lengte van één golf; hoogte: hoe ver hij
 * uitslaat; grillig: hoeveel die uitslag varieert (Michiel, 27 september 2026)
 */
function golfKader(b: number, h: number, o: { inzet: number; hoek: number; golf: number; hoogte: number; grillig?: number }): string {
  const x0 = o.inzet
  const y0 = o.inzet
  const x1 = b - o.inzet
  const y1 = h - o.inzet
  const r = Math.max(1, o.hoek)
  const w = x1 - x0 - 2 * r
  const hh = y1 - y0 - 2 * r
  const boog = (Math.PI / 2) * r
  const omtrek = 2 * w + 2 * hh + 4 * boog
  const golven = Math.max(1, Math.round(omtrek / o.golf))
  // Een punt op de rand en de richting naar buiten, rechtsom vanaf linksboven
  const hoekPunt = (cx: number, cy: number, a: number): [number, number, number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)]
  const punt = (s: number): [number, number, number, number] => {
    let rest = s
    if (rest < w) return [x0 + r + rest, y0, 0, -1]
    rest -= w
    if (rest < boog) return hoekPunt(x1 - r, y0 + r, -Math.PI / 2 + rest / r)
    rest -= boog
    if (rest < hh) return [x1, y0 + r + rest, 1, 0]
    rest -= hh
    if (rest < boog) return hoekPunt(x1 - r, y1 - r, rest / r)
    rest -= boog
    if (rest < w) return [x1 - r - rest, y1, 0, 1]
    rest -= w
    if (rest < boog) return hoekPunt(x0 + r, y1 - r, Math.PI / 2 + rest / r)
    rest -= boog
    if (rest < hh) return [x0, y1 - r - rest, -1, 0]
    rest -= hh
    return hoekPunt(x0 + r, y0 + r, Math.PI + Math.min(rest, boog) / r)
  }
  const stappen = Math.round(omtrek / 2.5)
  let pad = ""
  for (let i = 0; i < stappen; i++) {
    const s = (i / stappen) * omtrek
    const [x, y, nx, ny] = punt(s)
    const fase = (2 * Math.PI * golven * s) / omtrek
    const uit = o.hoogte * (1 + (o.grillig ?? 0) * Math.sin(fase * 0.37 + 1)) * Math.sin(fase)
    pad += `${i ? "L" : "M"}${rond(x + nx * uit)} ${rond(y + ny * uit)}`
  }
  return pad + "Z"
}

/** Twee champagneglazen die tegen elkaar tikken, met een paar sprankjes */
function Glazen({ breedte, kleur }: { breedte: number; kleur: string }) {
  // Een groep en geen fragment: satori tekent svg zelf, en daar hoort alles in een element
  const glas = (
    <g>
      <path d="M-11 0C-12 26 -7 50 0 58C7 50 12 26 11 0Z" />
      <path d="M-10.5 11H10.5" strokeOpacity="0.7" />
      <path d="M0 58V98M-13 100C-6 96 6 96 13 100C6 103 -6 103 -13 100Z" />
      {[[-3, 22], [3, 30], [-1, 39], [2, 17], [-2, 47]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.1" fill={kleur} stroke="none" />
      ))}
    </g>
  )
  return (
    <svg width={breedte} height={rond((breedte * 132) / 112)} viewBox="44 12 112 132" fill="none" stroke={kleur} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(89 40) rotate(14)">{glas}</g>
      <g transform="translate(111 40) rotate(-14)">{glas}</g>
      <path d="M100 31V20M92 33L86 25M108 33L114 25" />
    </svg>
  )
}

/** Een strik van een lint, met twee lussen en twee slierten */
function Strikje({ breedte, kleur, achtergrond }: { breedte: number; kleur: string; achtergrond: string }) {
  return (
    <svg width={breedte} height={rond((breedte * 70) / 120)} viewBox="0 0 120 70" fill="none" stroke={kleur} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {/* Het kader loopt niet door de strik heen */}
      <rect x="24" y="14" width="72" height="16" fill={achtergrond} stroke="none" />
      <path d="M60 22C50 8 31 2 27 12C23 22 44 27 60 22" />
      <path d="M60 22C70 8 89 2 93 12C97 22 76 27 60 22" />
      {/* Twee slierten die rustig uitlopen. Eerst met een haakje aan het eind,
          en dat boog onnatuurlijk af (Michiel, 28 september 2026). */}
      <path d="M57 24C53 34 51 42 47 50S39 59 36 65" />
      <path d="M63 24C67 34 69 42 73 50S81 59 84 65" />
      <ellipse cx="60" cy="22.5" rx="4.2" ry="3.6" fill={achtergrond} />
    </svg>
  )
}

/**
 * Twee harten naast elkaar: een in pak met strikje, een als trouwjurk. De jurk
 * was eerst alleen krulletjes van kant, en dat herkende je niet (Michiel,
 * 28 september 2026). Nu een witte jurk met een hartvormige halslijn en een
 * wijde rok, in een zacht gekleurd hart.
 */
function PakEnJurk({ breedte, kop, accent, achtergrond }: { breedte: number; kop: string; accent: string; achtergrond: string }) {
  return (
    <svg width={breedte} height={rond((breedte * 104) / 206)} viewBox="0 0 206 104" fill="none">
      <g transform="translate(6 8) rotate(-7 50 45)">
        <path d={HART} fill={kop} />
        {/* Het overhemd, van de inkeping bovenin naar beneden */}
        <path d="M36 16C42 15 46 17 50 19C54 17 58 15 64 16L50 66Z" fill={achtergrond} />
        <path d="M50 27L41 22V32ZM50 27L59 22V32Z" fill={kop} />
        <circle cx="50" cy="27" r="2.4" fill={kop} />
        {[38, 45, 52].map((y) => (
          <circle key={y} cx="50" cy={y} r="1.6" fill={kop} />
        ))}
      </g>
      <g transform="translate(98 10) rotate(7 50 45)">
        <path d={HART} fill={achtergrond} />
        <path d={HART} fill={accent} fillOpacity="0.24" stroke={kop} strokeWidth="1.6" strokeLinejoin="round" />
        {/* De jurk: altijd wit, ook op een donkere kaart */}
        <path d="M39 25C42 21 47 21 50 25C53 21 58 21 61 25L57 40C61 49 64 60 65 70C56 73.5 44 73.5 35 70C36 60 39 49 43 40Z" fill="#FFFFFF" stroke={kop} strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M47 43C46 52 44 62 42 71M53 43C54 52 56 62 58 71M50 43V72" stroke={kop} strokeWidth="0.6" strokeOpacity="0.45" strokeLinecap="round" />
        <path d="M42.6 38.5H57.4L57.9 42.3H42.1Z" fill={accent} />
        {[[38, 69.6], [43, 70.8], [48, 71.3], [53, 71.3], [58, 70.8], [62, 69.8]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="0.9" fill={accent} />
        ))}
      </g>
    </svg>
  )
}

/** Boho: bogen als een regenboog met een zonnetje erin */
function Regenboog({ breedte, kleur }: { breedte: number; kleur: string }) {
  let stralen = ""
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + ((i + 0.5) * Math.PI) / 9
    stralen += `M${rond(100 + 19 * Math.cos(a))} ${rond(100 + 19 * Math.sin(a))}L${rond(100 + 26 * Math.cos(a))} ${rond(100 + 26 * Math.sin(a))}`
  }
  return (
    <svg width={breedte} height={rond((breedte * 104) / 200)} viewBox="0 0 200 104" fill="none">
      <path d="M10 100A90 90 0 0 1 190 100" stroke={kleur} strokeWidth="7" strokeOpacity="0.9" />
      <path d="M28 100A72 72 0 0 1 172 100" stroke={kleur} strokeWidth="7" strokeOpacity="0.55" />
      <path d="M46 100A54 54 0 0 1 154 100" stroke={kleur} strokeWidth="7" strokeOpacity="0.3" />
      <path d="M86 100A14 14 0 0 1 114 100Z" fill={kleur} />
      <path d={stralen} stroke={kleur} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

/** De themaontwerpen: allemaal dezelfde opbouw, met een eigen tekening */
const THEMA_ONTWERPEN: NieuwOntwerp[] = [
  "winter", "zomer", "liefde", "boho", "hartlijn", "tweeharten", "hartamp", "hartkader", "krijthart", "kalligrafie", "schaduwhart",
  "krijtgroot", "hartrand", "harthoek", "pakjurk", "proost", "strik",
]

/** De teksten op een ontwerp die op de homepagina een eigen letter en grootte kunnen krijgen */
export type TekstRol = "kop" | "namen" | "datum" | "locatie" | "tijden" | "dresscode"
export type EigenTekst = Partial<Record<TekstRol, { font?: string; schaal?: number }>>

/** De namen, passend gemaakt voor de ruimte die het ontwerp ervoor heeft. */
/** Wat er tussen de namen komt, en in welke letter en kleur (lib/kaart-ontwerpen.ts) */
interface VerbinderStijl {
  soort: Verbinder
  /** De sierletter voor de sierlijke & */
  letter: string
  kleur: string
}

function Namen({
  namen,
  plek,
  style,
  uitlijnen,
  vrijeSchaal,
  max,
  vb,
  onderElkaar = false,
}: {
  namen: string
  plek: NamenPlek
  style: CSSProperties
  uitlijnen?: "center" | "flex-start"
  vrijeSchaal?: number
  max?: number
  vb?: VerbinderStijl
  /** Altijd elke naam op een eigen regel */
  onderElkaar?: boolean
}) {
  const delen = splitsNamen(namen)
  // De twee namen los: dan tekent het ontwerp zelf wat ertussen komt. Gemeten
  // als "naam & naam", dus passend maken werkt zoals altijd.
  const tekst = delen ? `${delen[0]} & ${delen[1]}` : namen
  const o = namenOpmaak(tekst, plek, { vrijeSchaal, max })
  const soort = vb?.soort ?? "amp"
  if (!delen || (soort === "amp" && !onderElkaar)) {
    return <Regels tekst={o.tekst} heel={o.heel} uitlijnen={uitlijnen} style={{ ...style, fontSize: o.grootte }} />
  }
  const g = o.grootte
  const verbinder =
    soort === "hart" && vb ? (
      // Bij kleine namen (in hoofdletters onderaan een kaart) iets groter,
      // anders is het hartje een stipje
      <Hart breedte={g < 24 ? g * 0.62 : g * 0.4} kleur={vb.kleur} vol />
    ) : soort === "sierAmp" && vb ? (
      // De & in Great Vibes loopt rechts ver door: daar wat extra ruimte
      <div style={{ display: "flex", fontFamily: vb.letter, fontSize: g * 1.05, lineHeight: 1, color: vb.kleur, textTransform: "none", letterSpacing: 0, marginRight: g * 0.1 }}>&amp;</div>
    ) : (
      <div style={{ display: "flex" }}>&amp;</div>
    )
  const naam = (n: string) => <div style={{ display: "flex", whiteSpace: "nowrap" }}>{n}</div>
  const kant = uitlijnen ?? "center"
  // Een hartje heeft meer lucht nodig dan een &, zeker bij kleine namen
  const tussen = soort === "hart" ? (g < 24 ? g * 0.5 : g * 0.32) : g * 0.22
  if (!onderElkaar && !o.tekst.includes("\n")) {
    return (
      <D style={{ ...style, fontSize: g, alignItems: "center", justifyContent: kant, gap: tussen }}>
        {naam(delen[0])}
        {verbinder}
        {naam(delen[1])}
      </D>
    )
  }
  // Op twee regels: de tweede naam met de verbinder ervoor, zoals de breuk
  // die namenOpmaak ook maakt
  return (
    <D style={{ ...style, fontSize: g, flexDirection: "column", alignItems: kant }}>
      {naam(delen[0])}
      <D style={{ alignItems: "center", gap: tussen }}>
        {verbinder}
        {naam(delen[1])}
      </D>
    </D>
  )
}

/** "M | L", voor in de boog als er geen foto is (Michiel: een streep, geen &). */
function initialenVan(namen: string): string {
  return initialenLijst(namen).join(" | ") || "♥"
}

/** 2027-08-15 wordt ["15", "08", "27"] */
function datumCijfers(iso: string | null | undefined): string[] | null {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? [m[3], m[2], m[1].slice(2)] : null
}

/** 2027-08-15 wordt "15.08.2027", of met een ander teken ertussen. */
function datumKort(iso: string | null | undefined, teken: string): string | null {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? [m[3], m[2], m[1]].join(teken) : null
}

/**
 * De twee namen los, zodat het woord ertussen een andere letter kan krijgen:
 * "Eline", "and", "Manuel". Lukt dat niet (één naam, of iets heel anders),
 * dan null en staan de namen er gewoon zoals ze getypt zijn.
 */
function naamDelen(namen: string): [string, string] | null {
  return splitsNamen(namen)
}

/**
 * Tekst langs een boog of ovaal, letter voor letter. Geen SVG-tekst, want
 * die tekent satori niet; losse, gedraaide letters wel.
 */
function boogLetters({
  tekst,
  cx,
  cy,
  rx,
  ry,
  graden,
  onder = false,
  grootte,
  spatie = 0.12,
  stijl,
}: {
  tekst: string
  cx: number
  cy: number
  rx: number
  ry: number
  /** Hoeveel graden van de boog er ruimte is; de tekst staat in het midden */
  graden: number
  /** Onderaan de boog, dan leest hij nog steeds van links naar rechts */
  onder?: boolean
  grootte: number
  /** Extra ruimte tussen de letters, als deel van de lettergrootte */
  spatie?: number
  stijl: CSSProperties
}) {
  // De boog in kleine stukjes, met de afstand langs de boog tot elk punt. Op
  // een ovaal is de boog aan de uiteinden steiler; gelijke hoeken gaven daar
  // te veel ruimte tussen de letters.
  const midden = onder ? 90 : -90
  const van = onder ? midden + graden / 2 : midden - graden / 2
  const tot = onder ? midden - graden / 2 : midden + graden / 2
  const STAPPEN = 240
  const punten: { hoek: number; afstand: number }[] = []
  let afstand = 0
  for (let i = 0; i <= STAPPEN; i++) {
    const h = ((van + ((tot - van) * i) / STAPPEN) * Math.PI) / 180
    if (i > 0) {
      const v = punten[i - 1].hoek
      afstand += Math.hypot(rx * (Math.cos(h) - Math.cos(v)), ry * (Math.sin(h) - Math.sin(v)))
    }
    punten.push({ hoek: h, afstand })
  }
  const lengte = afstand
  // Hoe breed een letter ongeveer is: smalle tekens smal, een spatie iets breder
  const breedteVan = (ch: string) =>
    grootte * (/[\s]/.test(ch) ? 0.34 : /[iIl1!|.,:;'’]/.test(ch) ? 0.3 : /[tfrjJ]/.test(ch) ? 0.38 : /[mwMW]/.test(ch) ? 0.82 : /[A-Z]/.test(ch) ? 0.64 : 0.5) + grootte * spatie
  const letters = [...tekst]
  const breedtes = letters.map(breedteVan)
  const totaal = breedtes.reduce((a, b) => a + b, 0)
  // Past het niet, dan krimpt de ruimte; anders staat de tekst in het midden
  const schaal = totaal > lengte ? lengte / totaal : 1
  let plek = (lengte - totaal * schaal) / 2
  const vak = grootte * 1.3
  return letters.map((ch, i) => {
    const doel = plek + (breedtes[i] * schaal) / 2
    plek += breedtes[i] * schaal
    let j = 1
    while (j < punten.length - 1 && punten[j].afstand < doel) j++
    const a = punten[j - 1]
    const b = punten[j]
    const f = b.afstand > a.afstand ? (doel - a.afstand) / (b.afstand - a.afstand) : 0
    const r = a.hoek + (b.hoek - a.hoek) * f
    const x = cx + rx * Math.cos(r)
    const y = cy + ry * Math.sin(r)
    let hoek = (Math.atan2(ry * Math.cos(r), -rx * Math.sin(r)) * 180) / Math.PI
    if (onder) hoek += 180
    return (
      <div
        key={i}
        style={{
          display: "flex",
          position: "absolute",
          left: Math.round((x - vak / 2) * 10) / 10,
          top: Math.round((y - vak / 2) * 10) / 10,
          width: vak,
          height: vak,
          alignItems: "center",
          justifyContent: "center",
          fontSize: grootte,
          transform: `rotate(${Math.round(hoek * 10) / 10}deg)`,
          ...stijl,
        }}
      >
        {ch === " " ? " " : ch}
      </div>
    )
  })
}

// De kroon van de palm: gebogen bladeren die omhoog en naar buiten gaan en
// aan het eind doorhangen, links en rechts gespiegeld. Eerst waren het rechte
// wiggen en was het bovenste blad een smal reepje (Michiel, 25 september 2026).
const PALM_BLADEREN = [
  "M52 60 C 66 42, 88 44, 98 76 C 88 57, 70 54, 52 62 Z",
  "M52 60 C 60 32, 84 28, 93 50 C 80 39, 64 44, 52 62 Z",
  "M52 60 C 50 38, 58 20, 73 19 C 64 28, 56 44, 53 61 Z",
  "M52 61 C 64 64, 76 76, 80 98 C 70 81, 62 70, 52 64 Z",
  "M52 60 C 38 42, 16 44, 6 76 C 16 57, 34 54, 52 62 Z",
  "M52 60 C 44 32, 20 28, 11 50 C 24 39, 40 44, 52 62 Z",
  "M52 60 C 54 38, 46 20, 31 19 C 40 28, 48 44, 51 61 Z",
  "M52 61 C 40 64, 28 76, 24 98 C 34 81, 42 70, 52 64 Z",
]

/** Een palm in lijnstijl: een gebogen stam en een kroon van gebogen bladeren. */
function Palm({ breedte, kleur }: { breedte: number; kleur: string }) {
  return (
    <svg width={breedte} height={breedte * 1.7} viewBox="0 0 104 170" fill="none">
      <path d="M52 170 C 55 130, 48 100, 52 62" stroke={kleur} strokeWidth="3" strokeLinecap="round" />
      <g fill={kleur}>
        {PALM_BLADEREN.map((d, i) => (
          <path key={i} d={d} opacity={i % 4 === 3 ? 0.85 : 1} />
        ))}
      </g>
    </svg>
  )
}

/** Drie golfjes */
function Golven({ breedte, kleur }: { breedte: number; kleur: string }) {
  return (
    <svg width={breedte} height={breedte * 0.3} viewBox="0 0 120 36" fill="none" stroke={kleur} strokeWidth="1.6" strokeLinecap="round">
      <path d="M14 8 q 10 -6 20 0 t 20 0" />
      <path d="M40 20 q 10 -6 20 0 t 20 0 t 20 0" />
      <path d="M22 32 q 10 -6 20 0 t 20 0" />
    </svg>
  )
}

// Art deco: een getrapte hoek. Punten voor linksboven in een vak van 40 bij
// 40; de andere hoeken zijn gespiegeld, zonder transform (satori).
const DECO_HOEK: [number, number][][] = [
  [[0, 15], [5, 15], [5, 5], [15, 5], [15, 0]],
  [[0, 25], [11, 25], [11, 11], [25, 11], [25, 0]],
]
function decoHoek(spiegelX: boolean, spiegelY: boolean): string {
  return DECO_HOEK.map((lijn) =>
    lijn
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${spiegelX ? 40 - x : x} ${spiegelY ? 40 - y : y}`)
      .join(" ")
  ).join(" ")
}

// Art deco: een waaier van stralen boven de namen
function decoWaaier(): string {
  const cx = 60
  const cy = 58
  const stralen: string[] = []
  for (let hoek = 180; hoek <= 360; hoek += 15) {
    const r = (hoek * Math.PI) / 180
    const x1 = cx + Math.cos(r) * 16
    const y1 = cy + Math.sin(r) * 16
    const x2 = cx + Math.cos(r) * 54
    const y2 = cy + Math.sin(r) * 54
    stralen.push(`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`)
  }
  return stralen.join(" ")
}

function Inhoud({
  d,
  ontwerp,
  sc,
  breedte,
  letters: lettersIn,
  schaduw,
  voorAfbeelding = false,
  vrij = false,
  eigen,
  namenMeting,
  detailRollen,
}: {
  d: CardDisplay
  ontwerp: NieuwOntwerp
  sc: SC
  /** Hoe breed de kaart wordt, in pixels. Alles schaalt mee. */
  breedte: number
  letters: VoorkantLetters
  /**
   * Op de kaart zelf, niet op een doos eromheen: die doos is vierkant en dan
   * zie je in de afbeelding de hoeken naast de afronding.
   */
  schaduw?: string
  /** Getekend door satori: illustraties dan via de volledige link */
  voorAfbeelding?: boolean
  /** Op de homepagina: geen kaart, maar het ontwerp vrij op de pagina */
  vrij?: boolean
  /**
   * Per tekst een eigen letter (een font-family) en grootte (1 is zoals
   * ontworpen). Voor de homepagina; op een kaart is dit er niet.
   */
  eigen?: EigenTekst
  /** Welke regel van de details wat is, zodat elke regel zijn eigen letter krijgt */
  detailRollen?: ("tijden" | "dresscode")[]
  /** Een eigen letter voor de namen: om ze passend te maken met de juiste breedtes */
  namenMeting?: GemetenLetter | null
}) {
  const s = breedte / 400
  const px = (n: number) => Math.round(n * s * 10) / 10
  // Per soort tekst een eigen grootte, voor de homepagina. Op een kaart is
  // de schaal er niet en is dit gewoon px.
  const pxN = (n: number) => Math.round(n * s * (eigen?.namen?.schaal ?? 1) * 10) / 10
  // Kleine tekst (de kop, de locatie, de boodschap, de details) groter dan
  // ontworpen: op de telefoon was die lastig te lezen (Michiel, 27 september
  // 2026). Grote tekst blijft zoals hij is.
  const klein = (n: number) => (n >= 16 ? n : Math.min(16, n * 1.22))
  const pxK = (n: number) => px(klein(n))
  // Een eigen letter voor de namen geldt overal waar de namen staan
  const letters: VoorkantLetters = { ...lettersIn, namen: eigen?.namen?.font ?? lettersIn.namen }
  // Letter en grootte van één tekst: die van het ontwerp, of wat het
  // bruidspaar zelf koos (Michiel, 27 september 2026: per tekst apart)
  const tt = (rol: TekstRol, standaard: string, n: number): CSSProperties => ({
    fontFamily: eigen?.[rol]?.font ?? standaard,
    fontSize: Math.round((rol === "namen" ? n : klein(n)) * s * (eigen?.[rol]?.schaal ?? 1) * 10) / 10,
  })
  const hoogte = Math.round(breedte * 1.4)

  const achtergrond = vrij ? sc.bodyBg : sc.cardBg ?? "#FFFEFB"
  const kop = vrij ? sc.headingColor : sc.cardText ?? sc.headingColor
  const tekst = vrij ? sc.bodyText : sc.cardText ?? sc.bodyText

  const accent = sc.accent
  // Wat er tussen de namen komt, per ontwerp (Michiel, 28 september 2026)
  const vb: VerbinderStijl = { soort: VERBINDER[ontwerp] ?? "amp", letter: letters.extra ?? letters.namen, kleur: accent }
  // De kleine kop ("Save the Date") in de kleur van de stijl, tenzij die op
  // deze achtergrond wegvalt
  const label = leesbaar(sc.labelColor, achtergrond, [kop])
  const lijn = Math.max(1, Math.round(s))
  // Tijden, dresscode en voor wie, op de kaart zelf bij de ontwerpen die ze
  // anders eronder zetten (lib/kaart-ontwerpen.ts). De ontwerpen met een slot
  // hieronder hadden ze al op de kaart.
  // max: hoe breed het blok mag zijn, in de maten van een kaart van 400 breed.
  // Zonder liep een lange regel bij Olijf buiten het gouden kader.
  const details = (kleur: string, opties: { grootte?: number; font?: string; marge?: number; uitlijnen?: "center" | "flex-start"; max?: number } = {}) => {
    if (!detailsKeuze(ontwerp) || !detailsOpKaart(ontwerp, d.detailsStand)) return null
    if (!d.inviteLine && !d.timeText && !d.tijd && !d.dresscode) return null
    const uitlijnen = opties.uitlijnen ?? "center"
    const grootte = pxK(opties.grootte ?? 10.5)
    const font = opties.font ?? letters.tekst
    const max = px(opties.max ?? 300)
    return (
      <D style={{ flexDirection: "column", alignItems: uitlijnen, gap: px(3), marginTop: px(opties.marge ?? 6), maxWidth: max }}>
        {d.inviteLine && (
          <div style={{ display: "flex", fontFamily: font, fontSize: grootte, fontWeight: 600, lineHeight: 1.45, color: kleur, textAlign: uitlijnen === "center" ? "center" : "left", maxWidth: max }}>
            {d.inviteLine}
          </div>
        )}
        {/* Tijden en dresscode klein en rustig, maar altijd elk op een
            eigen regel (Michiel, 30 september 2026) */}
        {!detailRollen && tijdEnDresscode(kleur, tekst, font, opties.grootte ?? 10.5, uitlijnen, max, d.message ? px(8) : 0)}
        {/* Op de homepagina: elke regel zijn eigen letter en grootte */}
        {d.timeText && detailRollen &&
          d.timeText.split("\n").map((regel, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                ...tt(detailRollen[i] ?? "tijden", font, opties.grootte ?? 10.5),
                fontWeight: 600,
                lineHeight: 1.5,
                letterSpacing: "0.06em",
                color: kleur,
                maxWidth: max,
                textAlign: uitlijnen === "center" ? "center" : "left",
              }}
            >
              {regel}
            </div>
          ))}
      </D>
    )
  }

  // Tijden en dresscode in de gekozen weergave: kopjes naast elkaar, onder
  // elkaar, of onder een sierlijn, met of zonder lijnicoontjes (Michiel, 30
  // september 2026)
  // boven: extra lucht boven het blok, na de boodschap (Michiel, 30 september 2026)
  const tijdEnDresscode = (accentKleur: string, tekstKleur: string, font: string, grootte: number, uitlijnen: "center" | "flex-start", max: number, boven = 0) => {
    if (!d.tijd && !d.dresscode) return null
    const stijl = d.detailsStijl ?? "kopjes"
    const icoon = d.detailsIcoon === true
    const g = pxK(grootte)
    const ik = Math.round(g * 1.25)
    const klok = <Klokje maat={ik} kleur={accentKleur} />
    const hanger = <Kleerhanger maat={ik} kleur={accentKleur} />
    const midden = uitlijnen === "center"
    const waarde = (tekst: string, extra: CSSProperties = {}) => (
      <div style={{ display: "flex", fontFamily: font, fontSize: g * 1.2, lineHeight: 1.35, color: tekstKleur, textAlign: midden ? "center" : "left", ...extra }}>{tekst}</div>
    )
    if (stijl === "kopjes") {
      const kolom = (label: string, tekst: string, ic: ReactNode) => (
        <D style={{ flexDirection: "column", alignItems: midden ? "center" : "flex-start", gap: px(2), maxWidth: d.tijd && d.dresscode ? max / 2 - px(10) : max }}>
          <D style={{ alignItems: "center", gap: px(4) }}>
            {icoon && ic}
            <div style={{ display: "flex", fontFamily: font, fontSize: g * 0.8, fontWeight: 600, letterSpacing: "0.26em", textTransform: "uppercase", color: accentKleur }}>{label}</div>
          </D>
          {waarde(tekst)}
        </D>
      )
      return (
        <D style={{ alignItems: "stretch", justifyContent: midden ? "center" : "flex-start", gap: px(10), maxWidth: max, marginTop: boven }}>
          {d.tijd && kolom(d.tijdLabel, d.tijd, klok)}
          {d.tijd && d.dresscode && <div style={{ display: "flex", width: lijn, backgroundColor: accentKleur, opacity: 0.45 }} />}
          {d.dresscode && kolom(d.dresscodeLabel, d.dresscode, hanger)}
        </D>
      )
    }
    if (stijl === "lijst") {
      const regel = (tekst: string, ic: ReactNode) => (
        <D style={{ alignItems: "center", gap: px(6) }}>
          {icoon && ic}
          {waarde(tekst)}
        </D>
      )
      return (
        <D style={{ flexDirection: "column", alignItems: midden ? "center" : "flex-start", gap: px(4), maxWidth: max, marginTop: boven }}>
          {d.tijd && regel(d.tijd, klok)}
          {d.dresscode && regel(icoon ? d.dresscode : `${d.dresscodeLabel}: ${d.dresscode}`, hanger)}
        </D>
      )
    }
    // Onder een sierlijn
    return (
      <D style={{ flexDirection: "column", alignItems: midden ? "center" : "flex-start", gap: px(3), maxWidth: max, marginTop: boven }}>
        <D style={{ alignItems: "center", gap: px(7), marginBottom: px(4) }}>
          <div style={{ display: "flex", width: px(40), height: lijn, backgroundColor: accentKleur }} />
          <div style={{ display: "flex", width: px(5), height: px(5), backgroundColor: accentKleur, transform: "rotate(45deg)" }} />
          <div style={{ display: "flex", width: px(40), height: lijn, backgroundColor: accentKleur }} />
        </D>
        {d.tijd && (
          <D style={{ alignItems: "center", gap: px(6) }}>
            {icoon && klok}
            {waarde(d.tijd)}
          </D>
        )}
        {d.dresscode && (
          <D style={{ alignItems: "center", gap: px(6) }}>
            {icoon && hanger}
            {waarde(icoon ? d.dresscode : `${d.dresscodeLabel.toLowerCase()}: ${d.dresscode}`, { fontSize: g * 1.05, opacity: 0.85 })}
          </D>
        )}
      </D>
    )
  }

  // Waar de namen staan en hoe groot, voor het passend maken. Palm heeft
  // geen vaste plek: die zet de namen onder elkaar, behalve bij één naam.
  const namenLetter = ONTWERP_LETTERS[ontwerp].namen
  const basisPlek: NamenPlek = namenPlek(ontwerp, { breedte, datumIso: d.datumIso }) ?? { letter: namenLetter, grootte: px(46), ruimte: px(340) }
  // Op de homepagina: eerst passend in het ontwerp, dan de grootte die het
  // bruidspaar koos, en nooit breder dan het ontwerp
  const namenVrij = vrij ? { vrijeSchaal: eigen?.namen?.schaal ?? 1, max: breedte * 0.92 } : {}
  const plek: NamenPlek = {
    ...basisPlek,
    ...(namenMeting ? { letter: namenMeting } : {}),
  }

  const basis: CSSProperties = {
    position: "relative",
    flexDirection: "column",
    width: breedte,
    minHeight: hoogte,
    overflow: "hidden",
    backgroundColor: achtergrond,
    ...(schaduw ? { boxShadow: schaduw } : {}),
  }

  // De onderkant van elke kaart: boodschap, uitnodiging en de details
  const slot = (kleur: { tekst: string; kop: string; accent: string }, uitlijnen: "center" | "flex-start" = "center", font = letters.tekst) => (
    <D style={{ flexDirection: "column", alignItems: uitlijnen, gap: px(10) }}>
      {d.message && (
        <Regels
          tekst={d.message}
          uitlijnen={uitlijnen}
          style={{ fontFamily: font, fontSize: pxK(12.5), lineHeight: 1.6, color: kleur.tekst, maxWidth: px(310) }}
        />
      )}
      {d.inviteLine && (
        <div style={{ display: "flex", fontFamily: font, fontSize: pxK(12.5), fontWeight: 600, lineHeight: 1.5, color: kleur.kop, maxWidth: px(310), textAlign: uitlijnen === "center" ? "center" : "left" }}>
          {d.inviteLine}
        </div>
      )}
      {tijdEnDresscode(kleur.accent, kleur.tekst, font, 10.5, uitlijnen, px(310), d.message ? px(6) : 0)}
    </D>
  )

  // ── Eigen ontwerp: de afbeelding is de kaart ──────────────────────────────
  if (ontwerp === "eigen") {
    const verhouding = d.ontwerpVerhouding && d.ontwerpVerhouding > 0 ? d.ontwerpVerhouding : 1.4
    const h = Math.round(breedte * verhouding)
    if (!d.ontwerpUrl) {
      // Nog niets geüpload: een lege plek, alleen in de bouwer te zien
      return (
        <D
          style={{
            ...basis,
            alignItems: "center",
            justifyContent: "center",
            gap: px(10),
            padding: px(40),
            borderRadius: px(10),
            border: `${Math.max(1, px(1.5))}px dashed ${accent}90`,
          }}
        >
          <svg width={px(44)} height={px(44)} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
          <div style={{ display: "flex", fontFamily: letters.tekst, fontSize: px(15), fontWeight: 600, color: kop, textAlign: "center" }}>
            Jullie eigen ontwerp
          </div>
          <div style={{ display: "flex", fontFamily: letters.tekst, fontSize: pxK(12), lineHeight: 1.5, color: tekst, textAlign: "center", maxWidth: px(260) }}>
            Upload een afbeelding van jullie kaart. Wij doen de envelop, het aanmelden en de rest.
          </div>
        </D>
      )
    }
    return (
      <D style={{ ...basis, minHeight: h, height: h, borderRadius: px(10) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={d.ontwerpUrl}
          // Wie de kaart niet kan zien, hoort in elk geval voor wie hij is
          alt={[d.heading, d.names, d.dateText].filter(Boolean).join(", ")}
          width={breedte}
          height={h}
          style={{ width: breedte, height: h, objectFit: "cover", borderRadius: px(10) }}
        />
      </D>
    )
  }

  // ── Minimaal: veel wit, grote letters, links uitgelijnd ───────────────────
  if (ontwerp === "minimaal") {
    return (
      <D
        style={{
          ...basis,
          justifyContent: "space-between",
          // Iets meer rand boven en onder, dan wordt de ruimte tussen de
          // blokken net wat kleiner (Michiel, 25 september 2026)
          padding: `${px(60)}px ${px(40)}px ${px(54)}px`,
          borderRadius: px(4),
        }}
      >
        <D style={{ flexDirection: "column", gap: px(12) }}>
          <div style={{ display: "flex", ...tt("kop", letters.kop, 14), letterSpacing: "0.3em", textTransform: "uppercase", color: label }}>
            {d.heading}
          </div>
          <div style={{ display: "flex", width: px(36), height: lijn, backgroundColor: accent }} />
        </D>

        <D style={{ flexDirection: "column", gap: px(18), marginTop: px(30), marginBottom: px(30) }}>
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} uitlijnen="flex-start" style={{ fontFamily: letters.namen, lineHeight: 1.04, color: kop }} />
          {d.dateText && (
            <div style={{ display: "flex", ...tt("datum", letters.kop, 12), letterSpacing: "0.22em", textTransform: "uppercase", color: kop }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} uitlijnen="flex-start" style={{ ...tt("locatie", letters.tekst, 12), lineHeight: 1.5, color: tekst, opacity: 0.8 }} />
          )}
        </D>

        {slot({ tekst, kop, accent }, "flex-start")}
      </D>
    )
  }

  // ── Foto: de foto vult de hele kaart, de tekst staat erop ─────────────────
  if (ontwerp === "fotovol") {
    const wit = "#FFFDF8"
    return (
      <D
        style={{
          ...basis,
          justifyContent: "flex-end",
          borderRadius: px(18),
          // Zonder foto een zachte kleurovergang, zodat hij niet leeg oogt
          backgroundColor: accent,
          ...(d.photoUrl ? {} : { backgroundImage: `linear-gradient(160deg, ${accent} 0%, ${kop} 100%)` }),
        }}
      >
        {d.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.photoUrl}
            alt=""
            width={breedte}
            height={hoogte}
            // De afronding op de foto zelf: satori knipt een afbeelding niet bij
            // met de afronding van de doos eromheen
            style={{ position: "absolute", top: 0, left: 0, width: breedte, height: "100%", minHeight: hoogte, objectFit: "cover", borderRadius: px(18) }}
          />
        )}
        {/* Een donkere laag onderaan, zodat de tekst leesbaar is op elke foto */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            width: breedte,
            height: "100%",
            borderRadius: px(18),
            backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.72) 100%)",
          }}
        />
        <D style={{ position: "relative", flexDirection: "column", alignItems: "center", gap: px(10), padding: `${px(40)}px ${px(32)}px ${px(36)}px`, color: wit }}>
          <div style={{ display: "flex", ...tt("kop", letters.kop, 10), letterSpacing: "0.34em", textTransform: "uppercase", color: wit, opacity: 0.9 }}>
            {d.heading}
          </div>
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.12, color: wit }} />
          <div style={{ display: "flex", width: px(38), height: lijn, backgroundColor: wit, opacity: 0.6, marginTop: px(2), marginBottom: px(2) }} />
          {d.dateText && (
            <div style={{ display: "flex", ...tt("datum", letters.kop, 12.5), letterSpacing: "0.24em", textTransform: "uppercase", color: wit }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 11.5), lineHeight: 1.5, color: wit, opacity: 0.88 }} />
          )}
          <D style={{ marginTop: px(6) }}>{slot({ tekst: "rgba(255,253,248,0.9)", kop: wit, accent: wit })}</D>
        </D>
      </D>
    )
  }

  // ── Boog: een boogvenster met de foto of de initialen ─────────────────────
  if (ontwerp === "boog") {
    const bw = px(206)
    const bh = px(218)
    return (
      <D
        style={{
          ...basis,
          alignItems: "center",
          padding: `${px(34)}px ${px(30)}px ${px(36)}px`,
          borderRadius: px(14),
          border: `${lijn}px solid ${accent}40`,
        }}
      >
        <D style={{ position: "relative", width: bw + px(16), height: bh + px(8), justifyContent: "center", marginBottom: px(20) }}>
          {/* Een dun lijntje om de boog heen, als een deuropening */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              width: bw + px(16),
              height: bh + px(8),
              borderTop: `${lijn}px solid ${accent}90`,
              borderLeft: `${lijn}px solid ${accent}90`,
              borderRight: `${lijn}px solid ${accent}90`,
              borderRadius: `${(bw + px(16)) / 2}px ${(bw + px(16)) / 2}px 0 0`,
            }}
          />
          <D
            style={{
              position: "absolute",
              top: px(8),
              left: px(8),
              width: bw,
              height: bh,
              overflow: "hidden",
              borderRadius: `${bw / 2}px ${bw / 2}px 0 0`,
              backgroundColor: `${accent}22`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {d.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.photoUrl} alt="" width={bw} height={bh} style={{ width: bw, height: bh, objectFit: "cover", borderRadius: `${bw / 2}px ${bw / 2}px 0 0` }} />
            ) : (
              <div style={{ display: "flex", fontFamily: letters.namen, fontSize: pxN(46), color: accent, marginTop: px(30), letterSpacing: "0.04em" }}>
                {initialenVan(d.names)}
              </div>
            )}
          </D>
        </D>

        <D style={{ flexDirection: "column", alignItems: "center", gap: px(10) }}>
          <div style={{ display: "flex", ...tt("kop", letters.kop, 11), letterSpacing: "0.3em", textTransform: "uppercase", color: label }}>
            {d.heading}
          </div>
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.18, color: kop }} />
          {d.dateText && (
            <div style={{ display: "flex", ...tt("datum", letters.kop, 15), letterSpacing: "0.14em", textTransform: "uppercase", color: accent }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 11.5), lineHeight: 1.5, color: tekst, opacity: 0.85 }} />
          )}
          <div style={{ display: "flex", width: px(34), height: lijn, backgroundColor: `${accent}70`, marginTop: px(4), marginBottom: px(4) }} />
          {slot({ tekst, kop, accent })}
        </D>
      </D>
    )
  }

  // ── Art deco: geometrisch goud ────────────────────────────────────────────
  if (ontwerp === "deco") {
    const rand = px(13)
    const hoek = px(40)
    const hoeken: { top?: number; bottom?: number; left?: number; right?: number; x: boolean; y: boolean }[] = [
      { top: rand + px(8), left: rand + px(8), x: false, y: false },
      { top: rand + px(8), right: rand + px(8), x: true, y: false },
      { bottom: rand + px(8), left: rand + px(8), x: false, y: true },
      { bottom: rand + px(8), right: rand + px(8), x: true, y: true },
    ]
    return (
      <D
        style={{
          ...basis,
          alignItems: "center",
          justifyContent: "center",
          padding: `${px(60)}px ${px(44)}px`,
          borderRadius: px(6),
        }}
      >
        {/* Twee randen, een stevige en een dunne */}
        <div style={{ display: "flex", position: "absolute", top: rand, left: rand, right: rand, bottom: rand, border: `${Math.max(1, px(1.5))}px solid ${accent}` }} />
        <div style={{ display: "flex", position: "absolute", top: rand + px(6), left: rand + px(6), right: rand + px(6), bottom: rand + px(6), border: `${lijn}px solid ${accent}80` }} />
        {hoeken.map((h, i) => (
          <svg
            key={i}
            width={hoek}
            height={hoek}
            viewBox="0 0 40 40"
            fill="none"
            // Alleen de randen die er zijn: satori struikelt over undefined
            style={{
              position: "absolute",
              ...(h.top !== undefined ? { top: h.top } : { bottom: h.bottom }),
              ...(h.left !== undefined ? { left: h.left } : { right: h.right }),
            }}
          >
            <path d={decoHoek(h.x, h.y)} stroke={accent} strokeWidth="1.3" />
            <path d={`M${h.x ? 36 : 4} ${h.y ? 32 : 8} L${h.x ? 32 : 8} ${h.y ? 36 : 4} L${h.x ? 28 : 12} ${h.y ? 32 : 8} L${h.x ? 32 : 8} ${h.y ? 28 : 12} Z`} fill={accent} />
          </svg>
        ))}

        <D style={{ flexDirection: "column", alignItems: "center", gap: px(12) }}>
          <svg width={px(120)} height={px(62)} viewBox="0 0 120 62" fill="none">
            <path d={decoWaaier()} stroke={accent} strokeWidth="1" />
            <path d="M44 58 A16 16 0 0 1 76 58" stroke={accent} strokeWidth="1.3" />
            <path d="M6 58 A54 54 0 0 1 114 58" stroke={accent} strokeWidth="1.3" />
            <path d="M0 58 L120 58" stroke={accent} strokeWidth="1.3" />
          </svg>
          <div style={{ display: "flex", ...tt("kop", letters.kop, 10.5), letterSpacing: "0.38em", textTransform: "uppercase", color: label }}>
            {d.heading}
          </div>
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.3, letterSpacing: "0.1em", textTransform: "uppercase", color: kop, marginTop: px(4), marginBottom: px(4) }} />
          <D style={{ alignItems: "center", gap: px(8), width: px(210) }}>
            <div style={{ display: "flex", flexGrow: 1, height: lijn, backgroundColor: accent }} />
            <div style={{ display: "flex", width: px(6), height: px(6), backgroundColor: accent, transform: "rotate(45deg)" }} />
            <div style={{ display: "flex", flexGrow: 1, height: lijn, backgroundColor: accent }} />
          </D>
          {d.dateText && (
            <div style={{ display: "flex", ...tt("datum", letters.kop, 12.5), letterSpacing: "0.26em", textTransform: "uppercase", color: accent, textAlign: "center" }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 10.5), lineHeight: 1.6, letterSpacing: "0.12em", textTransform: "uppercase", color: tekst, opacity: 0.85 }} />
          )}
          <D style={{ marginTop: px(8) }}>{slot({ tekst, kop, accent })}</D>
        </D>
      </D>
    )
  }

  // ── De themaontwerpen (27 september 2026) ────────────────────────────────
  // Winter, zomer, liefde en Ibiza boho, en vier met een hart. Voor de kaart
  // en de homepagina. De
  // tekeningen staan in de kleur van de stijl. Lente, strand en festival zijn
  // er de dag erna weer uit: te duidelijk gemaakt (Michiel, 27 september 2026).
  if (THEMA_ONTWERPEN.includes(ontwerp)) {
    const datum = datumKort(d.datumIso, " · ") ?? d.dateText
    const kopRegel = (grootte = 11, kleur = label) => (
      <div style={{ display: "flex", ...tt("kop", letters.kop, grootte), letterSpacing: "0.34em", textTransform: "uppercase", color: kleur, textAlign: "center" }}>
        {d.heading}
      </div>
    )
    const inhoud = (o: { naamRegel?: number; datumKleur?: string } = {}) => (
      <D style={kolom}>
        <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: o.naamRegel ?? 1.12, color: kop }} />
        {datum && (
          <div style={{ display: "flex", ...tt("datum", letters.kop, 12.5), letterSpacing: "0.24em", textTransform: "uppercase", color: o.datumKleur ?? accent }}>
            {datum}
          </div>
        )}
        {d.location && (
          <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 11.5), lineHeight: 1.5, letterSpacing: "0.06em", color: tekst, opacity: 0.88 }} />
        )}
        {d.message && (
          <Regels tekst={d.message} style={{ fontFamily: letters.tekst, fontSize: pxK(12), lineHeight: 1.55, color: tekst, maxWidth: px(290), marginTop: px(6), opacity: 0.9 }} />
        )}
        {details(accent, { grootte: 10.5, marge: 4, max: 300 })}
      </D>
    )
    // Een echte kolom en geen fragment: satori maakte van een fragment een
    // rij, en dan stond alles naast elkaar op de afbeelding
    const kolom: CSSProperties = { flexDirection: "column", alignItems: "center", gap: px(10), width: "100%" }
    // Versiering (losse tekeningen op de kaart) direct in de kaart zelf, niet
    // in de kolom met tekst: satori plaatst iets absoluuts ten opzichte van
    // zijn ouder, en dan stonden de takjes en vlaggetjes over de tekst
    const wortel = (padding: string, kinderen: ReactNode, versiering?: ReactNode) => (
      <D style={{ ...basis, alignItems: "center", justifyContent: "center", padding, borderRadius: px(14) }}>
        {versiering}
        {kinderen}
      </D>
    )
    const los = (stijl: CSSProperties, kind: ReactNode, key?: number) => (
      <div key={key} style={{ display: "flex", position: "absolute", ...stijl }}>{kind}</div>
    )

    if (ontwerp === "winter") {
      const vlokken = [
        { x: 0.06, y: 0.05, m: 36, o: 0.5 },
        { x: 0.8, y: 0.04, m: 22, o: 0.38 },
        { x: 0.87, y: 0.3, m: 14, o: 0.32 },
        { x: 0.04, y: 0.6, m: 16, o: 0.3 },
        { x: 0.8, y: 0.8, m: 32, o: 0.45 },
        { x: 0.14, y: 0.87, m: 12, o: 0.32 },
      ]
      return wortel(`${px(40)}px ${px(30)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ marginTop: px(4), marginBottom: px(2) }}><Sneeuwvlok maat={px(26)} kleur={accent} dikte={1} /></D>
          {inhoud()}
        </D>
      ), vlokken.map((v, i) => los({ left: breedte * v.x, top: `${v.y * 100}%`, opacity: v.o }, <Sneeuwvlok maat={px(v.m)} kleur={accent} />, i)))
    }

    if (ontwerp === "zomer") {
      return wortel(`${px(34)}px ${px(30)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ marginTop: px(6), marginBottom: px(4) }}><Zonsopgang breedte={px(210)} kleur={accent} /></D>
          {inhoud()}
        </D>
      ))
    }

    if (ontwerp === "liefde") {
      const ini = initialenLijst(d.names)
      const hb = px(150)
      return wortel(`${px(34)}px ${px(30)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ position: "relative", width: hb, height: hb * 0.9, alignItems: "center", justifyContent: "center", marginTop: px(4), marginBottom: px(4) }}>
            {los({ left: 0, top: 0 }, <Hart breedte={hb} kleur={accent} dikte={1.2} />)}
            <D style={{ alignItems: "center", gap: px(8), marginTop: px(-10) }}>
              <div style={{ display: "flex", fontFamily: letters.extra, fontSize: pxN(40), lineHeight: 1, color: kop }}>{ini[0] ?? ""}</div>
              {ini[1] && <div style={{ display: "flex", fontFamily: letters.extra, fontSize: pxN(24), lineHeight: 1, color: accent }}>&amp;</div>}
              {ini[1] && <div style={{ display: "flex", fontFamily: letters.extra, fontSize: pxN(40), lineHeight: 1, color: kop }}>{ini[1]}</div>}
            </D>
          </D>
          {inhoud()}
        </D>
      ))
    }

    // Hartlijn: één fijne lijn die in het midden een hart vormt
    if (ontwerp === "hartlijn") {
      return wortel(`${px(40)}px ${px(26)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ marginTop: px(2), marginBottom: px(2) }}><Hartlijn breedte={px(360)} kleur={accent} /></D>
          {inhoud()}
        </D>
      ))
    }

    // Twee harten die elkaar overlappen, als twee ringen
    if (ontwerp === "tweeharten") {
      return wortel(`${px(40)}px ${px(30)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ marginTop: px(4), marginBottom: px(6) }}><TweeHarten breedte={px(170)} kleur={accent} /></D>
          {inhoud()}
        </D>
      ))
    }

    // Hart in de &: puur letters, met een vol hartje op de plek van de &
    if (ontwerp === "hartamp") {
      const streep = <div style={{ display: "flex", width: px(110), height: lijn, backgroundColor: accent }} />
      const delen = naamDelen(d.names)
      let namenBlok: ReactNode
      if (delen) {
        const o = namenOpmaak(`${delen[0]} & ${delen[1]}`, plek, namenVrij)
        const naast = !/\n/.test(d.names) && !o.tekst.includes("\n")
        const g = o.grootte
        const naam = (n: string) => (
          <div style={{ display: "flex", fontFamily: letters.namen, fontSize: g, lineHeight: 1.05, color: kop, whiteSpace: "nowrap" }}>{n}</div>
        )
        namenBlok = (
          <D style={{ flexDirection: naast ? "row" : "column", alignItems: "center", gap: naast ? g * 0.24 : g * 0.12 }}>
            {naam(delen[0])}
            <Hart breedte={g * 0.56} kleur={accent} vol />
            {naam(delen[1])}
          </D>
        )
      } else {
        namenBlok = <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.05, color: kop }} />
      }
      return wortel(`${px(40)}px ${px(26)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ marginTop: px(6), marginBottom: px(4) }}>{namenBlok}</D>
          {datum && (
            <div style={{ display: "flex", ...tt("datum", letters.kop, 12.5), letterSpacing: "0.26em", textTransform: "uppercase", color: kop }}>{datum}</div>
          )}
          {/* Eén doorlopende streep: met nog een hartje erin stonden er twee
              hartjes op de kaart (Michiel, 27 september 2026) */}
          <D style={{ marginTop: px(4), marginBottom: px(4) }}>{streep}</D>
          {d.location && (
            <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 11.5), lineHeight: 1.5, letterSpacing: "0.06em", color: tekst, opacity: 0.88 }} />
          )}
          {d.message && (
            <Regels tekst={d.message} style={{ fontFamily: letters.tekst, fontSize: pxK(12), lineHeight: 1.55, color: tekst, maxWidth: px(290), marginTop: px(4), opacity: 0.9 }} />
          )}
          {details(accent, { grootte: 10.5, marge: 4, max: 300 })}
        </D>
      ))
    }

    // Hart als kader: een groot hart van een fijne lijn met de namen erin
    if (ontwerp === "hartkader") {
      const hb = px(330)
      return wortel(`${px(34)}px ${px(20)}px`, (
        <D style={kolom}>
          {kopRegel(11, accent)}
          <D style={{ position: "relative", width: hb, height: hb * 0.9, alignItems: "center", justifyContent: "center" }}>
            {los({ left: 0, top: 0 }, <Hart breedte={hb} kleur={accent} dikte={0.45} />)}
            <D style={{ flexDirection: "column", alignItems: "center", gap: px(8), marginTop: px(-34) }}>
              <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.12, color: kop }} />
              {datum && (
                <div style={{ display: "flex", ...tt("datum", letters.kop, 11), letterSpacing: "0.24em", textTransform: "uppercase", color: accent }}>{datum}</div>
              )}
            </D>
          </D>
          {d.location && (
            <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 12), lineHeight: 1.5, letterSpacing: "0.06em", color: tekst, opacity: 0.88 }} />
          )}
          {d.message && (
            <Regels tekst={d.message} style={{ fontFamily: letters.tekst, fontSize: pxK(12), lineHeight: 1.55, color: tekst, maxWidth: px(290), opacity: 0.9 }} />
          )}
          {details(accent, { grootte: 10.5, marge: 2, max: 300 })}
        </D>
      ))
    }

    // Hand getekend hart: lang en scheef, als met krijt
    if (ontwerp === "krijthart") {
      return wortel(`${px(36)}px ${px(30)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ marginTop: px(4), marginBottom: px(6), transform: "rotate(-6deg)" }}><KrijtHart breedte={px(96)} kleur={accent} /></D>
          {inhoud()}
        </D>
      ))
    }

    // Kalligrafie: een open hart als een penseelstreek
    if (ontwerp === "kalligrafie") {
      return wortel(`${px(36)}px ${px(30)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ marginTop: px(4), marginBottom: px(6) }}><KalligrafieHart breedte={px(120)} kleur={kop} /></D>
          {inhoud()}
        </D>
      ))
    }

    // Hart met schaduw: een zacht hart met een losse lijn, op een rondje
    if (ontwerp === "schaduwhart") {
      const r = px(170)
      return wortel(`${px(36)}px ${px(30)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ width: r, height: r, borderRadius: r / 2, backgroundColor: `${accent}22`, alignItems: "center", justifyContent: "center", marginTop: px(4), marginBottom: px(6) }}>
            <SchaduwHart breedte={px(112)} kleur={accent} lijnKleur={kop} />
          </D>
          {inhoud()}
        </D>
      ))
    }

    // Groot krijthart: het hand getekende hart groot en zacht achter de namen
    if (ontwerp === "krijtgroot") {
      const hb = px(230)
      const vak = px(330)
      return wortel(`${px(30)}px ${px(30)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ position: "relative", width: vak, height: hb * 1.5, alignItems: "center", justifyContent: "center" }}>
            {los({ left: (vak - hb) / 2, top: 0, opacity: 0.45, transform: "rotate(-5deg)" }, <KrijtHart breedte={hb} kleur={accent} />)}
            <D style={{ flexDirection: "column", alignItems: "center", gap: px(10), marginTop: px(-24) }}>
              <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.1, color: kop }} />
              {datum && (
                <div style={{ display: "flex", ...tt("datum", letters.kop, 12.5), letterSpacing: "0.24em", textTransform: "uppercase", color: kop }}>{datum}</div>
              )}
            </D>
          </D>
          {d.location && (
            <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 11.5), lineHeight: 1.5, letterSpacing: "0.06em", color: tekst, opacity: 0.88 }} />
          )}
          {d.message && (
            <Regels tekst={d.message} style={{ fontFamily: letters.tekst, fontSize: pxK(12), lineHeight: 1.55, color: tekst, maxWidth: px(290), opacity: 0.9 }} />
          )}
          {details(accent, { grootte: 10.5, marge: 2, max: 300 })}
        </D>
      ))
    }

    // Hart op de rand: een fijne rand met het kalligrafiehart bovenop
    if (ontwerp === "hartrand") {
      const hw = px(58)
      const rand = px(22)
      return wortel(`${px(76)}px ${px(44)}px ${px(50)}px`, (
        <D style={kolom}>
          {kopRegel(10.5)}
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.12, color: kop, marginTop: px(4) }} />
          <div style={{ display: "flex", width: px(56), height: lijn, backgroundColor: accent }} />
          {datum && (
            <div style={{ display: "flex", ...tt("datum", letters.kop, 12.5), letterSpacing: "0.26em", textTransform: "uppercase", color: accent }}>{datum}</div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 12), lineHeight: 1.5, letterSpacing: "0.06em", color: tekst, opacity: 0.88 }} />
          )}
          {d.message && (
            <Regels tekst={d.message} style={{ fontFamily: letters.tekst, fontSize: pxK(12.5), lineHeight: 1.55, color: tekst, maxWidth: px(280), opacity: 0.9 }} />
          )}
          {details(accent, { grootte: 10.5, marge: 2, max: 290 })}
        </D>
      ), [
        los({ left: rand, top: rand, right: rand, bottom: rand, border: `${lijn}px solid ${accent}`, borderRadius: px(6) }, null, 0),
        // Het hart onderbreekt de rand: een stukje achtergrond erachter
        los({ left: (breedte - hw) / 2 - px(10), top: rand - hw * 0.3, paddingLeft: px(10), paddingRight: px(10), backgroundColor: achtergrond }, <KalligrafieHart breedte={hw} kleur={accent} />, 1),
      ])
    }

    // Hart in de hoek: alles links, groot en rustig, en het hart met schaduw
    // rechtsonder
    if (ontwerp === "harthoek") {
      return (
        <D style={{ ...basis, justifyContent: "space-between", padding: `${px(46)}px ${px(36)}px ${px(30)}px`, borderRadius: px(14) }}>
          <D style={{ flexDirection: "column", alignItems: "flex-start", gap: px(10) }}>
            <div style={{ display: "flex", ...tt("kop", letters.kop, 10.5), letterSpacing: "0.34em", textTransform: "uppercase", color: label }}>{d.heading}</div>
            <Namen vb={vb} onderElkaar plek={plek} {...namenVrij} namen={d.names} uitlijnen="flex-start" style={{ fontFamily: letters.namen, lineHeight: 1.08, color: kop, marginTop: px(8) }} />
            <div style={{ display: "flex", width: px(46), height: lijn, backgroundColor: accent, marginTop: px(4) }} />
            {datum && (
              <div style={{ display: "flex", ...tt("datum", letters.kop, 12.5), letterSpacing: "0.24em", textTransform: "uppercase", color: accent }}>{datum}</div>
            )}
            {d.location && (
              <Regels tekst={d.location} uitlijnen="flex-start" style={{ ...tt("locatie", letters.tekst, 11.5), lineHeight: 1.5, letterSpacing: "0.06em", color: tekst, opacity: 0.88 }} />
            )}
            {d.message && (
              <Regels tekst={d.message} uitlijnen="flex-start" style={{ fontFamily: letters.tekst, fontSize: pxK(12), lineHeight: 1.55, color: tekst, maxWidth: px(280), opacity: 0.9 }} />
            )}
            {details(accent, { grootte: 10.5, marge: 2, max: 300, uitlijnen: "flex-start" })}
          </D>
          <D style={{ width: "100%", justifyContent: "flex-end", marginTop: px(14) }}>
            <SchaduwHart breedte={px(150)} kleur={accent} lijnKleur={kop} />
          </D>
        </D>
      )
    }

    // Pak en jurk: twee harten, een in pak en een van kant
    if (ontwerp === "pakjurk") {
      return wortel(`${px(40)}px ${px(30)}px`, (
        <D style={kolom}>
          {kopRegel()}
          <D style={{ marginTop: px(8), marginBottom: px(8) }}>
            <PakEnJurk breedte={px(250)} kop={kop} accent={accent} achtergrond={achtergrond} />
          </D>
          {inhoud({ datumKleur: kop })}
        </D>
      ))
    }

    // Proost: een golvend kader, Save the Date groot in handschrift en
    // verspringend, en twee glazen die tegen elkaar tikken
    if (ontwerp === "proost") {
      const woorden = d.heading.trim().split(/\s+/)
      const meting = ONTWERP_LETTERS.proost.extra ?? ONTWERP_LETTERS.proost.namen
      // Zo groot als past, en nooit groter dan het ontwerp
      const past = (w: string, max: number, ruimte: number) => Math.min(max, ruimte / Math.max(0.1, tekstBreedte(w, meting, 1)))
      const woord = (w: string, n: number, style: CSSProperties = {}) => (
        <div style={{ display: "flex", ...tt("kop", letters.extra ?? letters.namen, n), lineHeight: 0.95, color: kop, whiteSpace: "nowrap", ...style }}>{w}</div>
      )
      let titel: ReactNode
      if (woorden.length === 3) {
        titel = (
          <D style={{ flexDirection: "column", width: "100%" }}>
            {woord(woorden[0], past(woorden[0], 90, 250), { alignSelf: "flex-start", marginLeft: px(22) })}
            <div style={{ display: "flex", alignSelf: "center", ...tt("kop", letters.kop, 19), lineHeight: 1, color: kop, marginTop: px(-10), marginBottom: px(-6) }}>{woorden[1]}</div>
            {woord(woorden[2], past(woorden[2], 90, 250), { alignSelf: "flex-end", marginRight: px(22) })}
          </D>
        )
      } else if (woorden.length === 2) {
        titel = (
          <D style={{ flexDirection: "column", width: "100%" }}>
            {woord(woorden[0], past(woorden[0], 90, 250), { alignSelf: "flex-start", marginLeft: px(22) })}
            {woord(woorden[1], past(woorden[1], 90, 250), { alignSelf: "flex-end", marginRight: px(22), marginTop: px(-8) })}
          </D>
        )
      } else {
        titel = woord(d.heading, past(d.heading, 80, 300), { alignSelf: "center" })
      }
      return (
        <D style={{ ...basis, height: hoogte, alignItems: "center", justifyContent: "space-between", padding: `${px(48)}px ${px(44)}px ${px(46)}px`, borderRadius: px(10) }}>
          <svg width={breedte} height={hoogte} viewBox="0 0 400 560" fill="none" style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={golfKader(400, 560, { inzet: 24, hoek: 10, golf: 30, hoogte: 3.2, grillig: 0.3 })} stroke={accent} strokeWidth="2.6" strokeLinejoin="round" />
          </svg>
          <D style={{ ...kolom, gap: px(8) }}>
            {titel}
            <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.3, letterSpacing: "0.22em", textTransform: "uppercase", color: kop, marginTop: px(14) }} />
            {d.dateText && (
              <div style={{ display: "flex", ...tt("datum", letters.tekst, 16), color: accent, textAlign: "center" }}>{d.dateText}</div>
            )}
            {d.location && (
              <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 13), lineHeight: 1.4, color: tekst, opacity: 0.88 }} />
            )}
            {d.message && (
              <Regels tekst={d.message} style={{ fontFamily: letters.tekst, fontSize: pxK(13), lineHeight: 1.45, color: tekst, maxWidth: px(280), opacity: 0.9 }} />
            )}
            {details(accent, { grootte: 11, marge: 2, max: 290 })}
          </D>
          <Glazen breedte={px(92)} kleur={accent} />
        </D>
      )
    }

    // Strik: een golvend kader met een strik bovenop, grote namen met een &
    // in handschrift
    if (ontwerp === "strik") {
      const delen = naamDelen(d.names)
      let namenBlok: ReactNode
      if (delen) {
        const g = Math.min(namenOpmaak(delen[0], plek, namenVrij).grootte, namenOpmaak(`& ${delen[1]}`, plek, namenVrij).grootte)
        const naam = (n: string) => (
          <div style={{ display: "flex", fontFamily: letters.namen, fontSize: g, lineHeight: 1, color: kop, whiteSpace: "nowrap" }}>{n}</div>
        )
        namenBlok = (
          <D style={{ flexDirection: "column", alignItems: "center", gap: g * 0.06 }}>
            {naam(delen[0])}
            <D style={{ alignItems: "center", gap: g * 0.22 }}>
              <div style={{ display: "flex", fontFamily: letters.extra ?? letters.namen, fontSize: g * 0.78, lineHeight: 1, color: kop }}>&amp;</div>
              {naam(delen[1])}
            </D>
          </D>
        )
      } else {
        namenBlok = <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.05, color: kop }} />
      }
      return (
        <D style={{ ...basis, height: hoogte, alignItems: "center", justifyContent: "center", padding: `${px(70)}px ${px(50)}px ${px(56)}px`, borderRadius: px(10) }}>
          <svg width={breedte} height={hoogte} viewBox="0 0 400 560" fill="none" style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={golfKader(400, 560, { inzet: 26, hoek: 38, golf: 120, hoogte: 5 })} stroke={kop} strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", position: "absolute", left: px(130), top: px(3) }}>
            <Strikje breedte={px(140)} kleur={kop} achtergrond={achtergrond} />
          </div>
          <D style={{ ...kolom, gap: px(8) }}>
            {namenBlok}
            <div style={{ display: "flex", ...tt("kop", letters.extra ?? letters.namen, 26), lineHeight: 1.2, color: kop, marginTop: px(10) }}>{d.heading}</div>
            {d.dateText && (
              <div style={{ display: "flex", ...tt("datum", letters.tekst, 11.5), letterSpacing: "0.04em", color: tekst, textAlign: "center", marginTop: px(12) }}>{d.dateText}</div>
            )}
            {d.location && (
              <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 11.5), lineHeight: 1.5, letterSpacing: "0.04em", color: tekst }} />
            )}
            {details(tekst, { grootte: 11, marge: 0, max: 290 })}
            {d.message && (
              <Regels tekst={d.message} style={{ fontFamily: letters.namen, fontSize: px(15), lineHeight: 1.4, color: kop, maxWidth: px(280), marginTop: px(14) }} />
            )}
          </D>
        </D>
      )
    }

    if (ontwerp === "boho") {
      return wortel(`${px(34)}px ${px(30)}px`, (
        <D style={kolom}>
          <D style={{ marginBottom: px(6) }}><Regenboog breedte={px(220)} kleur={accent} /></D>
          {kopRegel()}
          {inhoud()}
        </D>
      ))
    }

  }

  // ── De ontwerpen van de homepagina (27 september 2026) ─────────────────────
  // Breed, en getekend met lijnen en letters in de kleuren van de website.
  // Alleen op de homepagina, nooit als kaart.
  const isoDelen = d.datumIso?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const lijnStuk = (breed: number, kleur = accent) => (
    <div style={{ display: "flex", width: px(breed), height: lijn, backgroundColor: kleur }} />
  )

  // Editoriaal: als de voorpagina van een tijdschrift
  if (ontwerp === "editoriaal") {
    return (
      <D style={{ ...basis, alignItems: "center", padding: `${px(24)}px ${px(20)}px`, gap: px(10) }}>
        <div style={{ display: "flex", ...tt("kop", letters.kop, 10), letterSpacing: "0.42em", textTransform: "uppercase", color: label }}>
          {d.heading}
        </div>
        <div style={{ display: "flex", width: "100%", height: lijn, backgroundColor: kop, opacity: 0.45 }} />
        <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.02, color: kop, marginTop: px(8), marginBottom: px(8) }} />
        <div style={{ display: "flex", width: "100%", height: lijn, backgroundColor: kop, opacity: 0.45 }} />
        <D style={{ width: "100%", justifyContent: d.location ? "space-between" : "center", alignItems: "center", gap: px(16) }}>
          {d.dateText && (
            <div style={{ display: "flex", ...tt("datum", letters.kop, 11), letterSpacing: "0.22em", textTransform: "uppercase", color: kop }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <div style={{ display: "flex", ...tt("locatie", letters.tekst, 11), letterSpacing: "0.22em", textTransform: "uppercase", color: kop, textAlign: "right" }}>
              {d.location.replace(/\s*\n\s*/g, ", ")}
            </div>
          )}
        </D>
        {details(accent, { grootte: 10.5, marge: 8, max: 360 })}
      </D>
    )
  }

  // Monogram: de initialen groot in een dunne dubbele cirkel
  if (ontwerp === "monogram") {
    const ini = initialenLijst(d.names)
    const c = px(156)
    return (
      <D style={{ ...basis, alignItems: "center", padding: `${px(24)}px ${px(24)}px`, gap: px(12) }}>
        <div style={{ display: "flex", ...tt("kop", letters.kop, 10), letterSpacing: "0.4em", textTransform: "uppercase", color: label }}>
          {d.heading}
        </div>
        <D style={{ position: "relative", width: c, height: c, alignItems: "center", justifyContent: "center", marginTop: px(4) }}>
          <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: c, height: c, borderRadius: c / 2, border: `${lijn}px solid ${accent}` }} />
          <div style={{ display: "flex", position: "absolute", top: px(6), left: px(6), width: c - px(12), height: c - px(12), borderRadius: (c - px(12)) / 2, border: `${lijn}px solid ${accent}80` }} />
          <D style={{ alignItems: "center", gap: px(12) }}>
            <div style={{ display: "flex", fontFamily: letters.extra, fontSize: pxN(58), lineHeight: 1, color: kop }}>{ini[0] ?? "♥"}</div>
            {ini[1] && <div style={{ display: "flex", width: lijn, height: px(58), backgroundColor: accent }} />}
            {ini[1] && <div style={{ display: "flex", fontFamily: letters.extra, fontSize: pxN(58), lineHeight: 1, color: kop }}>{ini[1]}</div>}
          </D>
        </D>
        <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.15, color: kop, marginTop: px(6) }} />
        {d.dateText && (
          <D style={{ alignItems: "center", gap: px(12) }}>
            {lijnStuk(36)}
            <div style={{ display: "flex", ...tt("datum", letters.kop, 11), letterSpacing: "0.26em", textTransform: "uppercase", color: accent }}>{d.dateText}</div>
            {lijnStuk(36)}
          </D>
        )}
        {d.location && (
          <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 11), lineHeight: 1.5, letterSpacing: "0.08em", color: tekst, opacity: 0.85 }} />
        )}
        {details(accent, { grootte: 10.5, marge: 4, max: 340 })}
      </D>
    )
  }

  // Klassiek kader: twee dunne lijnen met sierhoekjes, breed en liggend
  if (ontwerp === "lijnkader") {
    const hoekje = (stijl: CSSProperties) => (
      <div style={{ display: "flex", position: "absolute", width: px(9), height: px(9), backgroundColor: accent, transform: "rotate(45deg)", ...stijl }} />
    )
    const buiten = px(4.5)
    return (
      <D style={{ ...basis, alignItems: "center", padding: px(10) }}>
        <D
          style={{
            position: "relative",
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
            padding: `${px(34)}px ${px(40)}px`,
            border: `${lijn}px solid ${accent}`,
            gap: px(10),
          }}
        >
          {/* De binnenste lijn */}
          <div style={{ display: "flex", position: "absolute", top: px(6), left: px(6), right: px(6), bottom: px(6), border: `${lijn}px solid ${accent}70` }} />
          {hoekje({ top: -buiten, left: -buiten })}
          {hoekje({ top: -buiten, right: -buiten })}
          {hoekje({ bottom: -buiten, left: -buiten })}
          {hoekje({ bottom: -buiten, right: -buiten })}
          <div style={{ display: "flex", ...tt("kop", letters.kop, 11), letterSpacing: "0.34em", textTransform: "uppercase", color: accent }}>
            {d.heading}
          </div>
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.15, color: kop }} />
          <D style={{ alignItems: "center", gap: px(8) }}>
            {lijnStuk(30)}
            <div style={{ display: "flex", width: px(6), height: px(6), backgroundColor: accent, transform: "rotate(45deg)" }} />
            {lijnStuk(30)}
          </D>
          {d.dateText && (
            <div style={{ display: "flex", ...tt("datum", letters.tekst, 16), fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: kop }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 14), lineHeight: 1.45, color: tekst, opacity: 0.9 }} />
          )}
          {details(accent, { grootte: 11, marge: 4, max: 300 })}
        </D>
      </D>
    )
  }

  // Datumband: de namen boven, de datum groot in een brede band
  if (ontwerp === "datumband") {
    const delen = isoDelen ? [isoDelen[3], isoDelen[2], isoDelen[1]] : null
    return (
      <D style={{ ...basis, alignItems: "center", padding: `${px(24)}px ${px(24)}px`, gap: px(12) }}>
        <div style={{ display: "flex", ...tt("kop", letters.kop, 11), letterSpacing: "0.42em", textTransform: "uppercase", color: label }}>
          {d.heading}
        </div>
        <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.1, color: kop }} />
        <D
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            padding: `${px(12)}px 0`,
            borderTop: `${lijn}px solid ${accent}`,
            borderBottom: `${lijn}px solid ${accent}`,
            gap: px(22),
            marginTop: px(4),
          }}
        >
          {delen
            ? delen.flatMap((x, i) => [
                ...(i > 0 ? [<div key={`s${i}`} style={{ display: "flex", width: lijn, height: px(40), backgroundColor: accent }} />] : []),
                <div key={`d${i}`} style={{ display: "flex", ...tt("datum", letters.kop, 40), fontWeight: 300, letterSpacing: "0.04em", lineHeight: 1, color: kop }}>
                  {x}
                </div>,
              ])
            : d.dateText && (
                <div style={{ display: "flex", ...tt("datum", letters.kop, 20), fontWeight: 300, letterSpacing: "0.1em", color: kop }}>{d.dateText}</div>
              )}
        </D>
        {d.location && (
          <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 12), lineHeight: 1.5, letterSpacing: "0.16em", textTransform: "uppercase", color: tekst, opacity: 0.85 }} />
        )}
        {details(accent, { grootte: 10.5, marge: 2, max: 360 })}
      </D>
    )
  }

  // ── De kaders uit de websitebouwer: een krans, of een liggende kaart ───────
  const kader = KADERS[ontwerp]
  if (kader) {
    const src = voorAfbeelding ? illustratie(kader.afbeelding, true) : kader.web
    const datum = datumKort(d.datumIso, "\u00a0·\u00a0") ?? d.dateText

    if (kader.vorm === "liggend") {
      // De tekening vult de kaart; de tekst staat in het midden, in de
      // kleuren van de tekening
      const h = Math.round(breedte * (kader.verhouding ?? 0.666))
      const bw = breedte * kader.ruimte[0]
      const bh = h * kader.ruimte[1]
      return (
        <D style={{ ...basis, minHeight: h, height: h, borderRadius: px(6), backgroundColor: "#F8F6F1" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={breedte} height={h} style={{ position: "absolute", top: 0, left: 0, width: breedte, height: h, objectFit: "cover", borderRadius: px(6) }} />
          <D
            style={{
              position: "absolute",
              left: breedte * kader.midden[0] - bw / 2,
              top: h * kader.midden[1] - bh / 2,
              width: bw,
              height: bh,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: px(6),
            }}
          >
            <div style={{ display: "flex", ...tt("kop", letters.kop, 9.5), letterSpacing: "0.32em", textTransform: "uppercase", color: kader.kleur.accent }}>
              {d.heading}
            </div>
            <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.1, color: kader.kleur.namen }} />
            {datum && (
              <div style={{ display: "flex", ...tt("datum", letters.kop, 11), letterSpacing: "0.2em", color: kader.kleur.accent }}>{datum}</div>
            )}
            {d.location && (
              <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 10), lineHeight: 1.4, letterSpacing: "0.06em", color: kader.kleur.namen, opacity: 0.8 }} />
            )}
            {details(kader.kleur.accent, { grootte: 8.5, marge: 2, max: 400 * kader.ruimte[0] })}
          </D>
        </D>
      )
    }

    // Een krans: de kop erboven, de namen en de datum in de vorm, de locatie
    // en de boodschap eronder
    const kw = px(372)
    const bw = kw * kader.ruimte[0]
    const bh = kw * kader.ruimte[1]
    return (
      <D style={{ ...basis, alignItems: "center", justifyContent: "center", padding: `${px(28)}px ${px(14)}px ${px(30)}px`, borderRadius: px(12) }}>
        {/* De kop in de kleur van de tekening: in de bleke kleur van sommige
            websitestijlen viel hij weg naast de bloemen. Maar de achtergrond
            komt van de stijl, en goud op terracotta viel ook weg; dan de
            tekstkleur van de stijl (Michiel, 26 september 2026). */}
        <div style={{ display: "flex", ...tt("kop", letters.kop, 12.5), letterSpacing: "0.3em", textTransform: "uppercase", color: leesbaar(kader.kleur.accent, achtergrond, [kop]) }}>
          {d.heading}
        </div>
        <D style={{ position: "relative", width: kw, height: kw, marginTop: px(2) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={kw} height={kw} style={{ position: "absolute", top: 0, left: 0, width: kw, height: kw }} />
          <D
            style={{
              position: "absolute",
              left: kw * kader.midden[0] - bw / 2,
              top: kw * kader.midden[1] - bh / 2,
              width: bw,
              height: bh,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: px(7),
            }}
          >
            <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.12, color: kader.kleur.namen }} />
            {datum && (
              <div style={{ display: "flex", ...tt("datum", letters.kop, 10.5), letterSpacing: "0.14em", color: kader.kleur.accent }}>{datum}</div>
            )}
          </D>
        </D>
        {d.location && (
          <Regels
            tekst={d.location}
            style={{ ...tt("locatie", letters.tekst, 12.5), lineHeight: 1.5, letterSpacing: "0.08em", color: kop, marginTop: px(4) }}
          />
        )}
        <div style={{ display: "flex", width: px(30), height: lijn, backgroundColor: `${accent}80`, marginTop: px(10), marginBottom: px(10) }} />
        {d.message && (
          <Regels tekst={d.message} style={{ fontFamily: letters.tekst, fontSize: pxK(12), lineHeight: 1.55, color: tekst, maxWidth: px(310) }} />
        )}
        {details(leesbaar(accent, achtergrond, [kop]), { grootte: 11, marge: 10 })}
      </D>
    )
  }

  // ── Olijf: het waterverfkader uit de websitebouwer, vierkant ──────────────
  // De kleuren horen bij de tekening (groen blad, goud kader), dus die liggen
  // vast en volgen niet de stijl van de website.
  if (ontwerp === "olijf") {
    const goud = "#A8894F"
    const groen = "#4A5747"
    return (
      <D style={{ ...basis, minHeight: breedte, height: breedte, borderRadius: px(6), backgroundColor: "#F8F8F3" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vrij ? "/frames/olive-square.webp" : illustratie("/kaart-illustraties/olijf-vierkant.jpg", voorAfbeelding)}
          alt=""
          width={breedte}
          height={breedte}
          style={{ position: "absolute", top: 0, left: 0, width: breedte, height: breedte, borderRadius: px(6) }}
        />
        {/* Binnen het gouden kader: dat loopt van 9 tot 91 procent */}
        <D
          style={{
            position: "absolute",
            top: breedte * 0.1,
            left: breedte * 0.09,
            width: breedte * 0.82,
            height: breedte * 0.815,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: px(10),
            padding: `${px(20)}px ${px(40)}px`,
          }}
        >
          <div style={{ display: "flex", ...tt("kop", letters.kop, 11), letterSpacing: "0.32em", textTransform: "uppercase", color: goud }}>
            {d.heading}
          </div>
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.15, color: groen }} />
          {d.dateText && (
            <div style={{ display: "flex", ...tt("datum", letters.kop, 12), letterSpacing: "0.22em", textTransform: "uppercase", color: goud, textAlign: "center" }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ ...tt("locatie", letters.tekst, 11), lineHeight: 1.5, letterSpacing: "0.06em", color: groen, opacity: 0.8 }} />
          )}
          {details(goud, { grootte: 9.5, marge: 2, max: 200 })}
        </D>
      </D>
    )
  }

  // ── Grote titel: "Save the Date" als beeld, in een zacht ovaal ────────────
  if (ontwerp === "titel") {
    const woorden = d.heading.split(/\s+/).filter(Boolean)
    const datum = datumKort(d.datumIso, ".") ?? d.dateText
    return (
      <D style={{ ...basis, alignItems: "center", justifyContent: "center", padding: px(26), borderRadius: px(12) }}>
        <D
          style={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: px(334),
            minHeight: px(490),
            borderRadius: px(167),
            backgroundColor: `${accent}26`,
            padding: `${px(40)}px ${px(24)}px`,
            gap: px(4),
          }}
        >
          {woorden.map((w, i) => {
            // Een kort tussenwoord ("the") klein
            const klein = i > 0 && i < woorden.length - 1 && w.length <= 3
            // Een lang woord moet in het ovaal passen
            const grootte = klein ? 34 : Math.min(76, 290 / Math.max(3, w.length * 0.62))
            return (
              <D key={i} style={{ alignItems: "center", marginTop: klein ? px(-6) : 0, marginBottom: klein ? px(-6) : 0 }}>
                <div style={{ display: "flex", ...tt("kop", letters.kop, grootte), lineHeight: 1, color: kop }}>{w}</div>
              </D>
            )
          })}
          {datum && (
            <div style={{ display: "flex", ...tt("datum", letters.tekst, 15), fontWeight: 500, letterSpacing: "0.14em", color: kop, marginTop: px(26) }}>
              {datum}
            </div>
          )}
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names}
            style={{ fontFamily: letters.tekst, letterSpacing: "0.16em", color: kop, opacity: 0.8, marginTop: px(10) }}
          />
          {d.location && (
            <Regels
              tekst={d.location}
              style={{ ...tt("locatie", letters.tekst, 12), lineHeight: 1.5, letterSpacing: "0.08em", color: kop, opacity: 0.7, marginTop: px(4), maxWidth: px(260) }}
            />
          )}
          {details(kop, { grootte: 11, marge: 10, max: 334 - 48 })}
        </D>
      </D>
    )
  }

  // ── Palm: één palm, de namen dun met een "en" in handschrift ──────────────
  if (ontwerp === "palm") {
    const delen = naamDelen(d.names)
    const datum = datumKort(d.datumIso, "  |  ") ?? d.dateText
    const boogB = px(250)
    return (
      // Op de homepagina bovenin veel minder lucht: de pagina heeft zelf al
      // ruimte onder het menu (Michiel, 27 september 2026)
      <D style={{ ...basis, alignItems: "center", justifyContent: "center", padding: `${px(vrij ? 4 : 34)}px ${px(30)}px ${px(34)}px`, borderRadius: px(22) }}>
        {/* De kop in een boog boven de palm */}
        <D style={{ position: "relative", width: boogB, height: px(215), justifyContent: "center", alignItems: "flex-end", ...(vrij ? { marginTop: px(-22) } : {}) }}>
          {boogLetters({
            tekst: d.heading,
            cx: boogB / 2,
            cy: px(118),
            rx: px(92),
            ry: px(84),
            graden: 150,
            grootte: tt("kop", letters.kop, 17).fontSize as number,
            spatie: 0.08,
            stijl: { fontFamily: tt("kop", letters.kop, 17).fontFamily, color: kop },
          })}
          <D style={{ marginBottom: px(-4) }}>
            <Palm breedte={px(82)} kleur={accent} />
          </D>
        </D>
        {delen ? (
          <D style={{ flexDirection: "column", alignItems: "center", marginTop: px(14) }}>
            <div style={{ display: "flex", fontFamily: letters.namen, fontSize: pxN(54), lineHeight: 1, color: kop }}>{delen[0]}</div>
            <div style={{ display: "flex", fontFamily: letters.extra, fontSize: pxN(44), lineHeight: 0.9, color: accent, marginTop: px(-2), marginBottom: px(-2) }}>
              {d.verbinder}
            </div>
            <div style={{ display: "flex", fontFamily: letters.namen, fontSize: pxN(54), lineHeight: 1, color: kop }}>{delen[1]}</div>
          </D>
        ) : (
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.05, color: kop, marginTop: px(14) }} />
        )}
        {datum && (
          <div style={{ display: "flex", ...tt("datum", letters.namen, 20), letterSpacing: "0.04em", color: kop, marginTop: px(22) }}>
            {datum}
          </div>
        )}
        {d.message && (
          <Regels
            tekst={d.message}
            style={{ fontFamily: letters.tekst, fontSize: pxK(12), lineHeight: 1.55, color: tekst, maxWidth: px(270), marginTop: px(12), opacity: 0.9 }}
          />
        )}
        {details(leesbaar(accent, achtergrond, [kop]), { grootte: 11, marge: 12 })}
      </D>
    )
  }

  // ── Ibiza: palmen en golven in een ovaal, tekst rond het ovaal ────────────
  if (ontwerp === "ibiza") {
    const ow = px(300)
    const oh = px(398)
    const datum = datumKort(d.datumIso, " · ") ?? d.dateText
    return (
      <D style={{ ...basis, alignItems: "center", justifyContent: "center", padding: `${px(30)}px ${px(28)}px`, borderRadius: px(14), gap: px(20) }}>
        <D
          style={{
            position: "relative",
            width: ow,
            height: oh,
            border: `${Math.max(1, px(1.6))}px solid ${accent}`,
            borderRadius: ow / 2,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          {boogLetters({
            tekst: "I DO, ME TOO!",
            cx: ow / 2,
            cy: oh / 2,
            rx: ow / 2 - px(30),
            ry: oh / 2 - px(30),
            graden: 120,
            grootte: px(16),
            spatie: 0.3,
            stijl: { fontFamily: letters.kop, color: accent, letterSpacing: "0.02em" },
          })}
          {boogLetters({
            tekst: "LET'S CELEBRATE",
            cx: ow / 2,
            cy: oh / 2,
            rx: ow / 2 - px(30),
            ry: oh / 2 - px(30),
            graden: 120,
            onder: true,
            grootte: px(16),
            spatie: 0.3,
            stijl: { fontFamily: letters.kop, color: accent, letterSpacing: "0.02em" },
          })}
          <D style={{ alignItems: "flex-end", gap: px(2), marginTop: px(10) }}>
            <Palm breedte={px(46)} kleur={`${accent}B3`} />
            <Palm breedte={px(78)} kleur={`${accent}CC`} />
            <Palm breedte={px(54)} kleur={`${accent}B3`} />
          </D>
          <D style={{ marginTop: px(4) }}>
            <Golven breedte={px(130)} kleur={`${accent}B3`} />
          </D>
        </D>
        <D style={{ flexDirection: "column", alignItems: "center", gap: px(6) }}>
          <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1, color: kop }} />
          {datum && (
            <div style={{ display: "flex", ...tt("datum", letters.tekst, 12), letterSpacing: "0.22em", color: kop, opacity: 0.85 }}>
              {datum}
            </div>
          )}
          {details(kop, { grootte: 11, marge: 4 })}
        </D>
      </D>
    )
  }

  // ── Foto met handschrift: de foto vol, een titel in handschrift ───────────
  if (ontwerp === "fotoschrift") {
    const wit = "#FFFDF8"
    const datum = datumKort(d.datumIso, "  |  ") ?? d.dateText
    return (
      <D
        style={{
          ...basis,
          justifyContent: "flex-end",
          borderRadius: px(14),
          backgroundColor: accent,
          ...(d.photoUrl ? {} : { backgroundImage: `linear-gradient(170deg, ${accent} 0%, ${kop} 100%)` }),
        }}
      >
        {d.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.photoUrl}
            alt=""
            width={breedte}
            height={hoogte}
            style={{ position: "absolute", top: 0, left: 0, width: breedte, height: "100%", minHeight: hoogte, objectFit: "cover", borderRadius: px(14) }}
          />
        )}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            width: breedte,
            height: "100%",
            borderRadius: px(14),
            backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.25) 65%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        <D style={{ position: "relative", flexDirection: "column", alignItems: "center", padding: `${px(30)}px ${px(26)}px ${px(34)}px`, gap: px(6) }}>
          <div style={{ display: "flex", ...tt("kop", letters.kop, 76), lineHeight: 0.9, color: wit, textAlign: "center" }}>
            {d.heading}
          </div>
          {datum && (
            <div style={{ display: "flex", ...tt("datum", letters.tekst, 15), letterSpacing: "0.12em", color: wit, marginTop: px(8) }}>
              {datum}
            </div>
          )}
          <Namen vb={vb} plek={plek} {...namenVrij}
            namen={d.names.replace(/\s*\n\s*/g, " ")}
            style={{ fontFamily: letters.tekst, letterSpacing: "0.3em", textTransform: "uppercase", color: wit, opacity: 0.9, marginTop: px(4) }}
          />
          {details(wit, { grootte: 11, marge: 6 })}
        </D>
      </D>
    )
  }

  // ── De datum: de cijfers groot als beeld ──────────────────────────────────
  const cijfers = datumCijfers(d.datumIso)
  return (
    <D
      style={{
        ...basis,
        alignItems: "center",
        justifyContent: "center",
        padding: `${px(40)}px ${px(36)}px`,
        borderRadius: px(10),
        border: `${lijn}px solid ${accent}33`,
      }}
    >
      <div style={{ display: "flex", ...tt("kop", letters.tekst, 10), letterSpacing: "0.34em", textTransform: "uppercase", color: label }}>
        {d.heading}
      </div>
      {cijfers ? (
        <D style={{ flexDirection: "column", alignItems: "center", marginTop: px(12), marginBottom: px(8) }}>
          {cijfers.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                ...tt("datum", letters.kop, 86),
                lineHeight: 0.94,
                letterSpacing: "-0.01em",
                color: i === 1 ? accent : kop,
              }}
            >
              {c}
            </div>
          ))}
        </D>
      ) : (
        d.dateText && (
          <div style={{ display: "flex", ...tt("datum", letters.kop, 30), color: kop, marginTop: px(20), marginBottom: px(10), textAlign: "center" }}>
            {d.dateText}
          </div>
        )
      )}
      <Namen vb={vb} plek={plek} {...namenVrij} namen={d.names} style={{ fontFamily: letters.namen, lineHeight: 1.1, color: accent }} />
      {d.location && (
        <Regels
          tekst={d.location}
          style={{ ...tt("locatie", letters.tekst, 10.5), lineHeight: 1.6, letterSpacing: "0.14em", textTransform: "uppercase", color: tekst, opacity: 0.85, marginTop: px(8) }}
        />
      )}
      <div style={{ display: "flex", width: px(34), height: lijn, backgroundColor: `${accent}70`, marginTop: px(14), marginBottom: px(14) }} />
      {slot({ tekst, kop, accent })}
    </D>
  )
}

/**
 * De voorkant van een kaart. Met vrij (de homepagina) hetzelfde ontwerp, maar
 * zonder kaart eromheen: geen rand, geen afronding, geen schaduw en de kleur
 * van de pagina (Michiel, 26 september 2026). Vaste hoogtes blijven, want daar
 * hoort de tekening bij; een minimale hoogte niet, anders stond er lucht.
 */
export default function KaartVoorkant(props: Parameters<typeof Inhoud>[0]) {
  const el = Inhoud(props)
  if (!props.vrij || !isValidElement<{ style?: CSSProperties }>(el)) return el
  const stijl = el.props.style ?? {}
  return cloneElement(el, {
    style: {
      ...stijl,
      borderRadius: 0,
      border: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
      backgroundImage: "none",
      overflow: "visible",
      ...(stijl.height ? {} : { minHeight: undefined }),
    },
  })
}
