"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import type { SC } from "@/lib/event-styles"
import { CARD_DESIGN_STYLE, type CardDisplay } from "@/lib/cards"

// "zegel" is de stap waarin het lakzegel breekt; die bestaat alleen in de
// nieuwe animatie. De klassieke animatie slaat hem over.
type Stage = "closed" | "zegel" | "flap" | "card" | "open"

// Vaste posities voor de gouden stofjes bij de feestelijke animatie. Bewust
// geen Math.random(): dat zou server en browser verschillende waarden geven.
const STOFJES = [
  { links: 12, vertraging: 0.05, dx: -26, duur: 2.6, maat: 5 },
  { links: 24, vertraging: 0.32, dx: 14, duur: 3.1, maat: 3 },
  { links: 33, vertraging: 0.0, dx: -8, duur: 2.4, maat: 4 },
  { links: 41, vertraging: 0.55, dx: 22, duur: 3.4, maat: 3 },
  { links: 50, vertraging: 0.18, dx: -18, duur: 2.9, maat: 6 },
  { links: 58, vertraging: 0.72, dx: 10, duur: 2.7, maat: 3 },
  { links: 66, vertraging: 0.28, dx: 26, duur: 3.2, maat: 4 },
  { links: 74, vertraging: 0.6, dx: -14, duur: 2.5, maat: 5 },
  { links: 83, vertraging: 0.1, dx: 18, duur: 3.0, maat: 3 },
  { links: 91, vertraging: 0.45, dx: -22, duur: 2.8, maat: 4 },
]

// Tijdlijn van de nieuwe animatie, in milliseconden na de tik. Bewust ruim:
// het zegel mag kraken voordat het valt, en de kaart mag er rustig uit komen.
const T_KLEP = 620
const T_KAART = 1280
const DUUR_KAART = 1500
const T_OPEN = T_KAART + DUUR_KAART

// De kaart is veel hoger dan de envelop, dus hij kan er nooit in passen. Het
// oog kijkt echter naar de afstand tussen de twee: als die over de hele
// animatie precies de kaarthoogte wordt, zie je de kaart eruit komen zonder
// dat er ooit iets zichtbaar wordt dat in de envelop hoort te zitten. Die
// afstand verdelen we: de kaart komt omhoog en de envelop zakt weg.
const KAART_EXTRA_WEG = 60
// Op het laatste stukje laten de klip en de envelop samen los, zodat het een
// overvloeiing is in plaats van een harde rand die ineens verdwijnt
const KLIP_LOS_VANAF = 0.82

