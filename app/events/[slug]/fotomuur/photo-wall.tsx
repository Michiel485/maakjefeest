"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import type { SC } from "@/lib/event-styles"

export interface GuestPhoto {
  id: string
  name: string
  caption: string | null
  url: string
  created_at: string
}

export default function PhotoWall({
  photos,
  uploadHref,
  sc,
}: {
  photos: GuestPhoto[]
  uploadHref: string
  sc: SC
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const close = useCallback(() => setLightboxIndex(null), [])
  const step = useCallback(
    (delta: number) => {
      setLightboxIndex((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length
      )
    },
    [photos.length]
  )

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
      if (e.key === "ArrowLeft") step(-1)
      if (e.key === "ArrowRight") step(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxIndex, close, step])

  const selected = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <div style={{ padding: "36px 24px 64px", fontFamily: sc.fontFamily }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Titel + upload-knop */}
        <div className="text-center flex flex-col items-center gap-4">
          <h1
            className="notranslate"
            style={{
              fontSize: "1.75rem",
              fontWeight: sc.fontPageTitlesWeight,
              color: sc.headingColor,
              fontFamily: sc.fontPageTitles,
              margin: 0,
            }}
          >
            Fotomuur
          </h1>
          <Link
            href={uploadHref}
            className="py-2.5 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ backgroundColor: sc.accent, color: sc.buttonText, textDecoration: "none" }}
          >
            📷 Deel jullie foto&apos;s
          </Link>
        </div>

        {photos.length === 0 ? (
          <p className="text-center" style={{ fontSize: "0.9375rem", color: sc.bodyText, opacity: 0.6 }}>
            Nog geen foto&apos;s — wees de eerste die er een deelt!
          </p>
        ) : (
          /* Masonry via CSS columns */
          <div style={{ columns: "2 240px", columnGap: 12 }} className="sm:[columns:3_200px]">
            {photos.map((photo, i) => (
              <figure
                key={photo.id}
                style={{ breakInside: "avoid", margin: "0 0 12px", cursor: "zoom-in" }}
                onClick={() => setLightboxIndex(i)}
              >
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: `${sc.accent}12` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption ?? `Foto van ${photo.name}`}
                    loading="lazy"
                    className="transition-transform duration-300 hover:scale-[1.03]"
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
                <figcaption style={{ padding: "6px 4px 2px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: sc.headingColor }}>
                    {photo.name}
                  </span>
                  {photo.caption && (
                    <span style={{ fontSize: "0.75rem", color: sc.bodyText, opacity: 0.8 }}>
                      {" — "}{photo.caption}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

      </div>

      {/* Lightbox — via portal op <body>, anders blijft hij onder de sticky nav
          hangen (de layout geeft <main> een eigen stacking context) */}
      {selected && createPortal(
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 py-8"
          style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
          onClick={close}
        >
          <button
            aria-label="Sluiten"
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", border: "none", cursor: "pointer" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {photos.length > 1 && (
            <>
              <button
                aria-label="Vorige foto"
                onClick={(e) => { e.stopPropagation(); step(-1) }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", border: "none", cursor: "pointer" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </button>
              <button
                aria-label="Volgende foto"
                onClick={(e) => { e.stopPropagation(); step(1) }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", border: "none", cursor: "pointer" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.url}
            alt={selected.caption ?? `Foto van ${selected.name}`}
            className="max-h-[80vh] max-w-full rounded-lg"
            style={{ objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="mt-4 text-center" style={{ color: "#fff", fontSize: "0.875rem" }}>
            <span style={{ fontWeight: 600 }}>{selected.name}</span>
            {selected.caption && <span style={{ opacity: 0.8 }}> — {selected.caption}</span>}
          </p>
        </div>,
        document.body
      )}
    </div>
  )
}
