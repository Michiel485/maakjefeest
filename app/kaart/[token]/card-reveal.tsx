"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import type { SC } from "@/lib/event-styles"
import type { CardDisplay } from "@/lib/cards"
import Voorkant from "@/components/kaart/Voorkant"
import { envelopStijl } from "@/lib/kaart-envelop"
import AanmeldFormulier from "@/components/AanmeldFormulier"
import type { AanmeldStand } from "@/lib/gasten"
import { formulierTekst } from "@/lib/formulier-teksten"

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

// Waar de V van de voorkant samenkomt, in procenten van de envelophoogte. De
// klep is precies die driehoek, dus dicht sluit de envelop naadloos.
const ENVELOP_V_PUNT = 50

// Hoe diep de kaart in de envelop zit als de klep opengaat: de bovenrand van
// de kaart staat op dit deel van de envelophoogte, dus je ziet hem meteen in
// de V zitten.
const KAART_IN_ENVELOP = 0.14

// Hoeveel de dichte envelop op en neer zweeft. De klip op de kaart houdt hier
// rekening mee, anders komt bij de hoogste stand een randje kaart onder de
// envelop uit.
const ENVELOP_ZWEEF = 4

// Hoe lang de klep erover doet om open te klappen. Halverwege staat hij recht
// overeind en gaat hij achter de kaart langs; daarvoor hoort hij ervoor.
const DUUR_KLEP = 720

