"use client"

import { useRef, useState, useCallback } from "react"
import type { SC } from "@/lib/event-styles"

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
}: EventHomePreviewProps) {
  const hasPhoto = !!heroImageUrl
  const showOverlay = hasPhoto && heroOverlay

  const [heroPos, setHeroPos] = useState({ x: heroPosX, y: heroPosY })
  const [heroDragging, setHeroDragging] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const lastHeroPointer = useRef<{ x: number; y: number } | null>(null)

  const startHeroDrag = useCallback((clientX: number, clientY: number) => {
    if (!editableHero || !heroImageUrl) return
    setHeroDragging(true)
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
    lastHeroPointer.current = null
    onHeroPositionChange?.(heroPos.x, heroPos.y)
  }, [heroDragging, heroPos, onHeroPositionChange])

  const isBoldHero = sc.fontHeroWeight >= 700

  // Texts shown inside the frame — dedicated fields take priority over event data
  const frameDisplayNames    = (frameNames    && frameNames.trim())    ? frameNames    : title
  const frameDisplayLocation = (frameLocation && frameLocation.trim()) ? frameLocation : (locatie ?? "")

  // Countdown: strip timezone/time noise by normalising both dates to midnight
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

  // Frame filename exceptions (non-.png.png files)
  const FRAME_FILE: Record<string, string> = {
    "olive-rectangle":  "olive-rectangle.png.PNG",
    "bloem-rechthoek":  "Bloem-rechthoek.png",
  }
  const frameFile = (id: string) => FRAME_FILE[id] ?? `${id}.png.png`

  // Full-width frames fill the section without max-w-2xl cap
  const isFullWidth = frameStyle === "bloem-rechthoek"

  // Safe zone: diamonds widest at center, circles taper, rectangles/squares wide, bloem narrower center
  const isDiamond   = frameStyle?.includes("diamond")
  const isRectangle = frameStyle?.includes("rectangle") || frameStyle?.includes("square")
  const safeZoneClass = isDiamond ? "w-[80%] mx-auto" : isFullWidth ? "w-[50%] mx-auto" : isRectangle ? "w-[72%] mx-auto" : "w-[65%] mx-auto"

  return (
    <div className="@container">
      {/* ── Hero: only rendered when a photo is set ── */}
      {hasPhoto && (
        <section
          ref={heroRef}
          className={`relative w-full h-[300px] @md:h-[420px] overflow-hidden select-none ${
            editableHero ? heroDragging ? "cursor-grabbing" : "cursor-grab" : ""
          }`}
          onMouseDown={editableHero ? (e) => { e.preventDefault(); startHeroDrag(e.clientX, e.clientY) } : undefined}
          onMouseMove={editableHero ? (e) => moveHeroDrag(e.clientX, e.clientY) : undefined}
          onMouseUp={editableHero ? endHeroDrag : undefined}
          onMouseLeave={editableHero ? endHeroDrag : undefined}
          onTouchStart={editableHero ? (e) => startHeroDrag(e.touches[0].clientX, e.touches[0].clientY) : undefined}
          onTouchMove={editableHero ? (e) => { e.preventDefault(); moveHeroDrag(e.touches[0].clientX, e.touches[0].clientY) } : undefined}
          onTouchEnd={editableHero ? endHeroDrag : undefined}
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

          {title && (
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
              <h1
                className={`leading-tight whitespace-pre-wrap text-4xl ${isBoldHero ? "@md:text-6xl" : "@md:text-[4.5rem]"}`}
                style={{
                  color: "#fff",
                  fontFamily: sc.fontHero,
                  fontWeight: sc.fontHeroWeight,
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.75))",
                }}
              >
                {title}
              </h1>
            </div>
          )}
        </section>
      )}

      {/* ── Luxe Trouwkaart + CTA ── */}
      <section className={`w-full pt-6 pb-8 flex flex-col items-center ${isFullWidth ? "px-0" : "px-6"}`} style={{ backgroundColor: sc.bodyBg }}>
        {useFrame && frameStyle ? (
          /* Container-query wrapper — text scales proportionally with the image */
          <div
            className={`relative w-full ${isFullWidth ? "" : "max-w-2xl"}`}
            style={{ containerType: "inline-size" } as React.CSSProperties}
          >
            <style>{`
              .fk-initials  { font-size: clamp(1.2rem, ${frameInitialsSize}cqi, 8rem);   line-height: 1.1; letter-spacing: 0.2em; padding-top: 0.35em; padding-bottom: 0.08em; }
              .fk-names     { font-size: clamp(1rem,   ${frameNamesSize}cqi,    6rem);   line-height: 1.2; }
              .fk-date      { font-size: clamp(0.5rem, ${frameDateSize}cqi,     3rem);   letter-spacing: 0.18em; }
              .fk-location  { font-size: clamp(0.5rem, ${frameLocationSize}cqi, 3rem);   }
            `}</style>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_ASSET_ORIGIN ?? ""}/frames/${frameFile(frameStyle!)}`} alt="" className="w-full h-auto block" />

            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className={`flex flex-col items-center ${safeZoneClass}`} style={{ transform: "translateY(-9%)" }}>
              {initials && (
                <p
                  className="fk-initials text-center"
                  style={{
                    fontFamily: sc.fontInitials,
                    fontWeight: sc.fontInitialsWeight,
                    color: sc.headingColor,
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {initials}
                </p>
              )}

              <p
                className={`fk-names text-center ${initials ? "mt-[0.25cqi]" : ""}`}
                style={{
                  fontFamily: sc.fontFrameNames,
                  fontWeight: sc.fontFrameNamesWeight,
                  color: sc.headingColor,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxWidth: "100%",
                }}
              >
                {frameDisplayNames}
              </p>

              {datumFormatted && (
                <p
                  className="fk-date uppercase text-center mt-[1.1cqi]"
                  style={{
                    fontFamily: sc.fontFamily,
                    color: sc.bodyText,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {datumFormatted}
                </p>
              )}

              {frameDisplayLocation && (
                <p
                  className="fk-location text-center mt-[0.4cqi]"
                  style={{
                    fontFamily: sc.fontFamily,
                    color: sc.bodyText,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {frameDisplayLocation}
                </p>
              )}
              </div>
            </div>
          </div>
        ) : (
          /* No frame: only date + location, minimal */
          <div className="flex flex-col items-center gap-2 pt-4 pb-0 text-center">
            {datumFormatted && (
              <p
                className="uppercase tracking-[0.18em] font-medium"
                style={{ color: sc.headingColor, fontFamily: sc.fontFamily, fontSize: `${(frameDateSize * 0.5).toFixed(2)}rem` }}
              >
                {datumFormatted}
              </p>
            )}
            {locatie && (
              <p className="text-sm" style={{ color: sc.bodyText, fontFamily: sc.fontFamily }}>
                {locatie}
              </p>
            )}
          </div>
        )}

        {/* ── CTA ── */}
        <a
          href={rsvpHref}
          onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("RSVP") } : undefined}
          className="mt-6 inline-block text-sm font-bold px-7 py-3 rounded-xl"
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
      </section>

      {/* ── Countdown strip ── */}
      <div
        className="w-full py-3 text-center"
        style={{
          backgroundColor: sc.bodyBg,
          borderTop: `1px solid ${sc.accent}50`,
          borderBottom: `1px solid ${sc.accent}50`,
        }}
      >
        <p
          className="text-sm font-medium uppercase"
          style={{ color: sc.accent, letterSpacing: "0.18em", fontFamily: sc.fontFamily }}
        >
          {countdownText}
        </p>
      </div>

      {/* ── Home content ── */}
      {(homeTitle || homeBody) && (
        <div className="px-8 py-10" style={{ backgroundColor: sc.bodyBackground ? "transparent" : sc.navBg }}>
          {homeTitle && (
            <p
              className={`font-bold mb-2 whitespace-pre-wrap ${sc.floral ? "text-xl" : "text-base"}`}
              style={{ color: sc.headingColor, fontFamily: sc.fontFamily, textAlign: homeAlign }}
            >
              {homeTitle}
            </p>
          )}
          {homeBody && (
            <p
              className={`leading-relaxed whitespace-pre-wrap ${sc.floral ? "text-lg" : "text-[0.9375rem]"}`}
              style={{ color: sc.bodyText, fontFamily: sc.fontFamily, textAlign: homeAlign }}
            >
              {homeBody}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
