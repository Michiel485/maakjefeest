"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

const GOLD     = "#C5A059"
const CHARCOAL = "#1A1A1A"
const BODY     = "#5C5248"

interface Props {
  eventId: string
  currentSlug: string
  isLive: boolean
}

function sanitize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export default function SlugEditor({ eventId, currentSlug, isLive }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [value, setValue]     = useState(currentSlug)
  const [error, setError]     = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(currentSlug)
      setError(null)
      setSaved(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, currentSlug])

  async function handleSave() {
    const slug = sanitize(value)
    if (!slug || slug.length < 3) {
      setError("Minimaal 3 tekens vereist.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch("/api/event/update-slug", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ eventId, newSlug: slug }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Er ging iets mis.")
      } else {
        setSaved(true)
        setOpen(false)
        router.refresh()
      }
    } catch {
      setError("Netwerkfout. Probeer opnieuw.")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs transition-colors hover:underline"
        style={{ color: saved ? "#16a34a" : `${BODY}90`, cursor: "pointer", background: "none", border: "none", padding: 0 }}
      >
        {saved ? "URL opgeslagen ✓" : "URL aanpassen"}
      </button>
    )
  }

  const preview = sanitize(value)

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs" style={{ color: `${BODY}70`, whiteSpace: "nowrap" }}>
          {`${preview}.sayingyes.nl`}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { setValue(sanitize(e.target.value)); setError(null) }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setOpen(false) }}
          className="text-xs rounded-lg px-2 py-1 outline-none min-w-0"
          style={{
            border: `1px solid ${error ? "#dc2626" : GOLD}60`,
            color: CHARCOAL,
            width: "160px",
            fontFamily: "monospace",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
          onBlur={(e)  => (e.currentTarget.style.borderColor = error ? "#dc2626" : `${GOLD}60`)}
          placeholder={currentSlug}
          maxLength={60}
        />
      </div>

      {error && <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
          style={{ backgroundColor: saving ? `${GOLD}60` : GOLD, color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Opslaan…" : "Opslaan"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs transition-colors"
          style={{ color: `${BODY}70`, background: "none", border: "none", cursor: "pointer" }}
        >
          Annuleren
        </button>
      </div>
    </div>
  )
}
