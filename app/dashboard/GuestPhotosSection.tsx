"use client"

import { useState } from "react"
import { updateGuestPhotoSettings } from "./actions"
import { eventSiteUrl, eventSiteLabel } from "@/lib/site-url"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"

export interface GuestPhotoRow {
  id: string
  event_id: string
  name: string
  caption: string | null
  url: string
  status: string
  created_at: string
}

export interface GuestPhotoSettings {
  enabled: boolean
  moderation: "live" | "approve"
}

export default function GuestPhotosSection({
  event,
  settings: initialSettings,
  photos: initialPhotos,
  maxPhotos,
}: {
  event: { id: string; title: string; slug: string }
  settings: GuestPhotoSettings
  photos: GuestPhotoRow[]
  maxPhotos: number
}) {
  const [settings, setSettings] = useState(initialSettings)
  const [photos, setPhotos] = useState(initialPhotos)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [zipProgress, setZipProgress] = useState<number | null>(null)

  const pending = photos.filter((p) => p.status === "pending")
  const approved = photos.filter((p) => p.status === "approved")

  async function saveSettings(next: GuestPhotoSettings) {
    const previous = settings
    setSettings(next)
    setSaving(true)
    setError(null)
    const result = await updateGuestPhotoSettings(event.id, next)
    setSaving(false)
    if (result.error) {
      setSettings(previous)
      setError(result.error)
    }
  }

  async function approvePhoto(id: string) {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/guest-photos/${id}`, { method: "PATCH" })
      if (!res.ok) throw new Error()
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p)))
    } catch {
      setError("Goedkeuren mislukt — probeer opnieuw.")
    } finally {
      setBusyId(null)
    }
  }

  async function deletePhoto(id: string) {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/guest-photos/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setPhotos((prev) => prev.filter((p) => p.id !== id))
      setDeleteConfirmId(null)
    } catch {
      setError("Verwijderen mislukt — probeer opnieuw.")
    } finally {
      setBusyId(null)
    }
  }

  // Alle foto's als zip — client-side met jszip (dynamische import, net als
  // de xlsx-export in RsvpSection), met voortgang per foto.
  async function downloadAllAsZip() {
    setZipProgress(0)
    setError(null)
    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      for (let i = 0; i < photos.length; i++) {
        const res = await fetch(photos[i].url)
        if (!res.ok) throw new Error()
        const blob = await res.blob()
        const safeName = photos[i].name.replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "-") || "gast"
        const ext = photos[i].url.split(".").pop()?.split("?")[0] ?? "jpg"
        zip.file(`${String(i + 1).padStart(3, "0")}-${safeName}.${ext}`, blob)
        setZipProgress(i + 1)
      }
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fotomuur-${event.slug}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Zip maken mislukt — probeer opnieuw.")
    } finally {
      setZipProgress(null)
    }
  }

  const uploadUrl = `${eventSiteUrl(event.slug)}/foto-delen`
  const slideshowUrl = `${eventSiteUrl(event.slug)}/fotomuur/live`

  return (
    <div
      className="rounded-2xl p-5 md:p-6 flex flex-col gap-5"
      style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
    >

      {/* Kop: titel + toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold" style={{ color: CHARCOAL }}>{event.title}</p>
          <p className="text-xs mt-0.5" style={{ color: BODY }}>
            {settings.enabled
              ? `${photos.length} van ${maxPhotos} foto's`
              : "Gasten kunnen foto's uploaden via een QR-code"}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={settings.enabled}
          disabled={saving}
          onClick={() => saveSettings({ ...settings, enabled: !settings.enabled })}
          className="relative flex-shrink-0 w-12 h-7 rounded-full transition-colors disabled:opacity-60"
          style={{ backgroundColor: settings.enabled ? GOLD : "#D6CDBE", border: "none", cursor: "pointer" }}
        >
          <span
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all"
            style={{ left: settings.enabled ? 26 : 4 }}
          />
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {settings.enabled && (
        <>
          {/* Moderatie-instelling */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
              Nieuwe foto&apos;s
            </span>
            <div className="flex gap-2">
              {([
                { value: "live" as const, label: "Direct live", hint: "Foto's verschijnen meteen op de muur" },
                { value: "approve" as const, label: "Eerst goedkeuren", hint: "Jullie keuren elke foto eerst goed" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => saveSettings({ ...settings, moderation: opt.value })}
                  className="flex-1 py-2.5 px-3 rounded-xl text-left transition-all disabled:opacity-60"
                  style={{
                    border: `2px solid ${settings.moderation === opt.value ? GOLD : GOLD_LIGHT}`,
                    backgroundColor: settings.moderation === opt.value ? GOLD_BG : "white",
                    cursor: "pointer",
                  }}
                >
                  <span className="block text-sm font-semibold" style={{ color: settings.moderation === opt.value ? CHARCOAL : BODY }}>
                    {opt.label}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: BODY }}>{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload-link */}
          <div
            className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2"
            style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: GOLD }}>Upload-link voor gasten</p>
              <p className="text-sm truncate" style={{ color: CHARCOAL }}>{eventSiteLabel(event.slug)}/foto-delen</p>
            </div>
            <a
              href={uploadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold"
              style={{ color: GOLD }}
            >
              Bekijken →
            </a>
          </div>

          {/* QR-code, slideshow & downloads */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
              QR-code &amp; downloads
            </span>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/guest-photos/qr?slug=${event.slug}`}
                download
                className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: CHARCOAL, color: "#FAF7F2", textDecoration: "none" }}
              >
                ⬇ QR-code (PNG)
              </a>
              <a
                href={`/print/fotokaart/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "white", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, textDecoration: "none" }}
              >
                🖨️ Print-kaart (A5/A4)
              </a>
              <a
                href={slideshowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "white", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, textDecoration: "none" }}
              >
                ▶ Slideshow voor op het feest
              </a>
              {photos.length > 0 && (
                <button
                  onClick={downloadAllAsZip}
                  disabled={zipProgress !== null}
                  className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ backgroundColor: "white", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                >
                  {zipProgress !== null
                    ? `Bezig... ${zipProgress}/${photos.length}`
                    : `⬇ Alles downloaden (.zip, ${photos.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Wachtrij */}
          {pending.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "#d97706" }}>
                Wacht op goedkeuring ({pending.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {pending.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    busy={busyId === photo.id}
                    confirming={deleteConfirmId === photo.id}
                    onApprove={() => approvePhoto(photo.id)}
                    onDelete={() => deletePhoto(photo.id)}
                    onConfirmDelete={() => setDeleteConfirmId(photo.id)}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                    pending
                  />
                ))}
              </div>
            </div>
          )}

          {/* Goedgekeurde foto's */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
              Op de muur ({approved.length})
            </span>
            {approved.length === 0 ? (
              <p className="text-sm" style={{ color: BODY }}>
                Nog geen foto&apos;s. Deel de upload-link of QR-code met jullie gasten!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {approved.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    busy={busyId === photo.id}
                    confirming={deleteConfirmId === photo.id}
                    onDelete={() => deletePhoto(photo.id)}
                    onConfirmDelete={() => setDeleteConfirmId(photo.id)}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function PhotoCard({
  photo,
  busy,
  confirming,
  pending = false,
  onApprove,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  photo: GuestPhotoRow
  busy: boolean
  confirming: boolean
  pending?: boolean
  onApprove?: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}) {
  return (
    <div
      className={`rounded-xl overflow-hidden flex flex-col ${busy ? "opacity-50" : ""}`}
      style={{ backgroundColor: "white", border: `1px solid ${pending ? "#fcd34d" : GOLD_LIGHT}` }}
    >
      <a href={photo.url} target="_blank" rel="noopener noreferrer" style={{ aspectRatio: "1" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption ?? `Foto van ${photo.name}`}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </a>
      <div className="px-2.5 py-2 flex flex-col gap-1.5">
        <p className="text-xs truncate" style={{ color: CHARCOAL }}>
          <span className="font-semibold">{photo.name}</span>
          {photo.caption && <span style={{ color: BODY }}> — {photo.caption}</span>}
        </p>
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onDelete}
              disabled={busy}
              className="flex-1 text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              style={{ border: "1px solid #fca5a5", cursor: "pointer" }}
            >
              Definitief verwijderen
            </button>
            <button
              onClick={onCancelDelete}
              className="text-xs font-semibold px-2 py-1.5 rounded-lg"
              style={{ color: BODY, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
            >
              Nee
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {pending && onApprove && (
              <button
                onClick={onApprove}
                disabled={busy}
                className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: "#10b981", color: "white", border: "none", cursor: "pointer" }}
              >
                Goedkeuren
              </button>
            )}
            <button
              onClick={onConfirmDelete}
              disabled={busy}
              title="Verwijderen"
              className={`text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors text-red-400 hover:text-red-600 hover:bg-red-50 ${pending ? "" : "flex-1"}`}
              style={{ border: "1px solid #fecaca", cursor: "pointer", backgroundColor: "transparent" }}
            >
              Verwijderen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
