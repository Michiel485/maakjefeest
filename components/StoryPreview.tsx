"use client"

import { useRef, useState, useCallback } from "react"
import type { SC } from "@/lib/event-styles"

export interface StoryPreviewProps {
  title: string | null
  text: string | null
  imageUrl: string | null
  imagePosX?: number
  imagePosY?: number
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
  editable = false,
  onPositionChange,
  sc,
}: StoryPreviewProps) {
  const nameFont = sc.nameFont || sc.fontFamily

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
    <div
      className="flex flex-col md:flex-row"
      style={{ backgroundColor: sc.bodyBg, minHeight: "100%" }}
    >
      {/* ── Foto-kant ── */}
      <div
        ref={containerRef}
        className={`relative w-full h-[40vh] md:h-auto md:w-1/2 flex-shrink-0 md:min-h-[520px] overflow-hidden select-none ${
          editable && imageUrl
            ? dragging
              ? "cursor-grabbing"
              : "cursor-grab"
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
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: sc.accent, opacity: 0.12 }}
          />
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

      {/* ── Tekst-kant ── */}
      <div
        className="flex flex-col justify-center px-8 md:px-14 py-12 md:w-1/2"
        style={{ backgroundColor: sc.navBg }}
      >
        {title && (
          <h2
            className="mb-5 leading-tight"
            style={{
              fontFamily: nameFont,
              color: sc.headingColor,
              fontSize: sc.nameFont ? "2.5rem" : "2rem",
              fontWeight: sc.nameFont ? 400 : 700,
            }}
          >
            {title}
          </h2>
        )}

        {text ? (
          <p
            className="leading-relaxed whitespace-pre-wrap"
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
  )
}
