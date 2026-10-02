"use client"

// De homepagina van de trouwsite: de opening en het welkomstbriefje.
//
// De opening vult het scherm en bestaat in drie smaken (ontwerpronde, 2
// oktober 2026): Foto (jullie foto over het hele scherm met de namen erop),
// Ontwerp (het kaartontwerp groot en vrij op de pagina) en Foto en ontwerp
// (naast elkaar, op de telefoon onder elkaar). In alle drie staan dezelfde
// dingen: het kopje, de namen, de datum met het aftellen eronder, de locatie,
// en de knoppen naar het aanmelden en de agenda. De indelingen "editorial" en
// "modern" van vroeger worden hierop afgebeeld, zodat niemand zijn foto kwijt is.

import { useRef, useState, useCallback, useEffect, type CSSProperties, type ReactNode } from "react"
import type { SC } from "@/lib/event-styles"
import { getTitleFont } from "@/lib/title-fonts"
import HomeOntwerp from "@/components/HomeOntwerp"
import SectieKop from "@/components/site/SectieKop"
import TijdenDresscode from "@/components/site/TijdenDresscode"
import Confetti from "@/components/site/Confetti"
import { HOME_KOP_STANDAARD, homeOntwerp } from "@/lib/home-ontwerp"

export type HomeOpening = "foto" | "ontwerp" | "foto-ontwerp"

export interface HomepageSettings {
  /** Van vroeger; de opening komt ervoor in de plaats. Zie homeOpening(). */
  layout: 'editorial' | 'modern'
  opening?: HomeOpening
  subtitleText: string
  subtitleFont: string
  subtitleSize: number
  hoofdtitelVisible: boolean
  hoofdtitelFont: string
  hoofdtitelSize: number
  datumFont: string
  datumSize: number
  datumNotatie?: 'uitgeschreven' | 'numeriek'
  titlePosition: 'over' | 'under'
  initialsVisible: boolean
  frameNamesVisible: boolean
  datumVisible: boolean
  subtitleVisible: boolean
  locatieVisible: boolean
  locatieFont: string
  locatieSize: number
  siteLayout?: 'boxed' | 'fullwidth'
  pageMode?: 'multi' | 'single'
  // De homepagina met een ontwerp (lib/home-ontwerp.ts, 26 september 2026)
  ontwerp?: string
  /** De kop op het ontwerp, zoals "Wij gaan trouwen" */
  ontwerpKop?: string
  /**
   * Per tekst op het ontwerp een eigen lettertype (id uit lib/title-fonts.ts)
   * en grootte (1 is zoals ontworpen). Kop, namen, datum, locatie, tijden en
   * dresscode elk apart (Michiel, 27 september 2026).
   */
  ontwerpTekst?: Partial<Record<'kop' | 'namen' | 'datum' | 'locatie' | 'tijden' | 'dresscode', { font?: string; schaal?: number }>>
  tijden?: string
  dresscode?: string
  details?: 'op' | 'onder'
  /** Hoe tijden en dresscode op het ontwerp staan, zoals op de trouwkaart (Michiel, 30 september 2026) */
  detailsStijl?: 'kopjes' | 'lijst' | 'sierlijn'
  detailsIcoon?: boolean
}

/**
 * Welke opening de site heeft. Een gekozen opening; anders de vertaling van
 * de oude indeling: wie een foto had houdt hem (naast het ontwerp), wie geen
 * foto heeft krijgt het ontwerp. Foto zonder foto wordt Ontwerp.
 */
export function homeOpening(hp: Pick<HomepageSettings, "layout" | "opening"> | null | undefined, metFoto: boolean): HomeOpening {
  const gekozen = hp?.opening
  if (gekozen === "ontwerp") return "ontwerp"
  if (gekozen === "foto" || gekozen === "foto-ontwerp") return metFoto ? gekozen : "ontwerp"
  return metFoto ? "foto-ontwerp" : "ontwerp"
}

