"use client"

import { useRef, useState } from "react"
import { getStyleConfig } from "@/lib/event-styles"

const GOLD_LIGHT = "#E8D5A3"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

// Canvas-afmetingen: posterformaat, 2400px breed (prima om te printen)
const CANVAS_W = 2400
const MARGIN = 110
const GAP = 14
const BITMAP_H = 700          // foto's gedecodeerd op max 700px hoog (geheugen)
const MAX_COLLAGE_PHOTOS = 150

interface CollagePhoto {
  id: string
  url: string
}

interface LayoutCell {
  bitmap: ImageBitmap
  x: number
  y: number
  w: number
  h: number
}

function shuffleArray<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Leesbare fontnaam van de Cormorant next/font-variabele voor canvas-tekst
function cormorantFamily(): string {
  const probe = document.createElement("span")
  probe.style.fontFamily = "var(--font-cormorant), Georgia, serif"
  document.body.appendChild(probe)
  const family = getComputedStyle(probe).fontFamily
  probe.remove()
  return family || "Georgia, serif"
}

export default function CollageButton({
  photos,
  eventTitle,
  slug,
  styleKey,
}: {
  photos: CollagePhoto[]
  eventTitle: string
  slug: string
  styleKey: string
}) {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const bitmapsRef = useRef<Map<string, ImageBitmap>>(new Map())

  // Preview-URL en bitmaps opruimen bij het sluiten van de modal
  function closeModal() {
    setOpen(false)
    setPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url)
      return null
    })
    setError(null)
    bitmapsRef.current.forEach((b) => b.close())
    bitmapsRef.current.clear()
    blobRef.current = null
  }

  async function generate() {
    setProgress("Voorbereiden...")
    setError(null)
    try {
      const sc = getStyleConfig(styleKey)
      const selection = shuffleArray(photos.slice(0, MAX_COLLAGE_PHOTOS))

      // ── Foto's laden (één keer; hergebruikt bij opnieuw schudden) ──────────
      const bitmaps = bitmapsRef.current
      for (let i = 0; i < selection.length; i++) {
        if (!bitmaps.has(selection[i].id)) {
          setProgress(`Foto ${i + 1} van ${selection.length} laden...`)
          const res = await fetch(selection[i].url)
          if (!res.ok) throw new Error("download")
          const blob = await res.blob()
          const bitmap = await createImageBitmap(blob, {
            resizeHeight: BITMAP_H,
            resizeQuality: "high",
          })
          bitmaps.set(selection[i].id, bitmap)
        }
      }

      setProgress("Collage samenstellen...")

      // ── Justified rows-layout: rijen van gelijke hoogte, verhoudingen intact ──
      const rowWidth = CANVAS_W - 2 * MARGIN
      const perRow = Math.max(2, Math.ceil(Math.sqrt(selection.length * 0.9)))
      const targetRowH = rowWidth / (perRow * 1.35)

      const cells: LayoutCell[] = []
      let y = 0
      let row: { bitmap: ImageBitmap; ratio: number }[] = []
      let rowRatio = 0

      const flushRow = (last: boolean) => {
        if (row.length === 0) return
        const gaps = GAP * (row.length - 1)
        // Laatste (niet-volle) rij: op doelhoogte houden en centreren
        const rowH = last && rowRatio * targetRowH < rowWidth - gaps
          ? targetRowH
          : (rowWidth - gaps) / rowRatio
        let x = MARGIN
        if (last && rowRatio * rowH + gaps < rowWidth) {
          x += (rowWidth - rowRatio * rowH - gaps) / 2
        }
        for (const item of row) {
          const w = item.ratio * rowH
          cells.push({ bitmap: item.bitmap, x, y, w, h: rowH })
          x += w + GAP
        }
        y += rowH + GAP
        row = []
        rowRatio = 0
      }

      for (const photo of selection) {
        const bitmap = bitmaps.get(photo.id)!
        const ratio = bitmap.width / bitmap.height
        row.push({ bitmap, ratio })
        rowRatio += ratio
        if (rowRatio * targetRowH >= rowWidth - GAP * (row.length - 1)) flushRow(false)
      }
      flushRow(true)
      const gridH = y - GAP

      // ── Canvas opbouwen: titel + foto's + credit, in themakleuren ──────────
      const serif = cormorantFamily()
      const headerH = 300
      const footerH = 130
      const canvas = document.createElement("canvas")
      canvas.width = CANVAS_W
      canvas.height = headerH + gridH + footerH + MARGIN
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("canvas")

      ctx.fillStyle = sc.bodyBg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Titel (verkleinen tot hij past)
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      let titleSize = 110
      ctx.font = `600 ${titleSize}px ${serif}`
      while (ctx.measureText(eventTitle).width > rowWidth && titleSize > 48) {
        titleSize -= 6
        ctx.font = `600 ${titleSize}px ${serif}`
      }
      ctx.fillStyle = sc.headingColor
      ctx.fillText(eventTitle, CANVAS_W / 2, 140)

      // Accentlijn met ruitje (zelfde motief als de site)
      const lineY = 225
      ctx.strokeStyle = sc.accent
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(CANVAS_W / 2 - 220, lineY)
      ctx.lineTo(CANVAS_W / 2 - 30, lineY)
      ctx.moveTo(CANVAS_W / 2 + 30, lineY)
      ctx.lineTo(CANVAS_W / 2 + 220, lineY)
      ctx.stroke()
      ctx.fillStyle = sc.accent
      ctx.beginPath()
      ctx.moveTo(CANVAS_W / 2, lineY - 12)
      ctx.lineTo(CANVAS_W / 2 + 12, lineY)
      ctx.lineTo(CANVAS_W / 2, lineY + 12)
      ctx.lineTo(CANVAS_W / 2 - 12, lineY)
      ctx.closePath()
      ctx.fill()

      // Foto's met dun wit randje
      for (const cell of cells) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(cell.x - 3, headerH + cell.y - 3, cell.w + 6, cell.h + 6)
        ctx.drawImage(cell.bitmap, cell.x, headerH + cell.y, cell.w, cell.h)
      }

      // Credit onderin
      ctx.font = `500 34px ${serif}`
      ctx.fillStyle = sc.bodyText
      ctx.globalAlpha = 0.75
      ctx.fillText("Gemaakt met SayingYes — sayingyes.nl", CANVAS_W / 2, headerH + gridH + footerH - 20)
      ctx.globalAlpha = 1

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      )
      if (!blob) throw new Error("encode")

      blobRef.current = blob
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return URL.createObjectURL(blob)
      })
    } catch {
      setError("Collage maken mislukt — probeer het opnieuw.")
    } finally {
      setProgress(null)
    }
  }

  function download() {
    if (!blobRef.current) return
    const url = URL.createObjectURL(blobRef.current)
    const a = document.createElement("a")
    a.href = url
    a.download = `collage-${slug}.jpg`
    a.click()
    URL.revokeObjectURL(url)
  }

  function openModal() {
    setOpen(true)
    void generate()
  }

  return (
    <>
      <button
        onClick={openModal}
        className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
        style={{ backgroundColor: "white", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
      >
        🖼️ Collage maken
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(14,12,9,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!progress) closeModal() }}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col"
            style={{ backgroundColor: IVORY, border: `1px solid ${GOLD_LIGHT}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${GOLD_LIGHT}` }}>
              <h3 className="text-xl" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL }}>
                Collage van jullie fotomuur
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: BODY, background: "none", border: "none", cursor: "pointer" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-7 py-6 flex flex-col items-center gap-4">
              {progress ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: GOLD_LIGHT, borderTopColor: "#C5A059" }} />
                  <p className="text-sm" style={{ color: BODY }}>{progress}</p>
                </div>
              ) : previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Voorbeeld van de collage"
                    className="w-full rounded-xl"
                    style={{ border: `1px solid ${GOLD_LIGHT}`, maxHeight: "60vh", objectFit: "contain" }}
                  />
                  {photos.length > MAX_COLLAGE_PHOTOS && (
                    <p className="text-xs" style={{ color: BODY }}>
                      De collage gebruikt de nieuwste {MAX_COLLAGE_PHOTOS} foto&apos;s.
                    </p>
                  )}
                </>
              ) : error ? (
                <p className="text-sm py-16" style={{ color: "#ef4444" }}>{error}</p>
              ) : null}
            </div>

            <div className="px-7 py-5 flex flex-wrap gap-3" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
              <button
                onClick={() => void generate()}
                disabled={!!progress}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
                style={{ border: `1px solid ${GOLD_LIGHT}`, color: BODY, backgroundColor: "white", cursor: "pointer" }}
              >
                🔀 Opnieuw schudden
              </button>
              <button
                onClick={download}
                disabled={!!progress || !previewUrl}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 hover:-translate-y-0.5"
                style={{ backgroundColor: CHARCOAL, color: IVORY, border: "none", cursor: "pointer" }}
              >
                ⬇ Downloaden (JPG)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
