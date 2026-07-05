"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import type { SC } from "@/lib/event-styles"
import type { GuestPhoto } from "../photo-wall"

const SLIDE_MS = 7000   // per foto
const POLL_MS = 15000   // nieuwe foto's ophalen
const FADE_MS = 900

// Fullscreen slideshow voor op een laptop/TV tijdens het feest.
// Gerenderd via een portal op <body> zodat de site-nav er niet doorheen prikt.
export default function Slideshow({
  eventId,
  initialPhotos,
  wallHref,
  sc,
}: {
  eventId: string
  initialPhotos: GuestPhoto[]
  wallHref: string
  sc: SC
}) {
  const [mounted, setMounted] = useState(false)
  const [photos, setPhotos] = useState<GuestPhoto[]>(initialPhotos)
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => setMounted(true), [])

  // ── Automatisch doorbladeren met crossfade ─────────────────────────────────
  const photoCount = photos.length
  useEffect(() => {
    if (photoCount <= 1) return
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % photoCount)
        setVisible(true)
      }, FADE_MS)
    }, SLIDE_MS)
    return () => clearInterval(timer)
  }, [photoCount])

  // ── Polling: nieuwe (goedgekeurde) foto's verschijnen vanzelf ──────────────
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/guest-photos?event_id=${eventId}`, { cache: "no-store" })
      if (!res.ok) return
      const body = (await res.json()) as { photos: GuestPhoto[] }
      if (Array.isArray(body.photos)) {
        setPhotos((prev) => {
          const prevIds = new Set(prev.map((p) => p.id))
          const hasNew = body.photos.some((p) => !prevIds.has(p.id))
          const sameLength = body.photos.length === prev.length
          return hasNew || !sameLength ? body.photos : prev
        })
      }
    } catch {
      // netwerk-hikje: volgende poll probeert het opnieuw
    }
  }, [eventId])

  useEffect(() => {
    const timer = setInterval(poll, POLL_MS)
    return () => clearInterval(timer)
  }, [poll])

  // Index veilig houden als de lijst krimpt (foto verwijderd door bruidspaar)
  const safeIndex = photos.length > 0 ? index % photos.length : 0
  const current = photos[safeIndex] ?? null
  const next = photos.length > 1 ? photos[(safeIndex + 1) % photos.length] : null

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen?.()
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ backgroundColor: "#0D0C0A", fontFamily: sc.fontFamily }}
    >
      {sc.fontImport && <style>{sc.fontImport}</style>}

      {/* Foto */}
      <div className="flex-1 relative overflow-hidden">
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.url}
              alt={current.caption ?? `Foto van ${current.name}`}
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: "contain",
                opacity: visible ? 1 : 0,
                transition: `opacity ${FADE_MS}ms ease`,
              }}
            />
            {/* Volgende foto alvast laden */}
            {next && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={next.url} alt="" aria-hidden="true" style={{ display: "none" }} />
            )}

            {/* Naam + bijschrift subtiel onderin beeld */}
            <div
              className="absolute inset-x-0 bottom-0 px-8 pb-8 pt-24 pointer-events-none"
              style={{
                background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
                opacity: visible ? 1 : 0,
                transition: `opacity ${FADE_MS}ms ease`,
              }}
            >
              <p style={{ color: "#fff", fontSize: "1.35rem", margin: 0 }}>
                <span style={{ fontFamily: sc.fontPageTitles, fontWeight: 600, color: sc.accent }}>
                  {current.name}
                </span>
                {current.caption && (
                  <span style={{ opacity: 0.85, fontSize: "1.1rem" }}> — {current.caption}</span>
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p style={{ color: sc.accent, fontSize: "1.75rem", fontFamily: sc.fontPageTitles, margin: 0 }}>
              Nog geen foto&apos;s
            </p>
            <p style={{ color: "#B8B2A8", fontSize: "1.05rem", margin: 0 }}>
              Scan de QR-code en deel de eerste foto — hij verschijnt hier vanzelf!
            </p>
          </div>
        )}
      </div>

      {/* Bediening rechtsboven (subtiel) */}
      <div className="absolute top-4 right-4 flex items-center gap-2" style={{ opacity: 0.55 }}>
        <button
          onClick={toggleFullscreen}
          title="Volledig scherm"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", border: "none", cursor: "pointer" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
        <Link
          href={wallHref}
          title="Terug naar de fotomuur"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      </div>

      {/* Groeimotor: subtiele vermelding onderin */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none">
        <a
          href="https://sayingyes.nl"
          className="pointer-events-auto text-xs"
          style={{ color: "#8A857C", textDecoration: "none", letterSpacing: "0.03em" }}
        >
          Gemaakt met <span style={{ color: sc.accent, fontWeight: 600 }}>SayingYes</span> — sayingyes.nl
        </a>
      </div>
    </div>,
    document.body
  )
}