/** "Nog 154 dagen", "Morgen is het zover", "Vandaag is de dag" of "Just married" */
export function aftelRegel(datum: string | null | undefined): string | null {
  if (!datum) return null
  const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0)
  const dag = new Date(datum); dag.setHours(0, 0, 0, 0)
  if (Number.isNaN(dag.getTime())) return null
  const dagen = Math.round((dag.getTime() - vandaag.getTime()) / 86400000)
  if (dagen > 1) return `Nog ${dagen} dagen`
  if (dagen === 1) return "Morgen is het zover"
  if (dagen === 0) return "Vandaag is de dag"
  return "Just married"
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export interface EventHomePreviewProps {
  title: string
  datumFormatted: string | null
  locatie: string | null
  datum?: string | null
  heroImageUrl: string | null
  heroOverlay?: boolean
  heroPosX?: number
  heroPosY?: number
  editableHero?: boolean
  onHeroPositionChange?: (x: number, y: number) => void
  homeTitle: string | null
  homeBody: string | null
  homeAlign: "left" | "center" | "right"
  homeTitleSize?: number
  homeBodySize?: number
  sc: SC
  useFrame?: boolean
  frameStyle?: string | null
  initials?: string | null
  frameNames?: string | null
  frameLocation?: string | null
  frameInitialsSize?: number
  frameNamesSize?: number
  frameDateSize?: number
  frameLocationSize?: number
  onNavigate?: (pageId: string) => void
  rsvpHref?: string
  /** De knop "Zet in je agenda"; zonder adres (in de bouwer) doet hij niets */
  agendaHref?: string
  /** Na de bruiloft: "Wij zijn getrouwd", geen aanmelden, de foto's als knop (lib/na-de-dag.ts) */
  naDeDag?: boolean
  fotosHref?: string | null
  homepageSettings?: HomepageSettings | null
  onFieldClick?: (field: string) => void
}

