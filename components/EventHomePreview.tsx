"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import type { SC } from "@/lib/event-styles"
import { getTitleFont } from "@/lib/title-fonts"

export interface HomepageSettings {
  layout: 'editorial' | 'modern'
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
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function GoldDivider({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-3 my-4 w-full">
      <div style={{ flex: 1, height: 1, backgroundColor: `${accent}60` }} />
      <svg width="6" height="6" viewBox="0 0 8 8" fill={accent}>
        <path d="M4 0 L8 4 L4 8 L0 4 Z" />
      </svg>
      <div style={{ flex: 1, height: 1, backgroundColor: `${accent}60` }} />
    </div>
  )
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
  initials,
  frameNames,
  frameLocation,
  frameInitialsSize = 8,
  frameNamesSize = 5.5,
  frameDateSize = 1.8,
  frameLocationSize = 1.8,
  onNavigate,
  rsvpHref = "/RSVP",
  homepageSettings,
  onFieldClick,
}: EventHomePreviewProps) {
  const hasPhoto = !!heroImageUrl
  const showOverlay = hasPhoto && heroOverlay

  const fieldClick = onFieldClick
    ? (field: string): React.HTMLAttributes<HTMLElement> => ({
        onDoubleClick: (e: React.MouseEvent) => { e.stopPropagation(); onFieldClick(field) },
        style: { cursor: 'pointer' },
        title: 'Dubbelklik om te bewerken',
      })
    : () => ({})

  const [heroPos, setHeroPos] = useState({ x: heroPosX, y: heroPosY })
  const [heroDragging, setHeroDragging] = useState(false)

  useEffect(() => {
    if (!heroDragging) {
      setHeroPos({ x: heroPosX, y: heroPosY })
    }
  }, [heroPosX, heroPosY]) // eslint-disable-line react-hooks/exhaustive-deps
  const heroRef = useRef<HTMLElement>(null)
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

  const isBoldHero = sc.fontHeroWeight >= 700

  const frameDisplayNames    = (frameNames    && frameNames.trim())    ? frameNames    : title
  const frameDisplayLocation = (frameLocation && frameLocation.trim()) ? frameLocation : (locatie ?? "")

  // Countdown
  let countdownText = "NOG ... DAGEN • TOT WE JA ZEGGEN"
  if (datum) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const weddingDay = new Date(datum); weddingDay.setHours(0, 0, 0, 0)
    const days = Math.round((weddingDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (days > 1)       countdownText = `NOG ${days} DAGEN • TOT WE JA ZEGGEN`
    else if (days === 1) countdownText = "MORGEN IS DE GROTE DAG!"
    else if (days === 0) countdownText = "VANDAAG IS DE DAG! 🤍"
    else                 countdownText = `JUST MARRIED • ${datumFormatted ?? ""}`
  }

  const FRAME_FILE: Record<string, string> = {
    "olive-rectangle":  "olive-square.png.png",
    "bloem-rechthoek":  "Bloem-rechthoek.png",
    "bloem2-breed":     "Bloem2-breed.png",
  }
  const frameFile = (id: string) => FRAME_FILE[id] ?? `${id}.png.png`
  const isFullWidth = frameStyle === "bloem-rechthoek" || frameStyle === "bloem2-breed"
  const isDiamond   = frameStyle?.includes("diamond")
  const isRectangle = frameStyle?.includes("rectangle") || frameStyle?.includes("square")
  const safeZoneClass = isDiamond ? "w-[80%] mx-auto" : isFullWidth ? "w-[50%] mx-auto" : isRectangle ? "w-[72%] mx-auto" : "w-[65%] mx-auto"

  // ── Resolve hp settings fonts ──────────────────────────────────────────────
  const hp = homepageSettings
  const subtitleFontResult   = getTitleFont(hp?.subtitleFont)
  const hoofdtitelFontResult = getTitleFont(hp?.hoofdtitelFont)
  const datumFontResult      = getTitleFont(hp?.datumFont)
  const locatieFontResult    = getTitleFont(hp?.locatieFont)

  const subtitleStyle: React.CSSProperties = {
    fontFamily: subtitleFontResult.family,
    fontWeight: subtitleFontResult.weight,
    fontSize: `${hp?.subtitleSize ?? 1.1}rem`,
    color: sc.bodyText,
    letterSpacing: '0.02em',
    textAlign: 'center',
    width: '100%',
  }

  const hoofdtitelStyle: React.CSSProperties = {
    fontFamily: hoofdtitelFontResult.family,
    fontWeight: hoofdtitelFontResult.weight,
    fontSize: `${hp?.hoofdtitelSize ?? 5.5}rem`,
    color: sc.headingColor,
    lineHeight: 1.1,
    whiteSpace: 'pre-wrap',
  }

  const datumStyleHp: React.CSSProperties = {
    fontFamily: datumFontResult.family,
    fontWeight: datumFontResult.weight,
    fontSize: `${hp?.datumSize ?? 1.6}rem`,
    color: sc.accent,
    letterSpacing: '0.12em',
    paddingLeft: '0.12em',
    textAlign: 'center',
  }

  const datumDisplay = (() => {
    if (!datum) return datumFormatted
    if ((hp?.datumNotatie ?? 'uitgeschreven') === 'numeriek') {
      const [y, m, d] = datum.split('-')
      return `${d}-${m}-${y}`
    }
    return datumFormatted
  })()

  const locatieStyleHp: React.CSSProperties = {
    fontFamily: locatieFontResult.family,
    fontWeight: locatieFontResult.weight,
    fontSize: `${hp?.locatieSize ?? 1.1}rem`,
    color: sc.bodyText,
    letterSpacing: '0.04em',
    paddingLeft: '0.04em',
    textAlign: 'center',
    width: '100%',
  }

  // ── Layout 2: Modern split-screen ─────────────────────────────────────────
  if (hp?.layout === 'modern') {
    return (
      <div className="@container">
        {/* Split: photo left, text right */}
        <div className="flex flex-col @md:flex-row" style={{ minHeight: 520 }}>

          {/* Photo panel (left on desktop, top on mobile) */}
          <div ref={heroRef as React.RefObject<HTMLDivElement>} className="@md:w-1/2 h-64 @md:h-auto relative overflow-hidden"
            onMouseDown={editableHero ? (e) => { e.preventDefault(); startHeroDrag(e.clientX, e.clientY) } : undefined}
            onMouseMove={editableHero ? (e) => moveHeroDrag(e.clientX, e.clientY) : undefined}
            onMouseUp={editableHero ? endHeroDrag : undefined}
            onMouseLeave={editableHero ? endHeroDrag : undefined}
            onTouchStart={editableHero ? (e) => startHeroDrag(e.touches[0].clientX, e.touches[0].clientY) : undefined}
            onTouchMove={editableHero ? (e) => { e.preventDefault(); moveHeroDrag(e.touches[0].clientX, e.touches[0].clientY) } : undefined}
            onTouchEnd={editableHero ? endHeroDrag : undefined}
            onDoubleClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick('headerfoto') } : undefined}
            style={{ cursor: editableHero && heroImageUrl ? (heroDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            {heroImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImageUrl}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  style={{ objectPosition: `${heroPos.x}% ${heroPos.y}%` }}
                />
                {showOverlay && (
                  <div
                    className="absolute inset-0"
                    style={
                      sc.floral
                        ? { background: "linear-gradient(to bottom, rgba(28,25,23,0.06) 0%, rgba(28,25,23,0.22) 100%)" }
                        : { backgroundColor: sc.accent, opacity: 0.18 }
                    }
                  />
                )}
                {/* Hoofdtitel overlay op foto wanneer "Over foto" gekozen */}
                {(hp.hoofdtitelVisible !== false) && title && (hp.titlePosition ?? 'under') === 'over' && (
                  <div className="absolute inset-0 flex items-end justify-center pb-6 @md:pb-10 px-6"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }}
                  >
                    <h1
                      {...fieldClick('hoofdtitel')}
                      style={{ ...hoofdtitelStyle, color: '#fff', fontSize: `clamp(1.8rem, ${hp.hoofdtitelSize ?? 5.5}rem, ${(hp.hoofdtitelSize ?? 5.5) * 1.2}rem)`, lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.4)', textAlign: 'center' }}
                    >
                      {title}
                    </h1>
                  </div>
                )}
                {editableHero && !heroDragging && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                    <span className="text-xs px-3 py-1 rounded-full opacity-80" style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}>
                      Sleep om te positioneren
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full" style={{ backgroundColor: `${sc.accent}30` }} />
            )}
          </div>

          {/* Text panel (right on desktop, bottom on mobile) */}
          <div
            className="@md:w-1/2 flex items-center justify-center px-10 py-14 @md:py-20"
            style={{ backgroundColor: sc.bodyBg }}
          >
            <div className="flex flex-col items-center text-center gap-5 max-w-sm w-full">
              {/* Hoofdtitel in tekstvlak wanneer "In tekstvlak" (under) gekozen — boven subtitel */}
              {(hp.hoofdtitelVisible !== false) && title && (hp.titlePosition ?? 'under') !== 'over' && (
                <h1 {...fieldClick('hoofdtitel')} style={{ ...hoofdtitelStyle, fontSize: `clamp(2rem, ${hp?.hoofdtitelSize ?? 5.5}rem, ${(hp?.hoofdtitelSize ?? 5.5) * 1.2}rem)` }}>
                  {title}
                </h1>
              )}
              {(hp.subtitleVisible !== false) && hp.subtitleText && (
                <p {...fieldClick('subtitle')} style={subtitleStyle}>{hp.subtitleText}</p>
              )}
              {/* Initialen */}
              {(hp.initialsVisible !== false) && initials && (
                <p
                  {...fieldClick('initialen')}
                  style={{ fontFamily: sc.fontInitials, fontWeight: sc.fontInitialsWeight, fontSize: `${frameInitialsSize * 0.5}rem`, color: sc.accent, letterSpacing: '0.2em', paddingLeft: '0.2em', whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }}
                >
                  {initials}
                </p>
              )}
              {/* Namen in kader */}
              {(hp.frameNamesVisible !== false) && frameNames && frameNames.trim() && (
                <p
                  {...fieldClick('namen')}
                  style={{ fontFamily: sc.fontFrameNames, fontWeight: sc.fontFrameNamesWeight, fontSize: `clamp(1.5rem, ${frameNamesSize * 0.5}rem, ${frameNamesSize * 0.6}rem)`, color: sc.headingColor, whiteSpace: 'pre-wrap', lineHeight: 1.2, textAlign: 'center', width: '100%' }}
                >
                  {frameNames}
                </p>
              )}
              {(hp.datumVisible !== false) && datumDisplay && (
                <p {...fieldClick('datum')} style={datumStyleHp}>{datumDisplay}</p>
              )}
              {(hp.locatieVisible !== false) && frameDisplayLocation && (
                <p {...fieldClick('locatie')} style={locatieStyleHp}>{frameDisplayLocation}</p>
              )}
              <a
                href={rsvpHref}
                onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("RSVP") } : undefined}
                className="mt-4 inline-block text-sm font-bold px-7 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                style={{
                  backgroundColor: sc.buttonBg,
                  color: sc.buttonText,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  fontFamily: sc.fontFamily,
                }}
              >
                Meld je aan
              </a>
            </div>
          </div>
        </div>

        {/* Countdown strip */}
        {datum && (
          <div
            className="w-full py-3 text-center"
            style={{
              backgroundColor: sc.bodyBg,
              borderTop: `1px solid ${sc.accent}50`,
              borderBottom: `1px solid ${sc.accent}50`,
            }}
          >
            <p className="font-medium uppercase" style={{ fontSize: "0.9rem", color: sc.accent, letterSpacing: "0.18em", fontFamily: sc.fontFamily }}>
              {countdownText}
            </p>
          </div>
        )}

        {/* Welcome content */}
        {(homeTitle || homeBody) && (
          <div className="px-8 py-10 flex flex-col items-center" style={{ backgroundColor: sc.bodyBackground ? "transparent" : sc.navBg }}>
            <div className="max-w-2xl w-full text-center">
              {homeTitle && (
                <p {...fieldClick('welkomst-titel')} className="font-bold mb-2 whitespace-pre-wrap" style={{ fontSize: `${homeTitleSize ?? 1.75}rem`, color: sc.headingColor, fontFamily: sc.fontFamily, textAlign: 'center' }}>
                  {homeTitle}
                </p>
              )}
              {homeBody && (
                <p {...fieldClick('welkomst-tekst')} className="leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${homeBodySize ?? 0.9375}rem`, color: sc.bodyText, fontFamily: sc.fontFamily, textAlign: 'center' }}>
                  {homeBody}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Layout 1: Editorial (existing behavior + enhancements) ─────────────────

  const showTitleOverPhoto = hasPhoto && (hp?.titlePosition ?? 'over') === 'over' && (hp?.hoofdtitelVisible !== false)
  const showTitleUnderPhoto = (hp?.hoofdtitelVisible !== false) && (
    !hasPhoto || (hp?.titlePosition === 'under')
  )
  // "Elegant Divider" mode: no frame, show subtitle/title/date as composition
  const elegantMode = !useFrame

  const heroSection = hasPhoto ? (
    <section
      ref={heroRef}
      className={`relative w-full aspect-[21/9] overflow-hidden select-none ${
        editableHero ? heroDragging ? "cursor-grabbing" : "cursor-grab" : ""
      }`}
      onMouseDown={editableHero ? (e) => { e.preventDefault(); startHeroDrag(e.clientX, e.clientY) } : undefined}
      onMouseMove={editableHero ? (e) => moveHeroDrag(e.clientX, e.clientY) : undefined}
      onMouseUp={editableHero ? endHeroDrag : undefined}
      onMouseLeave={editableHero ? endHeroDrag : undefined}
      onTouchStart={editableHero ? (e) => startHeroDrag(e.touches[0].clientX, e.touches[0].clientY) : undefined}
      onTouchMove={editableHero ? (e) => { e.preventDefault(); moveHeroDrag(e.touches[0].clientX, e.touches[0].clientY) } : undefined}
      onTouchEnd={editableHero ? endHeroDrag : undefined}
      onDoubleClick={onFieldClick ? (e) => { e.stopPropagation(); onFieldClick('headerfoto') } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImageUrl!}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: `${heroPos.x}% ${heroPos.y}%` }}
      />
      {editableHero && !heroDragging && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-xs px-3 py-1 rounded-full opacity-80" style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}>
            Sleep om te positioneren
          </span>
        </div>
      )}
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
      {/* Title OVER the photo */}
      {showTitleOverPhoto && title && (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
          <h1
            {...fieldClick('hoofdtitel')}
            className="hp-hoofdtitel leading-tight whitespace-pre-wrap"
            style={{
              color: "#fff",
              fontFamily: hp?.hoofdtitelFont ? hoofdtitelFontResult.family : sc.fontHero,
              fontWeight: hp?.hoofdtitelFont ? hoofdtitelFontResult.weight : sc.fontHeroWeight,
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.75))",
            }}
          >
            {title}
          </h1>
        </div>
      )}
    </section>
  ) : null

  // Title under photo (or no photo): show above frame / elegant divider
  const titleUnderSection = showTitleUnderPhoto && title ? (
    <div className="flex flex-col items-center text-center px-8 pt-4 @md:pt-8 pb-0" style={{ backgroundColor: sc.bodyBg }}>
      <h1
        {...fieldClick('hoofdtitel')}
        className="hp-hoofdtitel leading-tight whitespace-pre-wrap"
        style={{
          fontFamily: hoofdtitelFontResult.family,
          fontWeight: hoofdtitelFontResult.weight,
          color: sc.headingColor,
        }}
      >
        {title}
      </h1>
    </div>
  ) : null

  return (
    <div className="@container">
      <style>{`
        .hp-subtitle   { font-size: ${((hp?.subtitleSize   ?? 1.1) * 0.65).toFixed(3)}rem; }
        .hp-hoofdtitel { font-size: ${((hp?.hoofdtitelSize ?? 5.5) * 0.55).toFixed(3)}rem; }
        .hp-initialen  { font-size: ${(frameInitialsSize * 0.30).toFixed(3)}rem; }
        .hp-namen      { font-size: ${(frameNamesSize    * 0.30).toFixed(3)}rem; }
        .hp-datum      { font-size: ${((hp?.datumSize    ?? 1.6) * 0.65).toFixed(3)}rem; }
        .hp-locatie    { font-size: ${((hp?.locatieSize  ?? 1.1) * 0.65).toFixed(3)}rem; }
        @container (min-width: 560px) {
          .hp-subtitle   { font-size: ${(hp?.subtitleSize   ?? 1.1).toFixed(3)}rem; }
          .hp-hoofdtitel { font-size: ${(hp?.hoofdtitelSize ?? 5.5).toFixed(3)}rem; }
          .hp-initialen  { font-size: ${(frameInitialsSize * 0.5).toFixed(3)}rem; }
          .hp-namen      { font-size: ${(frameNamesSize    * 0.5).toFixed(3)}rem; }
          .hp-datum      { font-size: ${(hp?.datumSize    ?? 1.6).toFixed(3)}rem; }
          .hp-locatie    { font-size: ${(hp?.locatieSize  ?? 1.1).toFixed(3)}rem; }
        }
      `}</style>
      {heroSection}

      {/* Title under photo (if applicable) */}
      {hasPhoto && showTitleUnderPhoto && titleUnderSection}

      {/* No photo → title above frame/divider */}
      {!hasPhoto && showTitleUnderPhoto && titleUnderSection}

      {/* Card / Elegant Divider section */}
      <section
        className={`w-full flex flex-col items-center ${isFullWidth ? "pt-0 pb-0 px-0" : `${showTitleUnderPhoto && title ? (hp?.subtitleVisible !== false && hp?.subtitleText ? "pt-1" : "pt-4 @md:pt-8") : "pt-6"} pb-8 px-6`}`}
        style={{ backgroundColor: sc.bodyBg }}
      >
        {elegantMode ? (
          /* ── Elegant Divider composition ── */
          <>
          <div className={`w-full max-w-3xl flex flex-col items-center text-center gap-2 @md:gap-4 ${showTitleUnderPhoto && title ? "pt-1 pb-4 @md:pb-8" : "py-4 @md:py-8"}`}>
            {/* Subtitle + Hoofdtitel gegroepeerd met halve ruimte ertussen */}
            <div className="flex flex-col items-center gap-1 @md:gap-2 w-full">
              {(hp?.subtitleVisible !== false) && hp?.subtitleText && (
                <p {...fieldClick('subtitle')} className="hp-subtitle" style={{ ...subtitleStyle, fontSize: undefined }}>{hp.subtitleText}</p>
              )}
              {(hp?.hoofdtitelVisible !== false) && !hasPhoto && title && (
                <h1 {...fieldClick('hoofdtitel')} className="hp-hoofdtitel" style={{ ...hoofdtitelStyle, fontSize: undefined }}>{title}</h1>
              )}
            </div>
            {(hp?.initialsVisible !== false) && initials && (
              <p {...fieldClick('initialen')} className="hp-initialen" style={{ fontFamily: sc.fontInitials, fontWeight: sc.fontInitialsWeight, color: sc.headingColor, letterSpacing: '0.2em', paddingLeft: '0.2em', whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }}>
                {initials}
              </p>
            )}
            {(hp?.frameNamesVisible !== false) && frameNames && frameNames.trim() && (
              <p {...fieldClick('namen')} className="hp-namen" style={{ fontFamily: sc.fontFrameNames, fontWeight: sc.fontFrameNamesWeight, color: sc.headingColor, whiteSpace: 'pre-wrap', lineHeight: 1.2, wordBreak: 'keep-all', textAlign: 'center', width: '100%' }}>
                {frameNames}
              </p>
            )}
            {(hp?.datumVisible !== false) && datumDisplay && (
              <p {...fieldClick('datum')} className="hp-datum" style={{ ...datumStyleHp, fontSize: undefined }}>{datumDisplay}</p>
            )}
            {(hp?.locatieVisible !== false) && frameDisplayLocation && (
              <p {...fieldClick('locatie')} className="hp-locatie" style={{ ...locatieStyleHp, fontSize: undefined }}>{frameDisplayLocation}</p>
            )}
            <div className="my-2 @md:my-4" />
            <a
              href={rsvpHref}
              onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("RSVP") } : undefined}
              className="inline-block text-sm font-bold px-7 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              style={{
                backgroundColor: sc.buttonBg,
                color: sc.buttonText,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                fontFamily: sc.fontFamily,
              }}
            >
              Meld je aan
            </a>
          </div>
          </>
        ) : useFrame && frameStyle ? (
          /* ── Luxe Trouwkaart (frame) ── */
          <>
            {/* Subtitle above frame */}
            {(hp?.subtitleVisible !== false) && hp?.subtitleText && (
              <p {...fieldClick('subtitle')} className="text-center mb-4" style={subtitleStyle}>{hp.subtitleText}</p>
            )}
            <div
              className={`relative w-full ${isFullWidth ? "" : "max-w-2xl"}`}
              style={{ containerType: "inline-size" } as React.CSSProperties}
            >
              <style>{`
                .fk-initials  { font-size: clamp(1.2rem, ${frameInitialsSize}cqi, 8rem);   line-height: 1.1; letter-spacing: 0.2em; padding-left: 0.2em; padding-top: 0.35em; padding-bottom: 0.08em; }
                .fk-names     { font-size: clamp(1rem,   ${frameNamesSize}cqi,    6rem);   line-height: 1.2; }
                .fk-date      { font-size: clamp(0.5rem, ${frameDateSize}cqi,     3rem);   letter-spacing: 0.18em; padding-left: 0.18em; }
                .fk-location  { font-size: clamp(0.5rem, ${frameLocationSize}cqi, 3rem);   }
              `}</style>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${process.env.NEXT_PUBLIC_ASSET_ORIGIN ?? ""}/frames/${frameFile(frameStyle!)}`} alt="" className="w-full h-auto block" />

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`flex flex-col items-center ${safeZoneClass}`} style={{ transform: "translateY(-9%)" }}>
                  {(hp?.initialsVisible !== false) && initials && (
                    <p {...fieldClick('initialen')} className="fk-initials text-center" style={{ fontFamily: sc.fontInitials, fontWeight: sc.fontInitialsWeight, color: sc.frameBodyText ?? sc.headingColor, whiteSpace: "nowrap", maxWidth: "100%" }}>
                      {initials}
                    </p>
                  )}
                  {(hp?.frameNamesVisible !== false) && (
                    <p {...fieldClick('namen')} className={`fk-names text-center ${(hp?.initialsVisible !== false) && initials ? "mt-[0.25cqi]" : ""}`} style={{ fontFamily: sc.fontFrameNames, fontWeight: sc.fontFrameNamesWeight, color: sc.frameBodyText ?? sc.headingColor, whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: "100%" }}>
                      {frameDisplayNames}
                    </p>
                  )}
                  {(hp?.datumVisible !== false) && datumDisplay && (
                    <p {...fieldClick('datum')} className="fk-date uppercase text-center mt-[1.1cqi]" style={{ fontFamily: datumFontResult.family, fontWeight: datumFontResult.weight, color: sc.frameBodyText ?? sc.bodyText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                      {datumDisplay}
                    </p>
                  )}
                  {(hp?.locatieVisible !== false) && frameDisplayLocation && (
                    <p {...fieldClick('locatie')} className="fk-location text-center mt-[0.4cqi]" style={{ fontFamily: locatieFontResult.family, fontWeight: locatieFontResult.weight, color: sc.frameBodyText ?? sc.bodyText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                      {frameDisplayLocation}
                    </p>
                  )}
                </div>
              </div>

              {isFullWidth && (
                <div className="absolute inset-x-0 flex justify-center" style={{ top: "82%" }}>
                  <a
                    href={rsvpHref}
                    onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("RSVP") } : undefined}
                    className="inline-block text-xs @md:text-sm font-bold px-3.5 py-1.5 @md:px-7 @md:py-3 rounded-lg @md:rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                    style={{ backgroundColor: sc.buttonBg, color: sc.buttonText, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", fontFamily: sc.fontFamily }}
                  >
                    Meld je aan
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No frame: only date + location, minimal */
          <div className="flex flex-col items-center gap-2 pt-4 pb-0 text-center">
            {datumDisplay && (
              <p className="uppercase tracking-[0.18em] font-medium text-center" style={{ color: sc.headingColor, fontFamily: sc.fontFamily, fontSize: `${(frameDateSize * 0.5).toFixed(2)}rem` }}>
                {datumDisplay}
              </p>
            )}
            {locatie && (
              <p className="text-sm" style={{ color: sc.bodyText, fontFamily: sc.fontFamily }}>
                {locatie}
              </p>
            )}
          </div>
        )}

        {/* CTA below frame — only for non-full-width frames */}
        {useFrame && frameStyle && !isFullWidth && (
          <a
            href={rsvpHref}
            onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("RSVP") } : undefined}
            className="mt-6 inline-block text-sm font-bold px-7 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            style={{ backgroundColor: sc.buttonBg, color: sc.buttonText, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", fontFamily: sc.fontFamily }}
          >
            Meld je aan
          </a>
        )}
      </section>

      {/* Countdown strip */}
      <div className="w-full py-3 text-center" style={{ backgroundColor: sc.bodyBg, borderTop: `1px solid ${sc.accent}50`, borderBottom: `1px solid ${sc.accent}50` }}>
        <p className="font-medium uppercase" style={{ fontSize: "0.9rem", color: sc.accent, letterSpacing: "0.18em", fontFamily: sc.fontFamily }}>
          {countdownText}
        </p>
      </div>

      {/* Home content (Welkomstbericht) */}
      {(homeTitle || homeBody) && (
        <div className="px-8 py-10 flex flex-col items-center" style={{ backgroundColor: sc.bodyBackground ? "transparent" : sc.navBg }}>
          <div className="max-w-2xl w-full text-center">
            {homeTitle && (
              <p {...fieldClick('welkomst-titel')} className="font-bold mb-2 whitespace-pre-wrap" style={{ fontSize: `${homeTitleSize ?? (sc.floral ? 1.25 : 1.0)}rem`, color: sc.headingColor, fontFamily: sc.fontFamily, textAlign: 'center' }}>
                {homeTitle}
              </p>
            )}
            {homeBody && (
              <p {...fieldClick('welkomst-tekst')} className="leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${homeBodySize ?? (sc.floral ? 1.125 : 0.9375)}rem`, color: sc.bodyText, fontFamily: sc.fontFamily, textAlign: 'center' }}>
                {homeBody}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
