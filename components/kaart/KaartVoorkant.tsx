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

import type { CSSProperties, ReactNode } from "react"
import type { CardDisplay, NieuwOntwerp } from "@/lib/cards"
import type { SC } from "@/lib/event-styles"
import { illustratie, KADERS, type VoorkantLetters } from "@/lib/kaart-ontwerpen"

/** Een flexbox, want satori wil dat bij elke div met meer dan één kind. */
function D({ style, children }: { style?: CSSProperties; children?: ReactNode }) {
  return <div style={{ display: "flex", ...style }}>{children}</div>
}

/** Tekst met enters erin: elke regel een eigen blok. */
function Regels({ tekst, style, uitlijnen = "center" }: { tekst: string; style?: CSSProperties; uitlijnen?: "center" | "flex-start" }) {
  const regels = tekst.split(/\r?\n/).map((r) => r.trim())
  return (
    <D style={{ flexDirection: "column", alignItems: uitlijnen, ...style }}>
      {regels.map((r, i) =>
        r ? (
          <div key={i} style={{ display: "flex", textAlign: uitlijnen === "center" ? "center" : "left", justifyContent: uitlijnen }}>
            {r}
          </div>
        ) : (
          <div key={i} style={{ display: "flex", height: "0.7em" }} />
        )
      )}
    </D>
  )
}

/**
 * De namen, als ze op één regel staan, netjes over twee regels: "Michiel" en
 * "& Lindsey". Heeft het bruidspaar zelf een enter gezet, dan wint die.
 */
function namenRegels(namen: string): string {
  if (/\n/.test(namen)) return namen
  const m = namen.match(/^(.+?)\s+(&|\+|\||\/|en|and|et|und|y|e)\s+(.+)$/i)
  return m ? `${m[1]}\n${m[2]} ${m[3]}` : namen
}