export default function EventHomePreview({
  title,
  datum,
  datumFormatted,
  locatie,
  heroImageUrl,
  heroOverlay = true,
  heroPosX = 50,
  heroPosY = 50,
  editableHero = false,
  onHeroPositionChange,
  homeTitle,
  homeBody,
  homeAlign,
  homeTitleSize,
  homeBodySize,
  sc,
  useFrame = false,
  frameStyle,
  frameNames,
  frameLocation,
  onNavigate,
  rsvpHref = "/RSVP",
  agendaHref,
  naDeDag = false,
  fotosHref = null,
  homepageSettings,
  onFieldClick,
}: EventHomePreviewProps) {
  const hasPhoto = !!heroImageUrl
  const showOverlay = hasPhoto && heroOverlay

  const fieldClick = onFieldClick
    ? (field: string): React.HTMLAttributes<HTMLElement> => ({
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); onFieldClick(field) },
        style: { cursor: 'pointer' },
        title: 'Klik om te bewerken',
      })
    : () => ({})

  // ── De foto slepen in de bouwer ──────────────────────────────────────────
  const [heroPos, setHeroPos] = useState({ x: heroPosX, y: heroPosY })
  const [heroDragging, setHeroDragging] = useState(false)

  useEffect(() => {
    if (!heroDragging) {
      setHeroPos({ x: heroPosX, y: heroPosY })
    }
  }, [heroPosX, heroPosY]) // eslint-disable-line react-hooks/exhaustive-deps
  const heroRef = useRef<HTMLDivElement>(null)
  const lastHeroPointer = useRef<{ x: number; y: number } | null>(null)
  const heroDraggingRef = useRef(false)

  // Native non-passive touchmove listener — React's synthetic handler is passive
  // and cannot call preventDefault(), so the page would scroll during drag.
  useEffect(() => {
    const el = heroRef.current
    if (!el || !editableHero) return
    function onTouchMoveNative(e: TouchEvent) {
      if (heroDraggingRef.current) e.preventDefault()
    }
    el.addEventListener("touchmove", onTouchMoveNative, { passive: false })
    return () => el.removeEventListener("touchmove", onTouchMoveNative)
  }, [editableHero])

  const startHeroDrag = useCallback((clientX: number, clientY: number) => {
    if (!editableHero || !heroImageUrl) return
    setHeroDragging(true)
    heroDraggingRef.current = true
    lastHeroPointer.current = { x: clientX, y: clientY }
  }, [editableHero, heroImageUrl])

  const moveHeroDrag = useCallback((clientX: number, clientY: number) => {
    if (!heroDragging || !lastHeroPointer.current || !heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const deltaX = clientX - lastHeroPointer.current.x
    const deltaY = clientY - lastHeroPointer.current.y
    lastHeroPointer.current = { x: clientX, y: clientY }
    setHeroPos(prev => ({
      x: clamp(prev.x - (deltaX / rect.width) * 100, 0, 100),
      y: clamp(prev.y - (deltaY / rect.height) * 100, 0, 100),
    }))
  }, [heroDragging])

  const endHeroDrag = useCallback(() => {
    if (!heroDragging) return
    setHeroDragging(false)
    heroDraggingRef.current = false
    lastHeroPointer.current = null
    onHeroPositionChange?.(heroPos.x, heroPos.y)
  }, [heroDragging, heroPos, onHeroPositionChange])

  // ── Wat er staat ──────────────────────────────────────────────────────────
  const hp = homepageSettings
  const namen    = (frameNames    && frameNames.trim())    ? frameNames    : title
  const plek     = (frameLocation && frameLocation.trim()) ? frameLocation : (locatie ?? "")
  const opening  = homeOpening(hp, hasPhoto)
  const ontwerpNu = homeOntwerp({ ontwerp: hp?.ontwerp, useFrame, frameStyle })
  const aftel = aftelRegel(datum)
  // Na de dag zegt het kopje "Wij zijn getrouwd", tenzij het bruidspaar zelf
  // iets anders koos
  const kopStandaard = hp?.ontwerpKop ?? HOME_KOP_STANDAARD
  const kop = naDeDag && kopStandaard === HOME_KOP_STANDAARD ? "Wij zijn getrouwd" : kopStandaard
  const vandaag = aftel === "Vandaag is de dag"
  const tijden = hp?.tijden?.trim() || null
  const dresscode = hp?.dresscode?.trim() || null

  // De letters zoals op het ontwerp gekozen, ook voor de tekst op de foto
  const eigenLetter = (rol: "kop" | "namen" | "datum" | "locatie" | "tijden" | "dresscode") => {
    const w = hp?.ontwerpTekst?.[rol]
    return w?.font ? getTitleFont(w.font) : null
  }
  const namenLetter = eigenLetter("namen") ?? { family: sc.fontFrameNames, weight: sc.fontFrameNamesWeight }
  const kopLetter = eigenLetter("kop")
  const datumLetter = eigenLetter("datum")

  // ── Bouwstenen ────────────────────────────────────────────────────────────
  const knoppen = (opFoto: boolean) => {
    const basis: CSSProperties = {
      display: "inline-block",
      padding: "12px 24px",
      borderRadius: 999,
      fontFamily: sc.fontFamily,
      fontWeight: 700,
      fontSize: "0.9375rem",
      textDecoration: "none",
      letterSpacing: "0.01em",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }
    // Na de dag geen aanmelden meer, wel de foto's
    if (naDeDag) {
      if (!fotosHref) return null
      return (
        <div className="flex flex-wrap items-center justify-center gap-3" style={{ marginTop: 28 }}>
          <a href={fotosHref} className="hover:-translate-y-0.5 hover:shadow-xl" style={{ ...basis, backgroundColor: sc.buttonBg, color: sc.buttonText, boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}>
            Bekijk de foto&apos;s
          </a>
        </div>
      )
    }
    return (
      <div className="flex flex-wrap items-center justify-center gap-3" style={{ marginTop: 28 }}>
        <a
          href={rsvpHref}
          onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("RSVP") } : undefined}
          className="hover:-translate-y-0.5 hover:shadow-xl"
          style={{ ...basis, backgroundColor: sc.buttonBg, color: sc.buttonText, boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}
        >
          Laat weten of je erbij bent
        </a>
        {datum && (
          <a
            href={agendaHref ?? "#"}
            onClick={agendaHref ? undefined : (e) => e.preventDefault()}
            className="hover:-translate-y-0.5"
            style={{
              ...basis,
              backgroundColor: "transparent",
              color: opFoto ? "#fff" : sc.accent,
              border: `1px solid ${opFoto ? "rgba(255,255,255,0.7)" : sc.accent}`,
            }}
          >
            Zet in je agenda
          </a>
        )}
      </div>
    )
  }

  const aftelBlok = (opFoto: boolean) => aftel ? (
    <p
      style={{
        margin: "18px 0 0",
        fontFamily: sc.fontFamily,
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: opFoto ? "rgba(255,255,255,0.85)" : sc.accent,
        textAlign: "center",
      }}
    >
      {aftel}
    </p>
  ) : null

  const scrollWenk = (opFoto: boolean) => (
    <button
      type="button"
      aria-label="Verder lezen"
      onClick={(e) => {
        const vak = (e.currentTarget.closest("[data-opening]") as HTMLElement | null)
        if (!vak) return
        const top = vak.getBoundingClientRect().bottom + window.scrollY - 64
        window.scrollTo({ top, behavior: "smooth" })
      }}
      className="sy-wenk"
      style={{
        position: "absolute",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        background: "none",
        border: 0,
        padding: 8,
        cursor: "pointer",
        color: opFoto ? "rgba(255,255,255,0.85)" : sc.accent,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
    </button>
  )

  // Slepen in de bouwer. Bij de opening Foto zitten de handvatten op de hele
  // opening, zodat je ook over de namen heen kunt slepen; de foto zit er
  // immers onder (Michiel, 2 oktober 2026).
  // Op de telefoon scroll je gewoon over de foto heen; pas als je hem even
  // vasthoudt gaat hij schuiven. Eerst was elke aanraking een versleping en
  // kon je in de bouwer niet meer naar beneden (Michiel, 2 oktober 2026).
  const vasthoud = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sleepProps = editableHero ? {
    onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); startHeroDrag(e.clientX, e.clientY) },
    onMouseMove: (e: React.MouseEvent) => moveHeroDrag(e.clientX, e.clientY),
    onMouseUp: endHeroDrag,
    onMouseLeave: endHeroDrag,
    onTouchStart: (e: React.TouchEvent) => {
      const { clientX, clientY } = e.touches[0]
      if (vasthoud.current) clearTimeout(vasthoud.current)
      vasthoud.current = setTimeout(() => { vasthoud.current = null; startHeroDrag(clientX, clientY) }, 450)
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!heroDraggingRef.current) {
        // Nog niet vastgehouden: dit is scrollen, geen slepen
        if (vasthoud.current) { clearTimeout(vasthoud.current); vasthoud.current = null }
        return
      }
      moveHeroDrag(e.touches[0].clientX, e.touches[0].clientY)
    },
    onTouchEnd: () => {
      if (vasthoud.current) { clearTimeout(vasthoud.current); vasthoud.current = null }
      endHeroDrag()
    },
  } : {}
  const sleepCursor = editableHero && heroImageUrl ? (heroDragging ? "cursor-grabbing" : "cursor-grab") : ""
  const [aanraak, setAanraak] = useState(false)
  useEffect(() => { setAanraak(window.matchMedia("(pointer: coarse)").matches) }, [])
  const sleepHint = aanraak ? "Houd vast om te verschuiven" : "Sleep om te positioneren"

  const fotoVlak = (klasse: string, kinderen?: ReactNode, opOuder = false) => (
    <div
      ref={opOuder ? undefined : heroRef}
      className={`overflow-hidden select-none ${klasse} ${opOuder ? "" : sleepCursor}`}
      {...(opOuder ? {} : sleepProps)}
      onClick={onFieldClick && !kinderen ? (e) => { e.stopPropagation(); onFieldClick('headerfoto') } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImageUrl!}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: `${heroPos.x}% ${heroPos.y}%` }}
      />
      {showOverlay && (
        <div
          className="absolute inset-0"
          style={
            sc.floral
              ? { background: "linear-gradient(to bottom, rgba(28,25,23,0.12) 0%, rgba(28,25,23,0.44) 100%)" }
              : { backgroundColor: sc.accent, opacity: 0.35 }
          }
        />
      )}
      {editableHero && !heroDragging && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none z-10">
          <span className="text-xs px-3 py-1 rounded-full opacity-80" style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}>
            {sleepHint}
          </span>
        </div>
      )}
      {kinderen}
    </div>
  )

  // Het ontwerp, met het aftellen en de knoppen eronder
  const ontwerpBlok = (
    <div className="w-full flex flex-col items-center">
      {/* "Hoi Sam" via de persoonlijke link (components/site/Begroeting.tsx) */}
      <div id="sy-begroeting" className="text-center" />
      <div {...fieldClick('ontwerp-kop')} className="w-full flex justify-center">
        <HomeOntwerp
          ontwerp={ontwerpNu}
          sc={sc}
          tekst={{
            kop,
            namen,
            datum: datum ?? null,
            locatie: plek || null,
            tijden,
            dresscode,
            details: hp?.details ?? null,
            detailsStijl: hp?.detailsStijl ?? null,
            detailsIcoon: hp?.detailsIcoon === true,
          }}
          instellingen={hp?.ontwerpTekst}
        />
      </div>
      {aftelBlok(false)}
      {knoppen(false)}
    </div>
  )

  // De tekst op de foto, in dezelfde letters als op het ontwerp
  const tekstOpFoto = (
    <div className="relative z-10 flex flex-col items-center text-center px-6" style={{ color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}>
      <div id="sy-begroeting" />
      <p
        {...fieldClick('ontwerp-kop')}
        style={{
          margin: 0,
          fontFamily: kopLetter?.family ?? sc.fontFamily,
          fontWeight: kopLetter?.weight ?? 700,
          fontSize: kopLetter ? "1.5rem" : "0.75rem",
          letterSpacing: kopLetter ? "0.02em" : "0.28em",
          textTransform: kopLetter ? undefined : "uppercase",
          opacity: 0.92,
        }}
      >
        {kop}
      </p>
      <h1
        {...fieldClick('namen')}
        style={{
          margin: "14px 0 0",
          fontFamily: namenLetter.family,
          fontWeight: namenLetter.weight,
          fontSize: `clamp(2.6rem, 9cqw, 5.2rem)`,
          lineHeight: 1.08,
          textWrap: "balance",
          whiteSpace: "pre-wrap",
        }}
      >
        {namen}
      </h1>
      {datumFormatted && (
        <p
          {...fieldClick('datum')}
          style={{
            margin: "18px 0 0",
            fontFamily: datumLetter?.family ?? sc.fontFamily,
            fontWeight: datumLetter?.weight ?? 600,
            fontSize: datumLetter ? "1.6rem" : "1rem",
            letterSpacing: datumLetter ? "0.02em" : "0.16em",
            textTransform: datumLetter ? undefined : "uppercase",
          }}
        >
          {datumFormatted}
        </p>
      )}
      {plek && (
        <p {...fieldClick('locatie')} style={{ margin: "8px 0 0", fontFamily: sc.fontFamily, fontSize: "1rem", opacity: 0.9 }}>
          {plek}
        </p>
      )}
      {(tijden || dresscode) && (
        <div style={{ marginTop: 18 }}>
          {/* Dezelfde weergaven als op de kaart en op het ontwerp */}
          <TijdenDresscode
            tijden={tijden}
            dresscode={dresscode}
            stijl={hp?.detailsStijl}
            icoon={hp?.detailsIcoon === true}
            accent="rgba(255,255,255,0.9)"
            tekst="#fff"
            font={sc.fontFamily}
            eigen={{
              tijden: { family: eigenLetter("tijden")?.family, schaal: hp?.ontwerpTekst?.tijden?.schaal },
              dresscode: { family: eigenLetter("dresscode")?.family, schaal: hp?.ontwerpTekst?.dresscode?.schaal },
            }}
          />
        </div>
      )}
      {aftelBlok(true)}
      {knoppen(true)}
    </div>
  )

  // Zo hoog als het scherm, min het menu erboven
  const hoogte: CSSProperties = { minHeight: "calc(100svh - 72px)" }

  let openingBlok: ReactNode
  if (opening === "foto") {
    openingBlok = (
      <section
        ref={heroRef as React.RefObject<HTMLElement | null>}
        data-opening="foto"
        className={`relative flex items-center justify-center ${sleepCursor}`}
        style={{ ...hoogte, padding: "88px 0 96px" }}
        {...sleepProps}
      >
        {fotoVlak("absolute inset-0", (
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.5) 100%)" }} />
        ), true)}
        {tekstOpFoto}
        {scrollWenk(true)}
      </section>
    )
  } else if (opening === "foto-ontwerp") {
    openingBlok = (
      <section data-opening="foto-ontwerp" className="relative grid grid-cols-1 @md:grid-cols-2" style={hoogte}>
        {fotoVlak("relative h-72 @md:h-auto @md:min-h-full")}
        <div className="relative flex items-center justify-center px-6 py-12 @md:py-16 @md:pb-20" style={{ backgroundColor: sc.bodyBg }}>
          {ontwerpBlok}
          <div className="hidden @md:block">{scrollWenk(false)}</div>
        </div>
      </section>
    )
  } else {
    openingBlok = (
      <section data-opening="ontwerp" className="relative flex items-center justify-center px-6" style={{ ...hoogte, padding: "56px 24px 96px", backgroundColor: sc.bodyBg }}>
        {ontwerpBlok}
        {scrollWenk(false)}
      </section>
    )
  }

  return (
    <div className="@container">
      {/* Op de trouwdag zelf, één keer, niet in de bouwer */}
      {vandaag && !onFieldClick && <Confetti kleuren={[sc.accent, sc.buttonBg, sc.headingColor]} />}
      {openingBlok}

      {/* Het welkomstbriefje: kopje en tekst. De namen als ondertekening
          eronder zijn weg: die stonden al in de opening en je kon ze hier niet
          weghalen (Michiel, 2 oktober 2026) */}
      {(homeTitle || homeBody) && (
        <div className="px-8 pt-14 pb-16 flex flex-col items-center">
          <div {...fieldClick('welkomst-titel')} className="w-full">
            <SectieKop sc={sc} kopje={homeTitle ? "Welkom" : undefined} titel={homeTitle || "Welkom"} />
          </div>
          {homeBody && (
            <p
              {...fieldClick('welkomst-tekst')}
              className="leading-relaxed whitespace-pre-wrap"
              style={{ fontSize: `${homeBodySize ?? (sc.floral ? 1.125 : 1)}rem`, color: sc.bodyText, fontFamily: sc.fontFamily, textAlign: homeAlign ?? 'center', maxWidth: 620, width: "100%", margin: 0 }}
            >
              {homeBody}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
