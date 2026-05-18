"use client"

import { useRef, useState, useCallback } from "react"
import type { SC } from "@/lib/event-styles"

export interface StoryPreviewProps {
  title: string | null
  text: string | null
  imageUrl: string | null
  imagePosX?: number
  imagePosY?: number
  showOverlay?: boolean
  editable?: boolean
  onPositionChange?: (x: number, y: number) => void
  sc: SC
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export default function StoryPreview({
  title,
  text,
  imageUrl,
  imagePosX = 50,
  imagePosY = 50,
  showOverlay = true,
  editable = false,
  onPositionChange,
  sc,
}: StoryPreviewProps) {

  const [pos, setPos] = useState({ x: imagePosX, y: imagePosY })
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastPointer = useRef<{ x: number; y: number } | null>(null)

  const objectPosition = `${pos.x}% ${pos.y}%`

  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (!editable || !imageUrl) return
    setDragging(true)
    lastPointer.current = { x: clientX, y: clientY }
  }, [editable, imageUrl])

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragging || !lastPointer.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = clientX - lastPointer.current.x
    const deltaY = clientY - lastPointer.current.y
    lastPointer.current = { x: clientX, y: clientY }
    setPos(prev => ({
      x: clamp(prev.x - (deltaX / rect.width) * 100, 0, 100),
      y: clamp(prev.y - (deltaY / rect.height) * 100, 0, 100),
    }))
  }, [dragging])

  const endDrag = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    lastPointer.current = null
    onPositionChange?.(pos.x, pos.y)
  }, [dragging, pos, onPositionChange])

  return (
    <div className="@container" style={{ backgroundColor: sc.navBg }}>
      <div className="flex flex-col @md:flex-row flex-grow" style={{ minHeight: "420px" }}>

        {/* ── Foto-kolom ── */}
        <div
          ref={containerRef}
          className={`relative w-full h-[280px] @md:h-auto @md:w-1/2 flex-shrink-0 overflow-hidden select-none ${
            editable && imageUrl
              ? dragging ? "cursor-grabbing" : "cursor-grab"
              : ""
          }`}
          onMouseDown={editable ? (e) => { e.preventDefault(); startDrag(e.clientX, e.clientY) } : undefined}
          onMouseMove={editable ? (e) => moveDrag(e.clientX, e.clientY) : undefined}
          onMouseUp={editable ? endDrag : undefined}
          onMouseLeave={editable ? endDrag : undefined}
          onTouchStart={editable ? (e) => { startDrag(e.touches[0].clientX, e.touches[0].clientY) } : undefined}
          onTouchMove={editable ? (e) => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) } : undefined}
          onTouchEnd={editable ? endDrag : undefined}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: sc.accent, opacity: 0.12 }}
            />
          )}

          {/* Overlay — zelfde logica als de Hero, alleen als showOverlay aan staat */}
          {imageUrl && showOverlay && (
            <div
              className="absolute inset-0"
              style={
                sc.floral
                  ? { background: "linear-gradient(to bottom, rgba(28,25,23,0.12) 0%, rgba(28,25,23,0.44) 100%)" }
                  : { backgroundColor: sc.accent, opacity: 0.35 }
              }
            />
          )}

          {/* Zachte randovergang naar de tekstkolom: mobiel = onderaan, desktop = rechts */}
          {imageUrl && (
            <>
              <div
                className="absolute bottom-0 left-0 right-0 h-8 @md:hidden"
                style={{ background: `linear-gradient(to bottom, transparent, ${sc.navBg})` }}
              />
              <div
                className="absolute top-0 right-0 bottom-0 w-12 hidden @md:block"
                style={{ background: `linear-gradient(to right, transparent, ${sc.navBg})` }}
              />
            </>
          )}

          {editable && imageUrl && !dragging && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
              <span
                className="text-xs px-3 py-1 rounded-full opacity-80"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}
              >
                Sleep om te positioneren
              </span>
            </div>
          )}
        </div>

        {/* ── Tekst-kolom ── */}
        <div
          className="flex flex-col justify-center items-center @md:items-start text-center @md:text-left px-8 py-10 @md:px-14 @md:py-16 @md:w-1/2"
          style={{ backgroundColor: sc.navBg }}
        >
          {title && (
            <h2
              className="mb-4 leading-tight"
              style={{
                fontFamily: sc.titleFont,
                color: sc.headingColor,
                fontSize: "2.25rem",
                fontWeight: sc.titleFontWeight,
              }}
            >
              {title}
            </h2>
          )}

          {text ? (
            <p
              className="leading-relaxed whitespace-pre-wrap max-w-prose"
              style={{
                fontFamily: sc.fontFamily,
                color: sc.bodyText,
                fontSize: "1rem",
              }}
            >
              {text}
            </p>
          ) : (
            <p
              className="italic text-sm"
              style={{ fontFamily: sc.fontFamily, color: sc.bodyText, opacity: 0.45 }}
            >
              Schrijf jullie verhaal in de sidebar...
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
