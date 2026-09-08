"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
  const transitioningRef = useRef(false)

  useEffect(() => setMounted(true), [])

  // ── Bladeren met crossfade (automatisch én handmatig) ──────────────────────
  const photoCount = photos.length
  const advance = useCallback(
    (delta: number) => {
      if (photoCount <= 1 || transitioningRef.current) return
      transitioningRef.current = true
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + delta + photoCount) % photoCount)
        setVisible(true)
        transitioningRef.current = false
      }, FADE_MS)
    },
    [photoCount]
  )

  // Per getoonde foto één timer; handmatig bladeren reset hem automatisch
  useEffect(() => {
    if (photoCount <= 1) return
    const timer = setTimeout(() => advance(1), SLIDE_MS)
    return () => clearTimeout(timer)
  }, [index, photoCount, advance])

  // Pijltjestoetsen (handig op een laptop)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") advance(1)
      if (e.key === "ArrowLeft") advance(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [advance])

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

      {/* Vorige / volgende */}
      {photoCount > 1 && (
        <>
          <button
            onClick={() => advance(-1)}
            aria-label="Vorige foto"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", border: "none", cursor: "pointer", opacity: 0.55 }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => advance(1)}
            aria-label="Volgende foto"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", border: "none", cursor: "pointer", opacity: 0.55 }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

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
