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
import type { VoorkantLetters } from "@/lib/kaart-ontwerpen"

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
  const m = namen.match(/^(.+?)\s+(&|\+|en|and|et|und|y|e)\s+(.+)$/i)
  return m ? `${m[1]}\n${m[2]} ${m[3]}` : namen
}

/** "M & L", voor in de boog als er geen foto is. */
function initialenVan(namen: string): string {
  const delen = namen
    .split(/\s*(?:&|\+|\n|\ben\b|\band\b|\bet\b|\bund\b|\by\b|\be\b)\s*/i)
    .map((d) => d.trim())
    .filter(Boolean)
  if (delen.length >= 2) return `${delen[0][0]} & ${delen[1][0]}`.toUpperCase()
  return (delen[0]?.[0] ?? "♥").toUpperCase()
}

/** 2027-08-15 wordt ["15", "08", "27"] */
function datumCijfers(iso: string | null | undefined): string[] | null {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? [m[3], m[2], m[1].slice(2)] : null
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
        <div style={{ display: "flex", fontFamily: font, fontSize: px(11), fontWeight: 600, letterSpacing: "0.06em", color: kleur.accent, textAlign: uitlijnen === "center" ? "center" : "left" }}>
          {d.timeText}
        </div>
      )}
    </D>
  )

  // ── Minimaal: veel wit, grote letters, links uitgelijnd ───────────────────
  if (ontwerp === "minimaal") {
    return (
      <D
        style={{
          ...basis,
          justifyContent: "space-between",
          padding: `${px(46)}px ${px(40)}px ${px(40)}px`,
          borderRadius: px(4),
        }}
      >
        <D style={{ flexDirection: "column", gap: px(12) }}>
          <div style={{ display: "flex", fontFamily: letters.kop, fontSize: px(10), letterSpacing: "0.34em", textTransform: "uppercase", color: label }}>
            {d.heading}
          </div>
          <div style={{ display: "flex", width: px(30), height: lijn, backgroundColor: accent }} />
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