function versoepel(p: number): number {
  // Gelijkmatig doorlopen in plaats van meteen wegschieten, met een kleine veer
  // op het eind: de kaart komt een paar pixels te hoog en zakt terug, zoals
  // iets dat je net iets te ver uit een envelop trekt.
  const vloeiend = p * p * (3 - 2 * p)
  const veer = p > 0.55 ? Math.sin(((p - 0.55) / 0.45) * Math.PI) * 0.09 : 0
  return vloeiend + veer
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

// Envelop die opent na een tik, waarna de kaart tevoorschijn komt.
// Volledig CSS-gedreven; kleuren en fonts komen uit het sitethema.
export default function CardReveal({
  display,
  initials,
  sc,
  siteUrl,
  rsvpUrl,
  demo = false,
  previewNotice = false,
  siteVolgt = false,
  startOpen = false,
  watermerk = "geen",
}: {
  display: CardDisplay
  initials: string
  sc: SC
  siteUrl: string | null
  rsvpUrl: string | null
  // Voorbeeldkaart op de marketingsite: geen site-knoppen, wel een CTA
  demo?: boolean
  // Het bruidspaar bekijkt zijn eigen nog niet geactiveerde kaart
  previewNotice?: boolean
  // Er hoort een trouwsite bij dit pakket, maar die staat nog niet live
  siteVolgt?: boolean
  // Voorbeeld in de bouwer: meteen de kaart tonen, zonder envelop
  startOpen?: boolean
  // Watermerkbanen zonder de strook bovenaan. "licht" is voor het voorbeeld in
  // de bouwer: genoeg om misbruik te ontmoedigen, zonder het ontwerp te verpesten.
  watermerk?: "geen" | "licht" | "vol"
}) {
  // Alleen de download en de social-voorvertoning krijgen het volle watermerk;
  // wat het bruidspaar zelf op het scherm ziet blijft licht.
  const banen = watermerk === "vol" ? 7 : previewNotice || watermerk === "licht" ? 3 : 0
  const ds = CARD_DESIGN_STYLE[display.design]
  const [stage, setStage] = useState<Stage>(startOpen ? "open" : "closed")
  const envelopRef = useRef<HTMLButtonElement>(null)
  const kaartRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  )

  // Klassiek slaat het brekende zegel over en laat de kaart eroverheen
  // verschijnen; rustig en feestelijk delen dezelfde beweging.
  const klassiekeAnimatie = display.animatie === "klassiek"

  function open() {
    if (stage !== "closed") return
    if (reduceMotion) {
      setStage("open")
      return
    }
    if (klassiekeAnimatie) {
      setStage("flap")
      setTimeout(() => setStage("card"), 450)
      setTimeout(() => setStage("open"), 1350)
      return
    }
    // Eerst kraakt en valt het zegel, dan gaat de klep open, dan wordt de kaart
    // eruit getrokken. Die laatste stap loopt niet op CSS maar frame voor frame
    // hieronder, omdat de klip precies op de envelopmond moet blijven liggen.
    setStage("zegel")
    setTimeout(() => setStage("flap"), T_KLEP)
    setTimeout(() => setStage("card"), T_KAART)
    setTimeout(() => setStage("open"), T_OPEN)
  }

  // De kaart uit de envelop trekken. De envelop dekt af tot zijn mond; alles
  // van de kaart dat daaronder zit is nog "in" de envelop en wordt geklipt.
  useEffect(() => {
    if (stage !== "card" || klassiekeAnimatie || reduceMotion) return
    const kaart = kaartRef.current
    const envelop = envelopRef.current
    if (!kaart || !envelop) return

    // Opmeten, niet uitrekenen: de envelop staat gecentreerd over de kaart, dus
    // waar zijn mond zit hangt van beide hoogtes af.
    const kr = kaart.getBoundingClientRect()
    const er = envelop.getBoundingClientRect()
    const H = kr.height
    // De lijn waarboven de kaart zichtbaar wordt is de bovenrand van de
    // envelop, niet de vouwlijn: de romp dekt de hele rechthoek af, dus alles
    // wat daarbinnen valt zit voor het oog nog in de envelop.
    const M = er.top - kr.top
    if (H < 40 || M < 10) return
    // De kaart start zijn bovenrand een stuk onder de mond, dus diep "in" de
    // envelop. Hoe dieper, hoe meer de kaart zelf beweegt in plaats van de
    // envelop, en dat leest als trekken in plaats van laten vallen.
    const kaartStart = M + KAART_EXTRA_WEG
    // De envelop zakt precies zo ver dat zijn mond aan het eind onder de
    // onderrand van de kaart ligt. Dan is er nooit ergens gesmokkeld.
    const zakt = Math.max(160, Math.min(900, H - M))
    let frame = 0
    const begin = performance.now()

    const stap = (nu: number) => {
      const p = Math.min(1, (nu - begin) / DUUR_KAART)
      const e = versoepel(p)

      const kaartY = kaartStart * (1 - e)
      // De envelop komt langzaam op gang en zakt daarna door
      const envelopY = zakt * (p < 0.4 ? 0.15 * (p / 0.4) : 0.15 + 0.85 * Math.pow((p - 0.4) / 0.6, 1.25))
      const zichtbaar = M + envelopY - kaartY
      const strikt = Math.max(0, H - zichtbaar)
      const los = p <= KLIP_LOS_VANAF ? 1 : Math.pow(1 - (p - KLIP_LOS_VANAF) / (1 - KLIP_LOS_VANAF), 1.4)

      kaart.style.transform = `translateY(${kaartY.toFixed(1)}px)`
      kaart.style.clipPath = `inset(0px 0px ${(strikt * los).toFixed(1)}px 0px)`
      kaart.style.opacity = "1"

      envelop.style.transform = `translateY(${envelopY.toFixed(1)}px)`
      // De envelop blijft lang volledig zichtbaar: hij is het deksel dat de
      // kaart afdekt. Pas op het eind lost hij op.
      envelop.style.opacity = p < 0.75 ? "1" : String(Math.max(0, 1 - Math.pow((p - 0.75) / 0.25, 2.5)))

      if (p < 1) {
        frame = requestAnimationFrame(stap)
        return
      }
      // Klaar: alles wat we hier hebben gezet weer weghalen, anders blijft het
      // op het element staan als de kaart gewoon in de pagina komt te staan
      kaart.style.transform = ""
      kaart.style.clipPath = ""
      kaart.style.opacity = ""
    }

    frame = requestAnimationFrame(stap)
    return () => cancelAnimationFrame(frame)
  }, [stage, klassiekeAnimatie, reduceMotion])

  const cardVisible = stage === "card" || stage === "open"
  const envelopeGone = stage === "card" || stage === "open"
  // Het zegel breekt zodra er getikt is; de klep wacht tot dat gebeurd is
  const zegelHeel = stage === "closed"
  const klepDicht = stage === "closed" || (!klassiekeAnimatie && stage === "zegel")
  const stofjesAan = stage === "open" && display.animatie === "feestelijk" && !reduceMotion

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        background: sc.bodyBackground ?? sc.bodyBg,
        fontFamily: sc.fontFamily,
        letterSpacing: sc.bodyLetterSpacing,
      }}
    >
      {sc.fontImport && <style>{sc.fontImport}</style>}
      {previewNotice && (
        <div
          className="fixed top-0 left-0 right-0 z-50 px-4 py-2.5 text-center text-xs font-semibold"
          style={{ backgroundColor: "#1A1A1A", color: "#FAF7F2", letterSpacing: "0.02em" }}
        >
          Voorbeeld, alleen voor jullie zichtbaar. Activeer je pakket om deze kaart te kunnen versturen.
        </div>
      )}
      {banen > 0 && (
        /* Watermerk over de hele kaart, zodat een schermafbeelding ook niet als
           echte kaart te gebruiken is. Absoluut binnen deze container, dus het
           werkt ook als de kaart in een paneel of overlay staat. */
        <div
          aria-hidden="true"
          className="absolute inset-0 z-40 flex flex-col justify-around items-center"
          style={{ pointerEvents: "none", overflow: "hidden" }}
        >
          {Array.from({ length: banen }, (_, i) => (
            <span
              key={i}
              className={banen > 3 ? "text-xl sm:text-3xl font-semibold whitespace-nowrap" : "text-sm sm:text-lg font-semibold whitespace-nowrap"}
              style={{
                transform: "rotate(-28deg)",
                color: "#111",
                opacity: banen > 3 ? 0.13 : 0.055,
                letterSpacing: "0.35em",
              }}
            >
              VOORBEELD · SAYINGYES
            </span>
          ))}
        </div>
      )}
      <style>{`
        @keyframes kaart-zweef {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes kaart-fadein {
          from { opacity: 0; transform: translateY(24px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Het zegel kraakt eerst een paar millimeter open en valt dan pas weg.
           De eerste twee stappen duren samen bijna de helft van de tijd, want
           dat kraken is het moment waar je naar kijkt. */
        @keyframes zegel-links {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          22%  { transform: translate(-2px, -1px) rotate(-2deg); opacity: 1; }
          42%  { transform: translate(-5px, 2px) rotate(-6deg); opacity: 1; }
          100% { transform: translate(-24px, 44px) rotate(-38deg); opacity: 0; }
        }
        @keyframes zegel-rechts {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          22%  { transform: translate(2px, -1px) rotate(2deg); opacity: 1; }
          42%  { transform: translate(5px, 2px) rotate(6deg); opacity: 1; }
          100% { transform: translate(24px, 44px) rotate(38deg); opacity: 0; }
        }
        @keyframes knoppen-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Gouden stofjes, eenmalig omhoog */
        @keyframes stofje {
          0%   { opacity: 0; transform: translate(0, 20px) scale(0.5); }
          18%  { opacity: 0.85; }
          100% { opacity: 0; transform: translate(var(--dx), -190px) scale(1.1); }
        }
      `}</style>

      {stofjesAan && (
        <div aria-hidden="true" className="absolute inset-0 z-30" style={{ pointerEvents: "none", overflow: "hidden" }}>
          {STOFJES.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${s.links}%`,
                bottom: "22%",
                width: s.maat,
                height: s.maat,
                backgroundColor: sc.accent,
                // @ts-expect-error eigen CSS-variabele voor de zijwaartse drift
                "--dx": `${s.dx}px`,
                animation: `stofje ${s.duur}s ease-out ${s.vertraging}s both`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative w-full max-w-md flex flex-col items-center">

        {/* ── Envelop ──────────────────────────────────────────────────────── */}
        {/* Absoluut over de kaart heen, zodat de kaart vanaf het begin zijn
            plek in de pagina inneemt. Anders verspringt alles op het moment
            dat de envelop weggaat, precies als de kaart moet landen. */}
        {stage !== "open" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 2, pointerEvents: "none" }}
          >
          <button
            ref={envelopRef}
            onClick={open}
            aria-label="Open de envelop"
            className="relative block outline-none"
            style={{
              // Breder dan de kaart (max 420), anders steekt de kaart aan de
              // zijkanten uit en lijkt het nooit alsof hij in de envelop zit
              width: "min(460px, calc(100vw - 12px))",
              aspectRatio: "17/12",
              cursor: stage === "closed" ? "pointer" : "default",
              background: "none",
              border: "none",
              padding: 0,
              pointerEvents: stage === "closed" ? "auto" : "none",
              animation: stage === "closed" ? "kaart-zweef 3s ease-in-out infinite" : "none",
              // Bij de nieuwe animatie staat de envelop stil tot de kaart eruit
              // komt; vanaf dat moment zetten transform en opacity per frame
              // (zie het effect hierboven), dus hier geen transition die
              // ertegenin werkt.
              ...(klassiekeAnimatie
                ? {
                    opacity: envelopeGone ? 0 : 1,
                    transform: envelopeGone ? "translateY(70px) scale(0.92)" : "none",
                    transition: "opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s",
                  }
                : {}),
              // De envelop dekt de onderkant van de kaart af tijdens het
              // uitschuiven; zonder deze z-index zou de kaart eroverheen liggen.
              zIndex: 2,
            }}
          >
            {/* Romp */}
            <span
              className="absolute inset-0 rounded-2xl"
              style={{
                backgroundColor: sc.cardBg ?? sc.navBg,
                border: `1.5px solid ${sc.accent}50`,
                boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
              }}
            />
            {/* Vouwlijnen onderin (de "zak" van de envelop) */}
            <span
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{ border: "1px solid transparent" }}
            >
              <span
                className="absolute"
                style={{
                  left: -2, right: -2, bottom: -2, height: "72%",
                  background: `linear-gradient(135deg, transparent 49.6%, ${sc.accent}18 50%), linear-gradient(-135deg, transparent 49.6%, ${sc.accent}18 50%)`,
                }}
              />
            </span>
            {/* Klep */}
            <span
              className="absolute left-0 right-0 top-0"
              style={{
                height: "58%",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                backgroundColor: sc.cardBg ?? sc.navBg,
                filter: "brightness(0.96)",
                borderRadius: "16px 16px 0 0",
                boxShadow: `inset 0 -1px 0 ${sc.accent}40`,
                transformOrigin: "top center",
                transform: klepDicht ? "rotateX(0deg)" : "rotateX(180deg)",
                transition: klassiekeAnimatie ? "transform 0.55s ease" : "transform 0.72s cubic-bezier(0.35, 0, 0.3, 1)",
                zIndex: 2,
              }}
            />
            {/* Zegel met initialen. Bij de nieuwe animatie bestaat het uit twee
                helften die wegkantelen, zodat het zegel echt breekt in plaats
                van dat de klep er dwars door heen klapt. Elke helft toont de
                volledige initialen en knipt de andere helft weg, zodat ze
                samen naadloos één zegel vormen. */}
            {(klassiekeAnimatie ? [0] : [0, 1]).map((helft) => (
              <span
                key={helft}
                className="absolute left-1/2 flex items-center justify-center rounded-full"
                style={{
                  top: "44%",
                  width: 62,
                  height: 62,
                  marginLeft: -31,
                  backgroundColor: sc.accent,
                  color: sc.buttonText,
                  fontFamily: sc.fontInitials ?? sc.fontPageTitles,
                  fontSize: "1.35rem",
                  boxShadow: "0 3px 12px rgba(0,0,0,0.22)",
                  zIndex: 3,
                  clipPath: klassiekeAnimatie
                    ? undefined
                    : helft === 0
                      ? "inset(0 50% 0 0)"
                      : "inset(0 0 0 50%)",
                  ...(klassiekeAnimatie
                    ? {
                        opacity: zegelHeel ? 1 : 0,
                        transform: zegelHeel ? "none" : "scale(0.6)",
                        transition: "opacity 0.3s ease, transform 0.3s ease",
                      }
                    : {
                        // Het kraken en vallen zit in de keyframes, zodat het
                        // twee bewegingen zijn in plaats van één sprong
                        animation: zegelHeel
                          ? "none"
                          : `${helft === 0 ? "zegel-links" : "zegel-rechts"} 0.95s ease-in both`,
                      }),
                }}
              >
                {initials || "♥"}
              </span>
            ))}
          </button>
          {stage === "closed" && (
            <p
              className="mt-6 text-sm"
              style={{ color: sc.bodyText, opacity: 0.75 }}
            >
              Er is post voor je, tik op de envelop 💌
            </p>
          )}
          </div>
        )}

        {/* ── De kaart ─────────────────────────────────────────────────────── */}
        {/* Staat er altijd, ook onzichtbaar, zodat de pagina niet verspringt */}
        {(cardVisible || !klassiekeAnimatie) && (
          <div
            ref={kaartRef}
            className={stage === "open" || !klassiekeAnimatie ? "" : "absolute top-0"}
            style={{
              width: "100%",
              maxWidth: 420,
              // Onder de envelop, zodat die de onderkant afdekt terwijl de
              // kaart naar boven uit de envelop komt
              zIndex: 1,
              // De nieuwe animatie loopt frame voor frame in het effect
              // hierboven; tot die begint houden we de kaart onzichtbaar
              transformOrigin: "top center",
              ...(reduceMotion || stage === "open"
                ? {}
                : klassiekeAnimatie
                  ? { animation: "kaart-fadein 0.8s ease 0.15s both" }
                  : { opacity: cardVisible ? 1 : 0, visibility: cardVisible ? "visible" : "hidden" }),
            }}
          >
            <div
              className="overflow-hidden"
              style={{
                backgroundColor: sc.cardBg ?? "#FFFEFB",
                border: sc.goldBorder ? `2px solid ${sc.accent}` : `1px solid ${sc.accent}45`,
                borderRadius: ds.hoekRadius,
                boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
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
                    fontSize: `${2.4 * ds.namenSchaal}rem`,
                    letterSpacing: ds.namenSpatiering,
                    margin: "6px 0",
                  }}
                >
                  {display.names}
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
                  <p className="text-sm" style={{ color: sc.cardText ?? sc.bodyText, opacity: 0.85, margin: 0 }}>
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
                    style={{ color: sc.accent, margin: 0, letterSpacing: "0.03em" }}
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

            {/* Demo op de marketingsite: CTA in plaats van site-knoppen */}
            {stage === "open" && demo && (
              <a
                href="/kaart-maken?type=trouwkaart"
                className="mt-6 block py-3.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: sc.accent,
                  color: sc.buttonText,
                  textDecoration: "none",
                  animation: reduceMotion ? "none" : "knoppen-fadein 0.5s ease 0.5s both",
                }}
              >
                Zelf zo&apos;n kaart maken? Begin gratis →
              </a>
            )}

            {/* Site hoort bij het pakket maar staat nog niet live: vooruitblik */}
            {stage === "open" && siteVolgt && !demo && (
              <p
                className="mt-6 text-center text-sm"
                style={{
                  color: sc.bodyText,
                  opacity: 0.7,
                  animation: reduceMotion ? "none" : "knoppen-fadein 0.5s ease 0.5s both",
                }}
              >
                Meer informatie volgt binnenkort 🤍
              </p>
            )}

            {/* Knoppen naar de trouwsite */}
            {stage === "open" && (siteUrl || rsvpUrl) && (
              <div
                className="mt-6 flex flex-col sm:flex-row gap-3"
                style={{ animation: reduceMotion ? "none" : "knoppen-fadein 0.5s ease 0.5s both" }}
              >
                {rsvpUrl && (
                  <a
                    href={rsvpUrl}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85"
                    style={{ backgroundColor: sc.accent, color: sc.buttonText, textDecoration: "none" }}
                  >
                    Laat weten of je erbij bent
                  </a>
                )}
                {siteUrl && (
                  <a
                    href={siteUrl}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85"
                    style={{
                      backgroundColor: "transparent",
                      color: sc.headingColor,
                      border: `1.5px solid ${sc.accent}`,
                      textDecoration: "none",
                    }}
                  >
                    Bekijk onze trouwsite
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Groeimotor */}
      {stage === "open" && (
        <a
          href="https://www.sayingyes.nl"
          className="mt-10 text-xs"
          style={{
            color: sc.bodyText,
            opacity: 0.55,
            textDecoration: "none",
            animation: reduceMotion ? "none" : "knoppen-fadein 0.5s ease 0.8s both",
          }}
        >
          Gemaakt met <span style={{ fontWeight: 600, color: sc.accent }}>SayingYes</span> · sayingyes.nl
        </a>
      )}
    </div>
  )
}
