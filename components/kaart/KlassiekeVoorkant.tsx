// De voorkant van de drie eerste ontwerpen: Strak, Sierlijk en Bohemian.
//
// Letterlijk verhuisd uit app/kaart/[token]/card-reveal.tsx op 25 september
// 2026, zodat hij ook als miniatuur in de galerij van de kaartbouwer kan
// staan. Er is niets aan veranderd: deze kaarten moeten er precies zo uit
// blijven zien. De nieuwe ontwerpen staan in KaartVoorkant.tsx.

import { CARD_DESIGN_STYLE, type CardDisplay, type KlassiekOntwerp } from "@/lib/cards"
import type { SC } from "@/lib/event-styles"
import { namenOpmaak } from "@/lib/namen-opmaak"

export default function KlassiekeVoorkant({
  display,
  sc,
  vullen,
  breedte,
}: {
  display: CardDisplay
  sc: SC
  /**
   * Hoe breed de kaart is, in pixels, zodat de namen op één regel kunnen
   * als ze passen. Het enige dat hier sinds de verhuizing bij is gekomen
   * (Michiel, 26 september 2026): eerst bleef de & achter de eerste naam
   * hangen.
   */
  breedte?: number
  /**
   * Alleen voor de galerij: minstens deze hoogte, met de inhoud in het
   * midden, zodat elke miniatuur zijn vakje vult. De echte kaart laat dit weg
   * en blijft precies zoals hij was.
   */
  vullen?: number
}) {
  const ds = CARD_DESIGN_STYLE[display.design as KlassiekOntwerp] ?? CARD_DESIGN_STYLE.klassiek
  // De ruimte voor de namen: de kaart min de rand, de binnenrand (px-8) en
  // bij Sierlijk het tweede lijntje
  const namenGrootte = 2.4 * ds.namenSchaal * 16
  const namen = breedte
    ? namenOpmaak(
        display.names,
        { google: ds.namenFontImage.family, gewicht: ds.namenFontImage.weight },
        namenGrootte,
        breedte - 4 - 64 - (ds.dubbeleRand ? 22 : 0),
        { letterafstand: ds.namenSpatiering ? parseFloat(ds.namenSpatiering) : 0 }
      )
    : { tekst: display.names, grootte: namenGrootte, heel: false }
  return (
    <div
      className="overflow-hidden"
      style={{
        ...(vullen ? { minHeight: vullen, display: "flex", flexDirection: "column", justifyContent: "center" } : {}),
        backgroundColor: sc.cardBg ?? "#FFFEFB",
        border: sc.goldBorder ? `2px solid ${sc.accent}` : `1px solid ${sc.accent}45`,
        borderRadius: ds.hoekRadius,
        // De schaduw mag niet om de hoeken heen krullen. Een gewone
        // wijde schaduw maakt de uitsparing naast de afronding donker,
        // en omdat de achtergrond bijna dezelfde kleur heeft als de
        // kaart leest de hoek dan als vierkant. Met een negatieve
        // spread valt de schaduw alleen onder de kaart, en een heel dun
        // lichtrandje volgt de afronding wel, zodat de vorm klopt.
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 26px 50px -26px rgba(0,0,0,0.5)",
      }}
    >
      {/* Fototemplate: foto bovenin */}
      {display.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={display.photoUrl}
          alt=""
          style={{ width: "100%", aspectRatio: "5/3", objectFit: "cover", display: "block" }}
        />
      )}

      <div
        className="px-8 py-9 flex flex-col items-center text-center gap-4"
        // Sierlijk ontwerp: een dun tweede lijntje binnen de rand
        style={ds.dubbeleRand ? { margin: 10, border: `1px solid ${sc.accent}40`, borderRadius: Math.max(4, ds.hoekRadius - 12) } : undefined}
      >
        {/* Binnenkader */}
        <p
          className="text-xs font-semibold uppercase"
          style={{ color: sc.labelColor, letterSpacing: ds.kopSpatiering, fontFamily: ds.kopFont }}
        >
          {display.heading}
        </p>

        {/* Ornament: verschilt per ontwerp. Alle drie zijn precies
            symmetrisch rond x=80, zodat het midden ook echt het
            midden is. */}
        {ds.ornament === "krul" ? (
          <svg width="170" height="21" viewBox="0 0 160 20" fill="none" stroke={sc.accent} strokeWidth="1.15" strokeLinecap="round" aria-hidden="true">
            {/* Twee gespiegelde zwaaien die naar het midden toe uitlopen */}
            <path d="M18 14C30 4 44 4 56 10c8 4 14 4 20 1" opacity="0.85" />
            <path d="M142 14C130 4 116 4 104 10c-8 4-14 4-20 1" opacity="0.85" />
            <circle cx="18" cy="14" r="1.4" fill={sc.accent} stroke="none" opacity="0.65" />
            <circle cx="142" cy="14" r="1.4" fill={sc.accent} stroke="none" opacity="0.65" />
            <path d="M80 8l2.6 2.5L80 13l-2.6-2.5z" fill={sc.accent} stroke="none" />
          </svg>
        ) : ds.ornament === "takje" ? (
          <svg width="190" height="40" viewBox="0 0 160 34" fill="none" aria-hidden="true">
            {/* Twee gespiegelde takken met drie blaadjes elk, geen
                lijntjes eromheen: dit mag het botanische element zijn */}
            <path d="M80 20C66 20 52 22 34 27" stroke={sc.accent} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
            <path d="M80 20C94 20 108 22 126 27" stroke={sc.accent} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
            <path d="M72 20.5C68 12.5 60 9.5 56 12.5C60 18.5 68 19.5 72 20.5Z" fill={`${sc.accent}5C`} />
            <path d="M58 22C54 14 46 11 42 14C46 20 54 21 58 22Z" fill={`${sc.accent}50`} />
            <path d="M44 24.5C40 16.5 32 13.5 28 16.5C32 22.5 40 23.5 44 24.5Z" fill={`${sc.accent}44`} />
            <path d="M88 20.5C92 12.5 100 9.5 104 12.5C100 18.5 92 19.5 88 20.5Z" fill={`${sc.accent}5C`} />
            <path d="M102 22C106 14 114 11 118 14C114 20 106 21 102 22Z" fill={`${sc.accent}50`} />
            <path d="M116 24.5C120 16.5 128 13.5 132 16.5C128 22.5 120 23.5 116 24.5Z" fill={`${sc.accent}44`} />
            <circle cx="80" cy="19" r="1.8" fill={sc.accent} />
          </svg>
        ) : (
          <div className="flex items-center gap-2.5 w-full max-w-[230px]">
            <div className="flex-1 flex flex-col" style={{ gap: 3 }}>
              <div style={{ height: 1, backgroundColor: `${sc.accent}70` }} />
              <div style={{ height: 1, backgroundColor: `${sc.accent}38` }} />
            </div>
            <svg width="8" height="8" viewBox="0 0 8 8" fill={sc.accent} aria-hidden="true"><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
            <div className="flex-1 flex flex-col" style={{ gap: 3 }}>
              <div style={{ height: 1, backgroundColor: `${sc.accent}70` }} />
              <div style={{ height: 1, backgroundColor: `${sc.accent}38` }} />
            </div>
          </div>
        )}

        <p
          className="notranslate leading-tight"
          style={{
            fontFamily: ds.namenFont,
            color: sc.cardText ?? sc.headingColor,
            fontSize: namen.grootte,
            letterSpacing: ds.namenSpatiering,
            margin: "6px 0",
            // Een bruidspaar mag de tweede naam op een eigen regel
            // zetten; dan hoort die enter ook op de kaart te staan.
            // pre: de regels zoals uitgerekend, zonder dat de browser zelf
            // nog eens afbreekt
            whiteSpace: namen.heel ? "pre" : "pre-line",
          }}
        >
          {namen.tekst}
        </p>

        {display.dateText && (
          /* De datum volgt het ontwerp: stevig, in serif of luchtig gespatieerd */
          <p
            className={
              ds.datumStijl === "serif"
                ? "text-xl"
                : ds.datumStijl === "licht"
                  ? "text-base"
                  : "text-lg font-semibold"
            }
            style={{
              color: sc.accent,
              margin: 0,
              fontFamily: ds.datumStijl === "serif" ? ds.kopFont : undefined,
              letterSpacing: ds.datumStijl === "licht" ? "0.14em" : "0.04em",
            }}
          >
            {display.dateText}
          </p>
        )}

        {display.location && (
          <p className="text-sm" style={{ color: sc.cardText ?? sc.bodyText, opacity: 0.85, margin: 0, whiteSpace: "pre-line" }}>
            {display.location}
          </p>
        )}

        <div className="w-10 h-px my-1" style={{ backgroundColor: `${sc.accent}60` }} />

        <p
          className="text-sm italic leading-relaxed"
          // pre-line: witregels die het bruidspaar in de boodschap zet
          // horen ook op de kaart te staan
          style={{ color: sc.cardText ?? sc.bodyText, opacity: 0.9, margin: 0, whiteSpace: "pre-line" }}
        >
          {display.message}
        </p>

        {display.inviteLine && (
          <p
            className="text-sm font-semibold leading-relaxed"
            style={{ color: sc.cardText ?? sc.headingColor, margin: 0 }}
          >
            {display.inviteLine}
          </p>
        )}

        {display.timeText && (
          <p
            className="text-sm font-semibold"
            style={{ color: sc.accent, margin: 0, letterSpacing: "0.03em", whiteSpace: "pre-line" }}
          >
            {display.timeText}
          </p>
        )}

        {/* Afsluiter onderaan, past bij het ontwerp: hartje bij strak,
            een ampersand in hetzelfde handschrift bij sierlijk en een
            klein takje bij bohemian */}
        {ds.slot === "sierlijkhart" ? (
          /* Open hartje in dunne lijn, met een zwaaitje aan elke kant */
          <svg width="52" height="24" viewBox="0 0 48 22" fill="none" aria-hidden="true" style={{ marginTop: 4, opacity: 0.9 }}>
            <path
              d="M24 18.6C19.2 14.7 15.8 11.9 15.8 8.9c0-2.3 1.8-4 4-4 1.6 0 3.2.9 4.2 2.5 1-1.6 2.6-2.5 4.2-2.5 2.2 0 4 1.7 4 4 0 3-3.4 5.8-8.2 9.7Z"
              stroke={sc.accent}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M13.5 10.5C10.5 9 7.5 9.3 4.5 11.1" stroke={sc.accent} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
            <path d="M34.5 10.5C37.5 9 40.5 9.3 43.5 11.1" stroke={sc.accent} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
          </svg>
        ) : ds.slot === "blaadjeshart" ? (
          /* Vol hartje met twee blaadjes aan de punt, zelfde motief als
             het takje bovenaan */
          <svg width="42" height="32" viewBox="0 0 34 26" fill="none" aria-hidden="true" style={{ marginTop: 4, opacity: 0.9 }}>
            <path d="M17 21.4c-4.4 1.5-9 .8-12-2.2 3.9-1.6 8.3-.9 12 2.2Z" fill={`${sc.accent}8C`} />
            <path d="M17 21.4c4.4 1.5 9 .8 12-2.2-3.9-1.6-8.3-.9-12 2.2Z" fill={`${sc.accent}8C`} />
            <path
              d="M17 21.2C11.2 16.5 7.5 13.4 7.5 9.9 7.5 7.1 9.7 5 12.4 5c1.8 0 3.5 1 4.6 2.7C18.1 6 19.8 5 21.6 5c2.7 0 4.9 2.1 4.9 4.9 0 3.5-3.7 6.6-9.5 11.3Z"
              fill={sc.accent}
            />
          </svg>
        ) : (
          <svg
            width="18"
            height="16"
            viewBox="0 0 24 22"
            fill={sc.accent}
            aria-hidden="true"
            style={{ marginTop: 4, opacity: 0.9 }}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        )}
      </div>
    </div>
  )
}