/** "M | L", voor in de boog als er geen foto is (Michiel: een streep, geen &). */
function initialenVan(namen: string): string {
  // Scheiden op alles waarmee een bruidspaar twee namen kan scheiden: &, +,
  // |, /, een komma, een enter of een woord als "en". Eerst ontbraken | en /,
  // en dan stond er bij "Michiel | Lindsey" alleen een M (Michiel, 25
  // september 2026).
  const delen = namen
    .split(/\s*(?:&|\+|\||\/|,|·|\n|\ben\b|\band\b|\bet\b|\bund\b|\by\b|\be\b)\s*/i)
    .map((d) => d.trim())
    .filter(Boolean)
  if (delen.length >= 2) return `${delen[0][0]} | ${delen[delen.length - 1][0]}`.toUpperCase()
  // Twee woorden zonder iets ertussen: "Michiel Lindsey"
  const woorden = (delen[0] ?? "").split(/\s+/).filter(Boolean)
  if (woorden.length >= 2) return `${woorden[0][0]} | ${woorden[woorden.length - 1][0]}`.toUpperCase()
  return (woorden[0]?.[0] ?? "♥").toUpperCase()
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
  const verbinders = /^(&|\+|\||\/|en|and|et|und|y|e)$/i
  const regels = namen.split(/\r?\n/).map((r) => r.trim()).filter((r) => r && !verbinders.test(r))
  if (regels.length === 2) return [regels[0], regels[1]]
  const m = namen.replace(/\s+/g, " ").trim().match(/^(.+?)\s+(?:&|\+|\||\/|en|and|et|und|y|e)\s+(.+)$/i)
  return m ? [m[1], m[2]] : null
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

export default function KaartVoorkant({
  d,
  ontwerp,
  sc,
  breedte,
  letters,
  schaduw,
  voorAfbeelding = false,
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
}) {
  const s = breedte / 400
  const px = (n: number) => Math.round(n * s * 10) / 10
  const hoogte = Math.round(breedte * 1.4)

  const achtergrond = sc.cardBg ?? "#FFFEFB"
  const kop = sc.cardText ?? sc.headingColor
  const tekst = sc.cardText ?? sc.bodyText
  const accent = sc.accent
  const label = sc.labelColor
  const lijn = Math.max(1, Math.round(s))

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
          style={{ fontFamily: font, fontSize: px(12.5), lineHeight: 1.6, color: kleur.tekst, maxWidth: px(310) }}
        />
      )}
      {d.inviteLine && (
        <div style={{ display: "flex", fontFamily: font, fontSize: px(12.5), fontWeight: 600, lineHeight: 1.5, color: kleur.kop, maxWidth: px(310), textAlign: uitlijnen === "center" ? "center" : "left" }}>
          {d.inviteLine}
        </div>
      )}
      {d.timeText && (
        <Regels
          tekst={d.timeText}
          uitlijnen={uitlijnen}
          style={{ fontFamily: font, fontSize: px(11), fontWeight: 600, lineHeight: 1.6, letterSpacing: "0.06em", color: kleur.accent }}
        />
      )}
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
          <div style={{ display: "flex", fontFamily: letters.tekst, fontSize: px(12), lineHeight: 1.5, color: tekst, textAlign: "center", maxWidth: px(260) }}>
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
          <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(14), letterSpacing: "0.3em", textTransform: "uppercase", color: label }}>
            {d.heading}
          </div>
          <div style={{ display: "flex", width: px(36), height: lijn, backgroundColor: accent }} />
        </D>

        <D style={{ flexDirection: "column", gap: px(18), marginTop: px(30), marginBottom: px(30) }}>
          <Regels
            tekst={namenRegels(d.names)}
            uitlijnen="flex-start"
            style={{ fontFamily: letters.namen, fontSize: px(52), lineHeight: 1.04, color: kop }}
          />
          {d.dateText && (
            <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(12), letterSpacing: "0.22em", textTransform: "uppercase", color: kop }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} uitlijnen="flex-start" style={{ fontFamily: letters.tekst, fontSize: px(12), lineHeight: 1.5, color: tekst, opacity: 0.8 }} />
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
          <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(10), letterSpacing: "0.34em", textTransform: "uppercase", color: wit, opacity: 0.9 }}>
            {d.heading}
          </div>
          <Regels tekst={d.names} style={{ fontFamily: letters.namen, fontSize: px(48), lineHeight: 1.12, color: wit }} />
          <div style={{ display: "flex", width: px(38), height: lijn, backgroundColor: wit, opacity: 0.6, marginTop: px(2), marginBottom: px(2) }} />
          {d.dateText && (
            <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(12.5), letterSpacing: "0.24em", textTransform: "uppercase", color: wit }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ fontFamily: letters.tekst, fontSize: px(11.5), lineHeight: 1.5, color: wit, opacity: 0.88 }} />
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
              <div style={{ display: "flex", fontFamily: letters.namen, fontSize: px(46), color: accent, marginTop: px(30), letterSpacing: "0.04em" }}>
                {initialenVan(d.names)}
              </div>
            )}
          </D>
        </D>

        <D style={{ flexDirection: "column", alignItems: "center", gap: px(10) }}>
          <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(11), letterSpacing: "0.3em", textTransform: "uppercase", color: label }}>
            {d.heading}
          </div>
          <Regels tekst={d.names} style={{ fontFamily: letters.namen, fontSize: px(31), lineHeight: 1.18, color: kop }} />
          {d.dateText && (
            <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(15), letterSpacing: "0.14em", textTransform: "uppercase", color: accent }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ fontFamily: letters.tekst, fontSize: px(11.5), lineHeight: 1.5, color: tekst, opacity: 0.85 }} />
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
          <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(10.5), letterSpacing: "0.38em", textTransform: "uppercase", color: label }}>
            {d.heading}
          </div>
          <Regels
            tekst={namenRegels(d.names)}
            style={{ fontFamily: letters.namen, fontSize: px(29), lineHeight: 1.3, letterSpacing: "0.1em", textTransform: "uppercase", color: kop, marginTop: px(4), marginBottom: px(4) }}
          />
          <D style={{ alignItems: "center", gap: px(8), width: px(210) }}>
            <div style={{ display: "flex", flexGrow: 1, height: lijn, backgroundColor: accent }} />
            <div style={{ display: "flex", width: px(6), height: px(6), backgroundColor: accent, transform: "rotate(45deg)" }} />
            <div style={{ display: "flex", flexGrow: 1, height: lijn, backgroundColor: accent }} />
          </D>
          {d.dateText && (
            <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(12.5), letterSpacing: "0.26em", textTransform: "uppercase", color: accent, textAlign: "center" }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ fontFamily: letters.tekst, fontSize: px(10.5), lineHeight: 1.6, letterSpacing: "0.12em", textTransform: "uppercase", color: tekst, opacity: 0.85 }} />
          )}
          <D style={{ marginTop: px(8) }}>{slot({ tekst, kop, accent })}</D>
        </D>
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
            <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(9.5), letterSpacing: "0.32em", textTransform: "uppercase", color: kader.kleur.accent }}>
              {d.heading}
            </div>
            <Regels tekst={d.names} style={{ fontFamily: letters.namen, fontSize: px(34), lineHeight: 1.1, color: kader.kleur.namen }} />
            {datum && (
              <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(11), letterSpacing: "0.2em", color: kader.kleur.accent }}>{datum}</div>
            )}
            {d.location && (
              <Regels tekst={d.location} style={{ fontFamily: letters.tekst, fontSize: px(10), lineHeight: 1.4, letterSpacing: "0.06em", color: kader.kleur.namen, opacity: 0.8 }} />
            )}
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
            websitestijlen viel hij weg naast de bloemen */}
        <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(12.5), letterSpacing: "0.3em", textTransform: "uppercase", color: kader.kleur.accent }}>
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
            <Regels tekst={namenRegels(d.names)} style={{ fontFamily: letters.namen, fontSize: px(ontwerp === "herfst" || ontwerp === "herfstruit" ? 21 : 30), lineHeight: 1.12, color: kader.kleur.namen }} />
            {datum && (
              <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(10.5), letterSpacing: "0.14em", color: kader.kleur.accent }}>{datum}</div>
            )}
          </D>
        </D>
        {d.location && (
          <Regels
            tekst={d.location}
            style={{ fontFamily: letters.tekst, fontSize: px(12.5), lineHeight: 1.5, letterSpacing: "0.08em", color: kop, marginTop: px(4) }}
          />
        )}
        <div style={{ display: "flex", width: px(30), height: lijn, backgroundColor: `${accent}80`, marginTop: px(10), marginBottom: px(10) }} />
        {d.message && (
          <Regels tekst={d.message} style={{ fontFamily: letters.tekst, fontSize: px(12), lineHeight: 1.55, color: tekst, maxWidth: px(310) }} />
        )}
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
          src={illustratie("/kaart-illustraties/olijf-vierkant.jpg", voorAfbeelding)}
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
          <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(11), letterSpacing: "0.32em", textTransform: "uppercase", color: goud }}>
            {d.heading}
          </div>
          <Regels tekst={d.names} style={{ fontFamily: letters.namen, fontSize: px(40), lineHeight: 1.15, color: groen }} />
          {d.dateText && (
            <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(12), letterSpacing: "0.22em", textTransform: "uppercase", color: goud, textAlign: "center" }}>
              {d.dateText}
            </div>
          )}
          {d.location && (
            <Regels tekst={d.location} style={{ fontFamily: letters.tekst, fontSize: px(11), lineHeight: 1.5, letterSpacing: "0.06em", color: groen, opacity: 0.8 }} />
          )}
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
                <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(grootte), lineHeight: 1, color: kop }}>{w}</div>
              </D>
            )
          })}
          {datum && (
            <div style={{ display: "flex", fontFamily: letters.tekst, fontSize: px(15), fontWeight: 500, letterSpacing: "0.14em", color: kop, marginTop: px(26) }}>
              {datum}
            </div>
          )}
          <Regels
            tekst={d.names}
            style={{ fontFamily: letters.tekst, fontSize: px(14), letterSpacing: "0.16em", color: kop, opacity: 0.8, marginTop: px(10) }}
          />
          {d.location && (
            <Regels
              tekst={d.location}
              style={{ fontFamily: letters.tekst, fontSize: px(12), lineHeight: 1.5, letterSpacing: "0.08em", color: kop, opacity: 0.7, marginTop: px(4), maxWidth: px(260) }}
            />
          )}
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
      <D style={{ ...basis, alignItems: "center", justifyContent: "center", padding: `${px(34)}px ${px(30)}px`, borderRadius: px(22) }}>
        {/* De kop in een boog boven de palm */}
        <D style={{ position: "relative", width: boogB, height: px(215), justifyContent: "center", alignItems: "flex-end" }}>
          {boogLetters({
            tekst: d.heading,
            cx: boogB / 2,
            cy: px(118),
            rx: px(92),
            ry: px(84),
            graden: 150,
            grootte: px(17),
            spatie: 0.08,
            stijl: { fontFamily: letters.kop, color: kop },
          })}
          <D style={{ marginBottom: px(-4) }}>
            <Palm breedte={px(82)} kleur={accent} />
          </D>
        </D>
        {delen ? (
          <D style={{ flexDirection: "column", alignItems: "center", marginTop: px(14) }}>
            <div style={{ display: "flex", fontFamily: letters.namen, fontSize: px(54), lineHeight: 1, color: kop }}>{delen[0]}</div>
            <div style={{ display: "flex", fontFamily: letters.extra, fontSize: px(44), lineHeight: 0.9, color: accent, marginTop: px(-2), marginBottom: px(-2) }}>
              {d.verbinder}
            </div>
            <div style={{ display: "flex", fontFamily: letters.namen, fontSize: px(54), lineHeight: 1, color: kop }}>{delen[1]}</div>
          </D>
        ) : (
          <Regels tekst={d.names} style={{ fontFamily: letters.namen, fontSize: px(46), lineHeight: 1.05, color: kop, marginTop: px(14) }} />
        )}
        {datum && (
          <div style={{ display: "flex", fontFamily: letters.namen, fontSize: px(20), letterSpacing: "0.04em", color: kop, marginTop: px(22) }}>
            {datum}
          </div>
        )}
        {d.message && (
          <Regels
            tekst={d.message}
            style={{ fontFamily: letters.tekst, fontSize: px(12), lineHeight: 1.55, color: tekst, maxWidth: px(270), marginTop: px(12), opacity: 0.9 }}
          />
        )}
      </D>
    )
  }

  // ── Ibiza: palmen en golven in een ovaal, tekst rond het ovaal ────────────
  if (ontwerp === "ibiza") {
    const ow = px(300)
    const oh = px(412)
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
          <Regels tekst={d.names} style={{ fontFamily: letters.namen, fontSize: px(46), lineHeight: 1, color: kop }} />
          {datum && (
            <div style={{ display: "flex", fontFamily: letters.tekst, fontSize: px(12), letterSpacing: "0.22em", color: kop, opacity: 0.85 }}>
              {datum}
            </div>
          )}
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
          <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(76), lineHeight: 0.9, color: wit, textAlign: "center" }}>
            {d.heading}
          </div>
          {datum && (
            <div style={{ display: "flex", fontFamily: letters.tekst, fontSize: px(15), letterSpacing: "0.12em", color: wit, marginTop: px(8) }}>
              {datum}
            </div>
          )}
          <Regels
            tekst={d.names.replace(/\s*\n\s*/g, " ")}
            style={{ fontFamily: letters.tekst, fontSize: px(11), letterSpacing: "0.3em", textTransform: "uppercase", color: wit, opacity: 0.9, marginTop: px(4) }}
          />
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
      <div style={{ display: "flex", fontFamily: letters.tekst, fontSize: px(10), letterSpacing: "0.34em", textTransform: "uppercase", color: label }}>
        {d.heading}
      </div>
      {cijfers ? (
        <D style={{ flexDirection: "column", alignItems: "center", marginTop: px(12), marginBottom: px(8) }}>
          {cijfers.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                fontFamily: letters.kop,
                fontSize: px(86),
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
          <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(30), color: kop, marginTop: px(20), marginBottom: px(10), textAlign: "center" }}>
            {d.dateText}
          </div>
        )
      )}
      <Regels tekst={d.names} style={{ fontFamily: letters.namen, fontSize: px(cijfers ? 36 : 52), lineHeight: 1.1, color: accent }} />
      {d.location && (
        <Regels
          tekst={d.location}
          style={{ fontFamily: letters.tekst, fontSize: px(10.5), lineHeight: 1.6, letterSpacing: "0.14em", textTransform: "uppercase", color: tekst, opacity: 0.85, marginTop: px(8) }}
        />
      )}
      <div style={{ display: "flex", width: px(34), height: lijn, backgroundColor: `${accent}70`, marginTop: px(14), marginBottom: px(14) }} />
      {slot({ tekst, kop, accent })}
    </D>
  )
}
