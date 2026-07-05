"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { SC } from "@/lib/event-styles"

const NAME_KEY = "sy_guest_name"
const MAX_LONG_SIDE = 2000
const JPEG_QUALITY = 0.8

type PhotoStatus = "ready" | "uploading" | "done" | "error"

interface SelectedPhoto {
  file: File
  preview: string
  status: PhotoStatus
  error?: string
}

// Hercodeer via canvas: verkleint naar max 2000px lange zijde, jpeg 80%.
// Dit stript meteen alle EXIF-data (incl. GPS) en converteert HEIC → JPEG
// op iPhones (Safari decodeert HEIC native).
async function compressImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("Kon deze foto niet lezen"))
      el.src = url
    })
    const scale = Math.min(1, MAX_LONG_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Kon deze foto niet verwerken")
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    )
    if (!blob) throw new Error("Kon deze foto niet verwerken")
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function UploadForm({
  eventId,
  eventTitle,
  moderated,
  wallHref,
  sc,
}: {
  eventId: string
  eventTitle: string
  moderated: boolean
  wallHref: string
  sc: SC
}) {
  const [name, setName] = useState("")
  const [caption, setCaption] = useState("")
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [doneCount, setDoneCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY)
      if (saved) setName(saved)
    } catch {}
  }, [])

  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.preview))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addFiles(list: FileList | null) {
    if (!list) return
    setFormError(null)
    const added = Array.from(list).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "ready" as PhotoStatus,
    }))
    setPhotos((prev) => [...prev, ...added])
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setFormError("Vul eerst je naam in")
      return
    }
    if (photos.length === 0) {
      setFormError("Kies eerst één of meer foto's")
      return
    }

    try {
      localStorage.setItem(NAME_KEY, trimmedName)
    } catch {}

    setUploading(true)
    setFormError(null)
    setDoneCount(0)

    let uploaded = 0
    for (let i = 0; i < photos.length; i++) {
      if (photos[i].status === "done") {
        uploaded++
        setDoneCount(uploaded)
        continue
      }
      setPhotos((prev) => prev.map((p, j) => (j === i ? { ...p, status: "uploading" } : p)))

      let outcome: { status: PhotoStatus; error?: string }
      try {
        const blob = await compressImage(photos[i].file)
        const formData = new FormData()
        formData.append("event_id", eventId)
        formData.append("name", trimmedName)
        if (caption.trim()) formData.append("caption", caption.trim())
        formData.append("file", blob, "foto.jpg")

        const res = await fetch("/api/guest-photos", { method: "POST", body: formData })
        if (res.ok) {
          outcome = { status: "done" }
          uploaded++
          setDoneCount(uploaded)
        } else {
          const body = await res.json().catch(() => null)
          outcome = { status: "error", error: body?.error ?? "Upload mislukt" }
        }
      } catch (err) {
        outcome = { status: "error", error: err instanceof Error ? err.message : "Upload mislukt" }
      }
      setPhotos((prev) => prev.map((p, j) => (j === i ? { ...p, ...outcome } : p)))
    }

    setUploading(false)
    setFinished(true)
  }

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.preview))
    setPhotos([])
    setCaption("")
    setDoneCount(0)
    setFinished(false)
    setFormError(null)
  }

  const succeeded = photos.filter((p) => p.status === "done").length
  const failed = photos.filter((p) => p.status === "error")
  const progress = photos.length > 0 ? Math.round((doneCount / photos.length) * 100) : 0

  const inputStyle: React.CSSProperties = {
    border: `1.5px solid ${sc.accent}40`,
    color: sc.bodyText,
    backgroundColor: "#fff",
    fontFamily: sc.fontFamily,
  }

  const labelStyle: React.CSSProperties = {
    color: sc.headingColor,
    fontSize: "0.8125rem",
    fontWeight: 600,
  }

  return (
    <div style={{ padding: "36px 24px 64px", fontFamily: sc.fontFamily }}>
      <div className="max-w-md mx-auto flex flex-col gap-6">

        {/* Titel */}
        <div className="text-center">
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
            Deel jullie foto&apos;s
          </h1>
          <p style={{ fontSize: "0.9375rem", color: sc.bodyText, lineHeight: 1.6, marginTop: 10 }}>
            Was jij erbij? Deel je mooiste foto&apos;s van vandaag — ze verschijnen op de
            fotomuur van {eventTitle}.
          </p>
        </div>

        {/* Klaar-scherm */}
        {finished && succeeded > 0 ? (
          <div
            className="rounded-2xl px-6 py-8 text-center flex flex-col gap-4"
            style={{
              backgroundColor: sc.cardBg ?? sc.navBg,
              border: sc.goldBorder ? `2px solid ${sc.accent}` : `1px solid ${sc.accent}20`,
            }}
          >
            <p style={{ fontSize: "2rem", margin: 0 }}>🎉</p>
            <p style={{ color: sc.cardText ?? sc.headingColor, fontWeight: 600, fontSize: "1.0625rem", margin: 0 }}>
              {moderated
                ? `Bedankt! ${succeeded === 1 ? "Je foto is" : `Je ${succeeded} foto's zijn`} verstuurd en ${succeeded === 1 ? "wordt" : "worden"} eerst nog even bekeken door het bruidspaar.`
                : succeeded === 1
                  ? "Jullie foto staat op de muur! 🎉"
                  : `Alle ${succeeded} foto's staan op de muur! 🎉`}
            </p>
            {failed.length > 0 && (
              <p style={{ fontSize: "0.8125rem", color: "#ef4444", margin: 0 }}>
                {failed.length === 1 ? "1 foto is" : `${failed.length} foto's zijn`} niet gelukt: {failed[0].error}
              </p>
            )}
            {!moderated && (
              <Link
                href={wallHref}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ backgroundColor: sc.accent, color: sc.buttonText, textDecoration: "none" }}
              >
                Bekijk de fotomuur
              </Link>
            )}
            <button
              onClick={reset}
              className="text-sm underline"
              style={{ color: sc.cardText ?? sc.bodyText, opacity: 0.75, background: "none", border: "none", cursor: "pointer" }}
            >
              Nog meer foto&apos;s delen
            </button>
          </div>
        ) : (
          <>
            {/* Naam */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gast-naam" style={labelStyle}>Je naam</label>
              <input
                id="gast-naam"
                type="text"
                value={name}
                maxLength={60}
                onChange={(e) => { setName(e.target.value); setFormError(null) }}
                placeholder="Bijv. Oma Ria"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={inputStyle}
                disabled={uploading}
              />
            </div>

            {/* Foto's kiezen */}
            <div className="flex flex-col gap-1.5">
              <span style={labelStyle}>Foto&apos;s</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl py-4 px-3 text-sm font-semibold flex flex-col items-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50"
                  style={{ border: `1.5px dashed ${sc.accent}70`, color: sc.headingColor, backgroundColor: `${sc.accent}0d`, cursor: "pointer" }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={sc.accent} strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z" />
                  </svg>
                  Kies foto&apos;s
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl py-4 px-3 text-sm font-semibold flex flex-col items-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50"
                  style={{ border: `1.5px dashed ${sc.accent}70`, color: sc.headingColor, backgroundColor: `${sc.accent}0d`, cursor: "pointer" }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={sc.accent} strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  Maak een foto
                </button>
              </div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = "" }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = "" }}
              />
            </div>

            {/* Geselecteerde foto's */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <div key={photo.preview} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.preview}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: photo.status === "error" ? 0.4 : 1 }}
                    />
                    {photo.status === "uploading" && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {photo.status === "done" && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#22c55e" }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                    )}
                    {photo.status === "error" && (
                      <div className="absolute inset-x-0 bottom-0 px-1.5 py-1 text-center" style={{ backgroundColor: "rgba(239,68,68,0.9)", color: "#fff", fontSize: "0.625rem", lineHeight: 1.3 }}>
                        {photo.error}
                      </div>
                    )}
                    {photo.status === "ready" && !uploading && (
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label="Foto verwijderen"
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff", border: "none", cursor: "pointer" }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bijschrift */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gast-bijschrift" style={labelStyle}>
                Bijschrift <span style={{ fontWeight: 400, opacity: 0.6 }}>(optioneel)</span>
              </label>
              <input
                id="gast-bijschrift"
                type="text"
                value={caption}
                maxLength={200}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Bijv. Wat een prachtige dag! 💛"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={inputStyle}
                disabled={uploading}
              />
            </div>

            {/* Voortgang */}
            {uploading && (
              <div className="flex flex-col gap-2">
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${sc.accent}25` }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: sc.accent }}
                  />
                </div>
                <p className="text-center text-xs" style={{ color: sc.bodyText }}>
                  Foto {Math.min(doneCount + 1, photos.length)} van {photos.length} wordt geüpload...
                </p>
              </div>
            )}

            {formError && (
              <p className="text-sm text-center" style={{ color: "#ef4444" }}>{formError}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: sc.accent, color: sc.buttonText, border: "none", cursor: "pointer" }}
            >
              {uploading
                ? "Bezig met uploaden..."
                : photos.length > 1
                  ? `${photos.length} foto's versturen`
                  : "Foto versturen"}
            </button>

            {/* AVG-toestemming */}
            <p className="text-xs text-center" style={{ color: sc.bodyText, opacity: 0.6, lineHeight: 1.5 }}>
              Door te uploaden geef je toestemming om deze foto op de trouwwebsite van het
              bruidspaar te tonen.
            </p>
          </>
        )}

      </div>
    </div>
  )
}