function versoepel(p: number): number {
  // Gelijkmatig doorlopen in plaats van meteen wegschieten.
  // Alleen vloeiend, zonder veer. Een veertje aan het eind schoot de kaart nog
  // een paar pixels omhoog en dat leest als een hapering, niet als een veer.
  return p * p * (3 - 2 * p)
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
  agendaUrl = null,
  agendaVoorbeeld = false,
  aanmeldVoorbeeld = null,
  aanmeldStand = "geen",
  bronToken = null,
  demo = false,
  previewNotice = false,
  siteVolgt = false,
  startOpen = false,
  compact = false,
  watermerk = "geen",
}: {
  display: CardDisplay
  initials: string
  sc: SC
  siteUrl: string | null
  rsvpUrl: string | null
  // Het agendabestand met de trouwdatum, voor in de agenda van de gast
  agendaUrl?: string | null
  /**
   * De agendaknop tonen zonder dat er al een link is: in de bouwer, zolang de
   * kaart nog niet bewaard is. Hij ziet er dan hetzelfde uit, maar doet niets.
   */
  agendaVoorbeeld?: boolean
  /**
   * Het aanmeldformulier zoals de bouwer het laat zien: zonder kaartlink,
   * dus zonder echte verzending. Komt op dezelfde plek als het echte
   * formulier, zodat de demo klopt met wat de gast straks ziet.
   */
  aanmeldVoorbeeld?: React.ReactNode
  // Of er onder de kaart om een aanmelding wordt gevraagd, en hoeveel
  aanmeldStand?: AanmeldStand
  // De kaartlink, zodat een aanmelding weet uit welke gastengroep hij komt
  bronToken?: string | null
  // Voorbeeldkaart op de marketingsite: geen site-knoppen, wel een CTA
  demo?: boolean
  // Het bruidspaar bekijkt zijn eigen nog niet geactiveerde kaart
  previewNotice?: boolean
  // Er hoort een trouwsite bij dit pakket, maar die staat nog niet live
  siteVolgt?: boolean
  // Voorbeeld in de bouwer: meteen de kaart tonen, zonder envelop
  startOpen?: boolean
  /**
   * Alleen zo hoog als de kaart zelf. De gewone kaartpagina vult het scherm,
   * want daar is de kaart het enige dat er is. In het voorbeeld in de bouwer
   * gaf dat een halve schermhoogte lucht boven en onder de kaart.
   */
  compact?: boolean
  // Watermerkbanen zonder de strook bovenaan. "licht" is voor het voorbeeld in
  // de bouwer: genoeg om misbruik te ontmoedigen, zonder het ontwerp te verpesten.
  watermerk?: "geen" | "licht" | "vol"
}) {
  // Alleen de download en de social-voorvertoning krijgen het volle watermerk;
  // wat het bruidspaar zelf op het scherm ziet blijft licht.
  const banen = watermerk === "vol" ? 7 : previewNotice || watermerk === "licht" ? 3 : 0
  // Hoe breed de kaart op dit scherm is. De nieuwe ontwerpen rekenen in
  // pixels (zodat de afbeelding er precies zo uitziet), dus die moeten het weten.
  const [kaartBreedte, setKaartBreedte] = useState(400)
  const [stage, setStage] = useState<Stage>(startOpen ? "open" : "closed")
  // De klep ligt vóór de kaart tot hij halverwege het openklappen is
  const [klepVoorKaart, setKlepVoorKaart] = useState(true)
  // De envelop bestaat uit drie lagen rond de kaart, dus drie refs
  const envelopAchterRef = useRef<HTMLButtonElement>(null)
  const envelopKlepRef = useRef<HTMLDivElement>(null)
  const envelopVoorRef = useRef<HTMLDivElement>(null)
  const kaartRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = kaartRef.current
    if (!el) return
    // Een ResizeObserver meldt zich ook meteen bij het begin
    const ro = new ResizeObserver(() => setKaartBreedte(Math.max(240, Math.round(el.clientWidth))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
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
    setTimeout(() => setKlepVoorKaart(false), T_KLEP + DUUR_KLEP / 2)
    setTimeout(() => setStage("card"), T_KAART)
    setTimeout(() => setStage("open"), T_OPEN)
  }

  // De kaart zit vanaf het begin in de envelop en wordt er daarna uit
  // getrokken. De voorkant van de envelop dekt de kaart zelf af tot aan de V,
  // dus de klip hoeft alleen te verbergen wat ónder de envelop uitkomt.
  useEffect(() => {
    if (klassiekeAnimatie || reduceMotion || stage === "open") return
    const kaart = kaartRef.current
    const achter = envelopAchterRef.current
    const klep = envelopKlepRef.current
    const voor = envelopVoorRef.current
    if (!kaart || !achter || !klep || !voor) return

    interface Maten {
      H: number
      onder: number
      kaartStart: number
      zakt: number
    }

    // Opmeten, niet uitrekenen: de envelop staat gecentreerd over de kaart, dus
    // waar zijn randen liggen hangt van beide hoogtes af.
    function meet(): Maten | null {
      // Eerst onze eigen verschuivingen weghalen. getBoundingClientRect geeft
      // de positie ná de transform, dus anders rekent een tweede meting de
      // vorige verschuiving mee. Dit gebeurt binnen één taak, dus er wordt
      // niets getekend en je ziet er niets van.
      for (const el of [kaart, achter, klep, voor]) el!.style.transform = ""

      const kr = kaart!.getBoundingClientRect()
      const er = achter!.getBoundingClientRect()
      const H = kr.height
      // Bovenrand en onderrand van de envelop, gemeten vanaf de kaartbovenkant
      const boven = er.top - kr.top
      const onder = er.bottom - kr.top
      if (H < 40 || onder < 40) return null
      return {
        H,
        // De onderrand van de envelop, met de zweefruimte eraf: anders piept er
        // bij de hoogste stand van het zweven een randje kaart onderuit.
        onder: onder - ENVELOP_ZWEEF,
        // De kaart zit in de envelop: bovenrand een stukje onder de
        // envelopbovenkant, zodat hij meteen in de V zichtbaar is als de klep
        // opengaat.
        kaartStart: boven + er.height * KAART_IN_ENVELOP,
        // De envelop zakt tot zijn bovenrand onder de onderkant van de kaart
        // ligt. Pas dan dekt hij niets meer af en is de kaart helemaal vrij.
        zakt: Math.max(160, Math.min(1000, H - boven)),
      }
    }

    // Eén beeld op een gegeven moment in de beweging. p = 0 is "in de envelop".
    function beeld(m: Maten, p: number) {
      const e = versoepel(p)
      const kaartY = m.kaartStart * (1 - e)
      // De envelop komt langzaam op gang en zakt daarna door
      const envelopY = m.zakt * (p < 0.4 ? 0.15 * (p / 0.4) : 0.15 + 0.85 * Math.pow((p - 0.4) / 0.6, 1.25))
      const verborgen = Math.max(0, m.H - (m.onder + envelopY - kaartY))

      kaart!.style.transform = `translateY(${kaartY.toFixed(1)}px)`
      kaart!.style.clipPath = `inset(0px 0px ${verborgen.toFixed(1)}px 0px)`
      kaart!.style.opacity = "1"

      const envelopT = `translateY(${envelopY.toFixed(1)}px)`
      achter!.style.transform = envelopT
      klep!.style.transform = envelopT
      voor!.style.transform = envelopT
      // De envelop blijft lang volledig zichtbaar: hij dekt de kaart af.
      // Pas aan het eind lost hij op.
      const envelopO = p < 0.75 ? "1" : String(Math.max(0, 1 - Math.pow((p - 0.75) / 0.25, 2.5)))
      achter!.style.opacity = envelopO
      klep!.style.opacity = envelopO
      voor!.style.opacity = envelopO
    }

    // Nog niet getikt of nog aan het openen: de kaart ligt stil in de envelop.
    // Opnieuw neerzetten zodra de maten veranderen, want een lettertype dat
    // inlaadt of een ander schermformaat maakt de kaart hoger of lager. Zonder
    // dit staat de kaart op een plek die is uitgerekend met oude maten, en
    // springt hij bij de tik alsnog even op de verkeerde plek.
    if (stage !== "card") {
      const plaats = () => {
        const m = meet()
        if (m) beeld(m, 0)
      }
      plaats()
      const ro = new ResizeObserver(plaats)
      ro.observe(kaart)
      ro.observe(achter)
      return () => ro.disconnect()
    }

    const maten = meet()
    if (!maten) return

    let frame = 0
    const begin = performance.now()
    const stap = (nu: number) => {
      const p = Math.min(1, (nu - begin) / DUUR_KAART)
      beeld(maten, p)
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
    return () => {
      cancelAnimationFrame(frame)
      // Wordt de animatie onderbroken, bijvoorbeeld omdat de kaart in de
      // bouwer opnieuw tekent terwijl hij nog opengaat, dan bleef de
      // clip-path van het laatste beeld op het element staan. Je zag dan een
      // kaart met een afgesneden schaduw en vierkante onderhoeken, en alleen
      // soms, afhankelijk van het moment. Hier dus altijd opruimen.
      kaart.style.transform = ""
      kaart.style.clipPath = ""
      kaart.style.opacity = ""
    }
  }, [stage, klassiekeAnimatie, reduceMotion])
  const cardVisible = stage === "card" || stage === "open"
  const envelopeGone = stage === "card" || stage === "open"
  // Het zegel breekt zodra er getikt is; de klep wacht tot dat gebeurd is
  const zegelHeel = stage === "closed"
  const klepDicht = stage === "closed" || (!klassiekeAnimatie && stage === "zegel")
  // Kleur, voering en zegel van de envelop. De voering zie je aan de binnenkant
  // van de klep, vanaf het moment dat die halverwege is, en achter de kaart.
  const env = envelopStijl(sc, display.envelop)
  const klepBinnen = klassiekeAnimatie ? !klepDicht : !klepVoorKaart
  // De dichte envelop zweeft. Loopt door tot de kaart gaat bewegen, want de
  // envelop staat tot dan toch stil; daarna neemt het rekenwerk de transform
  // over en zou een lopende animatie ertegenin werken.
  const zweef = !klassiekeAnimatie && !reduceMotion && stage !== "card"
    ? `envelop-zweef 3.4s ease-in-out infinite`
    : "none"
  // De blokken onder de kaart (knoppen, CTA, afzender) nemen hun plek al in
  // voordat ze zichtbaar zijn. Anders herschikt de pagina zich precies op het
  // moment dat de kaart landt, en verspringt hij daar nog een stukje van.
  const eindBlok = stage === "open"
    ? { animation: reduceMotion ? "none" : "knoppen-fadein 0.5s ease 0.5s both" }
    : { visibility: "hidden" as const, pointerEvents: "none" as const }
  const stofjesAan = stage === "open" && display.animatie === "feestelijk" && !reduceMotion

  return (
    <div
      // Als hele pagina: lucht boven en onder de kaart. Bij het voorbeeld staat
      // er een vaste balk bovenaan; die at de bovenruimte op, zodat de kaart
      // er strak tegenaan stond (Michiels bevinding van 23 september 2026).
      className={`relative flex flex-col items-center justify-center px-4 ${
        compact ? "py-4" : previewNotice ? "min-h-screen pt-24 pb-12" : "min-h-screen py-12"
      }`}
      style={{
        background: sc.bodyBackground ?? sc.bodyBg,
        // De envelop zakt tijdens de animatie onder deze doos uit. Zonder dit
        // groeit de pagina daardoor en verschuift het beeld een paar pixels,
        // soms met een scrollbalk erbij. Clip in plaats van hidden, zodat dit
        // geen scrollcontainer wordt. In het paneel van de bouwer (compact) is
        // er geen envelop en sneed dit juist de schaduw van de kaart af aan de
        // zijkanten; daar mag alles gewoon zichtbaar zijn.
        overflow: compact ? "visible" : "clip",
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
        /* Zweven op transform, want top animeren betekent elke frame layout
           en dat schokt. De animatie staat op de drie lagen zelf en niet op de
           laag eromheen: een transform daar zou een stapelcontext maken en dan
           kan de kaart niet meer tussen de envelop liggen. Een lopende CSS-
           animatie gaat voor op de inline transform, dus tijdens het zweven
           stuurt deze en daarna neemt het rekenwerk het weer over. */
        @keyframes envelop-zweef {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-${ENVELOP_ZWEEF}px); }
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
        {/* De envelop bestaat uit twee lagen met de kaart ertussen, want een
            kaart zit ín een envelop: vóór de achterkant en achter de voorkant.
            De achterkant en de klep liggen dus onder de kaart (z-index 1), de
            voorkant met het zegel erboven (z-index 3). Daarom zit er geen
            z-index op de laag hieromheen: die zou een eigen stapelcontext
            maken en dan kan de kaart er niet meer tussen.
            Absoluut over de kaart heen, zodat de kaart vanaf het begin zijn
            plek in de pagina inneemt en er niks verspringt als de envelop
            weggaat, precies op het moment dat de kaart moet landen. */}
        {stage !== "open" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="relative"
              style={{
                // Breder dan de kaart (max 420), anders steekt de kaart aan de
                // zijkanten uit en lijkt het nooit alsof hij erin zit
                width: "min(460px, calc(100vw - 12px))",
                aspectRatio: "17/12",
              }}
            >
              {/* Achterkant plus klep: onder de kaart */}
              <button
                ref={envelopAchterRef}
                onClick={open}
                aria-label={display.openEnvelopLabel}
                className="absolute inset-0 block outline-none"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: stage === "closed" ? "pointer" : "default",
                  pointerEvents: stage === "closed" ? "auto" : "none",
                  zIndex: 1,
                  animation: zweef,
                  ...(klassiekeAnimatie
                    ? {
                        opacity: envelopeGone ? 0 : 1,
                        transform: envelopeGone ? "translateY(70px) scale(0.92)" : "none",
                        transition: "opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s",
                      }
                    : {}),
                }}
              >
                {/* De achterkant: dit zie je door de open mond heen achter de kaart */}
                <span
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: env.voering ?? env.lichaam,
                    border: `1.5px solid ${sc.accent}50`,
                    filter: "brightness(0.97)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
                  }}
                />
              </button>

              {/* De klep in een eigen laag, want hij moet van plek wisselen:
                  dicht ligt hij vóór de kaart (hij is dan de buitenkant van de
                  envelop), open klapt hij naar achteren en gaat de kaart er
                  juist vóór langs. Dat is precies wat een z-index doet. */}
              <div
                ref={envelopKlepRef}
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  // Dicht ligt de klep vóór de kaart, want hij is dan de
                  // buitenkant van de envelop. Pas halverwege het openklappen
                  // staat hij recht overeind en gaat hij erachter; eerder zou je
                  // de kaart al zien terwijl de klep nog dicht lijkt.
                  zIndex: !klassiekeAnimatie && klepVoorKaart ? 4 : 1,
                  pointerEvents: "none",
                  animation: zweef,
                  ...(klassiekeAnimatie
                    ? {
                        opacity: envelopeGone ? 0 : 1,
                        transform: envelopeGone ? "translateY(70px) scale(0.92)" : "none",
                        transition: "opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s",
                      }
                    : {}),
                }}
              >
                {/* Precies de driehoek die de voorkant openlaat, dus dicht
                    sluit de envelop naadloos */}
                <span
                  className="absolute left-0 right-0 top-0"
                  style={{
                    height: `${ENVELOP_V_PUNT}%`,
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    background: klepBinnen && env.voering ? env.voering : env.lichaam,
                    // Dicht zie je de buitenkant, open de binnenkant, en die
                    // ligt in de schaduw. Dat maakt hem ook zichtbaar tegen de
                    // achtergrond, want die heeft bijna dezelfde kleur.
                    filter: klepDicht ? "brightness(0.99)" : env.voering ? "brightness(0.94)" : "brightness(0.78)",
                    borderRadius: "16px 16px 0 0",
                    transition: klassiekeAnimatie
                      ? "transform 0.55s ease, filter 0.55s ease"
                      : `transform ${DUUR_KLEP}ms cubic-bezier(0.35, 0, 0.3, 1), filter ${DUUR_KLEP}ms ease`,
                    transformOrigin: "top center",
                    transform: klepDicht ? "rotateX(0deg)" : "rotateX(180deg)",
                  }}
                />
              </div>

              {/* Voorkant: de vouwen die de kaart afdekken, plus het zegel.
                  De V die deze vorm openlaat is het venster waarin je de kaart
                  in de envelop ziet liggen. */}
              <div
                ref={envelopVoorRef}
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  // Boven de klep, want het zegel houdt die klep juist dicht.
                  // De vorm van de voorkant en die van de klep overlappen niet,
                  // dus voor de envelop zelf maakt die volgorde niks uit.
                  zIndex: 5,
                  pointerEvents: "none",
                  animation: zweef,
                  ...(klassiekeAnimatie
                    ? {
                        opacity: envelopeGone ? 0 : 1,
                        transform: envelopeGone ? "translateY(70px) scale(0.92)" : "none",
                        transition: "opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s",
                      }
                    : {}),
                }}
              >
                {/* Omhulsel met dezelfde afronding als de envelop. Een clip-path
                    maakt scherpe hoeken en negeert de border-radius, dus liepen
                    de vouwlijnen door tot buiten de ronding van de envelop. Door
                    het omhulsel te laten afronden lopen de lijn en de rand
                    precies op hetzelfde punt af. */}
                <span className="absolute inset-0" style={{ borderRadius: 16, overflow: "hidden" }}>
                {/* De voorkant: de zijvouwen en de ondervouw samen. Die dekken
                    de hele envelop af behalve een V bovenin, en juist in die V
                    zie je de kaart in de envelop zitten. De vorm sluit precies
                    aan op de klep, dus dicht is de envelop naadloos. */}
                <span
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    clipPath: `polygon(0 0, 50% ${ENVELOP_V_PUNT}%, 100% 0, 100% 100%, 0 100%)`,
                    backgroundColor: env.lichaam,
                    // De vouwlijnen van de zijkanten naar het midden onderin
                    backgroundImage: `linear-gradient(to top right, transparent 49.7%, ${sc.accent}1F 50%, transparent 50.3%), linear-gradient(to top left, transparent 49.7%, ${sc.accent}1F 50%, transparent 50.3%)`,
                    // Een drop-shadow volgt de geklipte vorm, een box-shadow niet:
                    // zo krijgt de V-rand een echte kant waar de kaart achter gaat
                    filter: `drop-shadow(0 -2px 3px rgba(0,0,0,0.16)) brightness(1.03)`,
                  }}
                />
                {/* Randje langs de V, zodat de vouw ook zichtbaar is als de
                    kleuren van kaart en envelop dicht bij elkaar liggen */}
                <span
                  className="absolute inset-0"
                  style={{
                    clipPath: `polygon(0 0, 50% ${ENVELOP_V_PUNT}%, 100% 0, 100% 1.5%, 50% ${ENVELOP_V_PUNT + 1.5}%, 0 1.5%)`,
                    backgroundColor: `${sc.accent}55`,
                  }}
                />
                </span>
                {/* Zegel met initialen. Bij de nieuwe animatie bestaat het uit
                    twee helften die eerst kraken en dan wegvallen. Elke helft
                    toont de volledige initialen en knipt de andere helft weg,
                    zodat ze samen naadloos één zegel vormen. */}
                {/* De schaduw van het zegel staat apart en zonder clip-path.
                    Zat hij op de twee helften zelf, dan knipte hun clip-path
                    ook de schaduw af tot precies het vierkant van 62 bij 62,
                    en zag je de hoeken van die afgeknipte schaduw als een
                    grijzig blokje om het zegel heen. */}
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 rounded-full"
                  style={{
                    top: `${ENVELOP_V_PUNT}%`,
                    marginTop: -31,
                    marginLeft: -31,
                    width: 62,
                    height: 62,
                    boxShadow: "0 3px 12px rgba(0,0,0,0.22)",
                    opacity: zegelHeel ? 1 : 0,
                    transition: "opacity 0.25s ease",
                  }}
                />
                {(klassiekeAnimatie ? [0] : [0, 1]).map((helft) => (
                  <span
                    key={helft}
                    className="absolute left-1/2 flex items-center justify-center rounded-full"
                    style={{
                      top: `${ENVELOP_V_PUNT}%`,
                      marginTop: -31,
                      width: 62,
                      height: 62,
                      marginLeft: -31,
                      backgroundColor: env.zegel,
                      color: env.zegelTekst,
                      fontFamily: sc.fontInitials ?? sc.fontPageTitles,
                      fontSize: "1.35rem",
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
                            // Het kraken en vallen zit in de keyframes, zodat
                            // het twee bewegingen zijn in plaats van één sprong
                            animation: zegelHeel
                              ? "none"
                              : `${helft === 0 ? "zegel-links" : "zegel-rechts"} 0.95s ease-in both`,
                          }),
                    }}
                  >
                    {initials || "♥"}
                  </span>
                ))}
              </div>

              {/* Absoluut onder de envelop, niet als tweede item in de
                  gecentreerde kolom. Anders schuift de envelop 22 pixels naar
                  beneden op het moment dat deze regel verdwijnt, en dat is
                  precies het moment waarop de kaart moet gaan bewegen. */}
              {stage === "closed" && (
                <p
                  className="absolute left-0 right-0 text-center text-sm"
                  style={{ top: "100%", marginTop: 24, color: sc.bodyText, opacity: 0.75 }}
                >
                  Er is post voor je, tik op de envelop 💌
                </p>
              )}
            </div>
          </div>
        )}
        {/* ── De kaart ─────────────────────────────────────────────────────── */}
        {/* De kaart staat er altijd. Vanaf het begin zit hij in de envelop, dus
            zodra de klep opengaat zie je hem er al in liggen. Hij neemt ook
            vanaf het begin zijn plek in de pagina in, zodat er niks verspringt
            op het moment dat de envelop weggaat. */}
        <div
          ref={kaartRef}
          style={{
            width: "100%",
            maxWidth: 420,
            // Tussen de achterkant (1) en de voorkant (5) van de envelop: de
            // kaart zit erin, niet erachter
            zIndex: 2,
            // Zolang de kaart in de envelop zit moet een tik door de kaart heen
            // op de envelop landen. Zonder dit vangt de kaart de klik op, want
            // die ligt qua stapeling boven de envelopknop.
            pointerEvents: stage === "open" ? undefined : "none",
            transformOrigin: "top center",
            ...(reduceMotion || stage === "open"
              ? {}
              : klassiekeAnimatie
                ? cardVisible
                  ? { animation: "kaart-fadein 0.8s ease 0.15s both" }
                  : { opacity: 0, visibility: "hidden" as const }
                : // Het effect hierboven zet transform, klip en opacity, ook al
                  // voordat er getikt is. Hier alleen opacity 0 tegen een flits
                  // op het eerste beeld.
                  { opacity: 0 }),
          }}
        >
            <Voorkant display={display} sc={sc} breedte={kaartBreedte} />

            {/* Wie het maakte, direct onder de kaart. Stond helemaal onderaan,
                onder de knoppen; Michiel wil de volgorde kaart, gemaakt met,
                aanmelden, agenda (23 september 2026), met evenveel lucht boven
                als onder deze regel. */}
            {previewNotice || compact ? (
              /* In de bouwer geen link: daar wil je niet per ongeluk de bouwer
                 uit klikken (Michiel, 23 september 2026). */
              <p className="mt-8 mb-0 text-center text-xs" style={{ color: sc.bodyText, opacity: 0.55, ...eindBlok }}>
                {display.gemaaktMet} <span style={{ fontWeight: 600, color: sc.accent }}>SayingYes</span> · sayingyes.nl
              </p>
            ) : (
              <a
                href="https://www.sayingyes.nl"
                className="mt-8 block text-center text-xs"
                style={{
                  color: sc.bodyText,
                  opacity: 0.55,
                  textDecoration: "none",
                  ...eindBlok,
                }}
              >
                {display.gemaaktMet} <span style={{ fontWeight: 600, color: sc.accent }}>SayingYes</span> · sayingyes.nl
              </a>
            )}

            {/* Demo op de marketingsite: CTA in plaats van site-knoppen */}
            {demo && (
              <a
                href="/kaart-maken?type=trouwkaart"
                className="mt-6 block py-3.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: sc.accent,
                  color: sc.buttonText,
                  textDecoration: "none",
                  ...eindBlok,
                }}
              >
                Zelf zo&apos;n kaart maken? Begin gratis →
              </a>
            )}

            {/* Site hoort bij het pakket maar staat nog niet live: vooruitblik */}
            {siteVolgt && !demo && (
              <p
                className="mt-6 text-center text-sm"
                style={{
                  color: sc.bodyText,
                  opacity: 0.7,
                  ...eindBlok,
                }}
              >
                {display.siteVolgtTekst}
              </p>
            )}

            {/* Aanmelden, direct onder de kaart. Niet doorsturen naar een
                aparte pagina: de drempel zit in het wisselen van pagina, niet
                in het aantal vragen. Wie net op ja heeft getikt is op zijn
                meest bereidwillige moment; dan vraag je door. */}
            {aanmeldStand !== "geen" && bronToken && !demo && (
              <div
                className="mt-8 rounded-2xl p-5 sm:p-6"
                style={{
                  backgroundColor: sc.cardBg ?? "#ffffff",
                  border: `1px solid ${sc.accent}33`,
                  ...eindBlok,
                }}
              >
                <p
                  className="text-center text-xs font-semibold uppercase tracking-[0.18em] mb-4"
                  style={{ color: sc.accent }}
                >
                  {aanmeldStand === "janee" ? formulierTekst(display.taal).benJeErbij : formulierTekst(display.taal).aanmelden}
                </p>
                <AanmeldFormulier
                  bronToken={bronToken}
                  stand={aanmeldStand}
                  taal={display.taal}
                  accentColor={sc.accent}
                  labelColor={sc.cardText ?? sc.bodyText}
                  knopTekstKleur={sc.buttonText}
                  compact
                />
              </div>
            )}

            {aanmeldVoorbeeld && aanmeldStand !== "geen" && (
              <div
                className="mt-8 rounded-2xl p-5 sm:p-6"
                style={{
                  backgroundColor: sc.cardBg ?? "#ffffff",
                  border: `1px solid ${sc.accent}33`,
                  ...eindBlok,
                }}
              >
                <p
                  className="text-center text-xs font-semibold uppercase tracking-[0.18em] mb-4"
                  style={{ color: sc.accent }}
                >
                  {aanmeldStand === "janee" ? formulierTekst(display.taal).benJeErbij : formulierTekst(display.taal).aanmelden}
                </p>
                {aanmeldVoorbeeld}
              </div>
            )}

            {/* De datum in de agenda. Staat bewust boven de rest: bij een Save
                the Date is dit de enige zinnige stap, en de kaart vraagt er
                letterlijk om in de standaardtekst. */}
            {(agendaUrl || agendaVoorbeeld) && (
              <div className="mt-6" style={eindBlok}>
                <a
                  href={agendaUrl ?? undefined}
                  role={agendaUrl ? undefined : "button"}
                  aria-disabled={agendaUrl ? undefined : true}
                  title={agendaUrl ? undefined : "Werkt zodra de kaart bewaard is"}
                  className="block w-full py-3.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85"
                  // Bij een trouwkaart is aanmelden de belangrijkste stap, dus
                  // dan staat deze knop in de tweede vorm. Op een Save the
                  // Date is hij de enige en dus de opvallende.
                  style={{
                    ...(rsvpUrl
                      ? { backgroundColor: "transparent", color: sc.headingColor, border: `1.5px solid ${sc.accent}` }
                      : { backgroundColor: sc.accent, color: sc.buttonText }),
                    textDecoration: "none",
                    cursor: agendaUrl ? "pointer" : "default",
                  }}
                >
                  {display.agendaKnop}
                </a>
              </div>
            )}

            {/* Knoppen naar de trouwsite */}
            {(siteUrl || (rsvpUrl && aanmeldStand === "geen")) && (
              <div
                className="mt-6 flex flex-col sm:flex-row gap-3"
                style={eindBlok}
              >
                {rsvpUrl && aanmeldStand === "geen" && (
                  <a
                    href={rsvpUrl}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85"
                    style={{ backgroundColor: sc.accent, color: sc.buttonText, textDecoration: "none" }}
                  >
                    {display.rsvpKnop}
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
                    {display.siteKnop}
                  </a>
                )}
              </div>
            )}
          </div>
      </div>

    </div>
  )
}
