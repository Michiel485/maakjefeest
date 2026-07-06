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
const GAP = 16
const TILE_RADIUS = 20
const MAX_COLLAGE_PHOTOS = 150

// Uitvoerformaten: aspect = hoogte / breedte
const FORMATS = {
  staand:   { label: "Staand",   hint: "print / poster",  aspect: Math.SQRT2 },
  vierkant: { label: "Vierkant", hint: "Instagram",       aspect: 1 },
  liggend:  { label: "Liggend",  hint: "TV / scherm",     aspect: 9 / 16 },
  verhaal:  { label: "Verhaal",  hint: "telefoon / story", aspect: 16 / 9 },
} as const
type FormatKey = keyof typeof FORMATS

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

// Eén mozaïektegel in rastereenheden: kolom, rij, breedte, hoogte
interface MosaicTile {
  c: number
  r: number
  sc: number
  sr: number
}

function shuffleArray<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function pathRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

// ── Mozaïek-layout ────────────────────────────────────────────────────────────
// Bouwt banden van 2 rastereenheden hoog en vult die met een willekeurige mix
// van blokken: grote 2x2-tegels, staande 1x2-tegels, stapels van twee kleintjes
// en brede tegels met twee kleintjes eronder/erboven. De slotband wordt exact
// passend gemaakt, zodat het raster altijd een strakke rechthoek is.
function buildMosaic(count: number, cols: number): MosaicTile[] {
  const tiles: MosaicTile[] = []
  let rowU = 0
  let placed = 0

  while (placed < count) {
    const remaining = count - placed

    if (remaining <= 2 * cols) {
      // ── Slotband: exact passend ─────────────────────────────────────────
      if (remaining >= cols) {
        // Mix van stapels (2 foto's per kolom) en staande tegels (1 foto)
        const stacks = remaining - cols
        const kinds = shuffleArray([
          ...Array<boolean>(stacks).fill(true),
          ...Array<boolean>(cols - stacks).fill(false),
        ])
        let col = 0
        for (const isStack of kinds) {
          if (isStack) {
            tiles.push({ c: col, r: rowU, sc: 1, sr: 1 })
            tiles.push({ c: col, r: rowU + 1, sc: 1, sr: 1 })
            placed += 2
          } else {
            tiles.push({ c: col, r: rowU, sc: 1, sr: 2 })
            placed += 1
          }
          col++
        }
      } else {
        // Minder foto's dan kolommen: verdeel de volle breedte
        const base = Math.floor(cols / remaining)
        const extra = cols % remaining
        let col = 0
        for (let i = 0; i < remaining; i++) {
          const w = base + (i < extra ? 1 : 0)
          tiles.push({ c: col, r: rowU, sc: w, sr: 2 })
          placed++
          col += w
        }
      }
      rowU += 2
    } else {
      // ── Normale band: willekeurige blokkenmix (verbruikt max 2×cols foto's,
      // en remaining > 2×cols, dus de band raakt nooit zonder foto's) ────────
      let col = 0
      while (col < cols) {
        const remW = cols - col
        const options = ["stack", "tall"]
        if (remW >= 2) options.push("big", "big", "topWide", "bottomWide")
        const pick = options[Math.floor(Math.random() * options.length)]

        if (pick === "big") {
          tiles.push({ c: col, r: rowU, sc: 2, sr: 2 })
          placed += 1
          col += 2
        } else if (pick === "tall") {
          tiles.push({ c: col, r: rowU, sc: 1, sr: 2 })
          placed += 1
          col += 1
        } else if (pick === "stack") {
          tiles.push({ c: col, r: rowU, sc: 1, sr: 1 })
          tiles.push({ c: col, r: rowU + 1, sc: 1, sr: 1 })
          placed += 2
          col += 1
        } else if (pick === "topWide") {
          tiles.push({ c: col, r: rowU, sc: 2, sr: 1 })
          tiles.push({ c: col, r: rowU + 1, sc: 1, sr: 1 })
          tiles.push({ c: col + 1, r: rowU + 1, sc: 1, sr: 1 })
          placed += 3
          col += 2
        } else {
          tiles.push({ c: col, r: rowU + 1, sc: 2, sr: 1 })
          tiles.push({ c: col, r: rowU, sc: 1, sr: 1 })
          tiles.push({ c: col + 1, r: rowU, sc: 1, sr: 1 })
          placed += 3
          col += 2
        }
      }
      rowU += 2
    }
  }

  return tiles
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
  const [format, setFormat] = useState<FormatKey>("staand")
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

  async function generate(fmt: FormatKey = format) {
    setProgress("Voorbereiden...")
    setError(null)
    try {
      const sc = getStyleConfig(styleKey)
      const selection = shuffleArray(photos.slice(0, MAX_COLLAGE_PHOTOS))
      const n = selection.length

      // Bitmap-resolutie: onafhankelijk van formaat, zodat de cache geldig
      // blijft als de gebruiker tussen formaten wisselt
      const bitmapH = n <= 16 ? 1400 : n <= 60 ? 900 : 700

      // ── Foto's laden (één keer; hergebruikt bij opnieuw schudden) ──────────
      const bitmaps = bitmapsRef.current
      for (let i = 0; i < selection.length; i++) {
        if (!bitmaps.has(selection[i].id)) {
          setProgress(`Foto ${i + 1} van ${selection.length} laden...`)
          const res = await fetch(selection[i].url)
          if (!res.ok) throw new Error("download")
          const blob = await res.blob()
          const bitmap = await createImageBitmap(blob, {
            resizeHeight: bitmapH,
            resizeQuality: "high",
          })
          bitmaps.set(selection[i].id, bitmap)
        }
      }

      setProgress("Collage samenstellen...")

      // ── Vast uitvoerformaat: het mozaïek vult het gekozen formaat exact ────
      const aspect = FORMATS[fmt].aspect
      const canvasH = Math.round(CANVAS_W * aspect)
      const isLandscape = aspect < 1
      const headerH = isLandscape ? 230 : 300
      const footerH = isLandscape ? 80 : 120
      const bottomMargin = isLandscape ? 60 : MARGIN
      const gridW = CANVAS_W - 2 * MARGIN
      const gridH = canvasH - headerH - footerH - bottomMargin

      // Beste kolomaantal zoeken: cellen zo vierkant mogelijk. De celhoogte
      // volgt uit het aantal rijen dat het mozaïek oplevert, dus we proberen
      // een reeks kolomaantallen en houden de beste verdeling.
      let best: { tiles: MosaicTile[]; cols: number; rows: number; score: number } | null = null
      for (let c = 1; c <= 16; c++) {
        const candidate = buildMosaic(n, c)
        const rows = candidate.reduce((max, t) => Math.max(max, t.r + t.sr), 0)
        const cw = (gridW - (c - 1) * GAP) / c
        const ch = (gridH - (rows - 1) * GAP) / rows
        if (ch < 60) continue
        const score = Math.abs(Math.log(cw / ch))
        if (!best || score < best.score) best = { tiles: candidate, cols: c, rows, score }
      }
      if (!best) throw new Error("layout")
      const { tiles, cols, rows } = best
      const cellW = (gridW - (cols - 1) * GAP) / cols
      const cellH = (gridH - (rows - 1) * GAP) / rows

      // Elke tegel hoort bij precies één foto, in plaatsingsvolgorde
      const cells: LayoutCell[] = tiles.map((t, i) => ({
        bitmap: bitmaps.get(selection[i].id)!,
        x: MARGIN + t.c * (cellW + GAP),
        y: t.r * (cellH + GAP),
        w: t.sc * cellW + (t.sc - 1) * GAP,
        h: t.sr * cellH + (t.sr - 1) * GAP,
      }))

      // ── Canvas opbouwen: titel + foto's + credit, in themakleuren ──────────
      const serif = cormorantFamily()
      const canvas = document.createElement("canvas")
      canvas.width = CANVAS_W
      canvas.height = canvasH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("canvas")

      ctx.fillStyle = sc.bodyBg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Titel (verkleinen tot hij past)
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      let titleSize = isLandscape ? 90 : 110
      ctx.font = `600 ${titleSize}px ${serif}`
      while (ctx.measureText(eventTitle).width > gridW && titleSize > 48) {
        titleSize -= 6
        ctx.font = `600 ${titleSize}px ${serif}`
      }
      ctx.fillStyle = sc.headingColor
      ctx.fillText(eventTitle, CANVAS_W / 2, Math.round(headerH * 0.47))

      // Accentlijn met ruitje (zelfde motief als de site)
      const lineY = Math.round(headerH * 0.75)
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

      // Tegels: wit kader met zachte schaduw, afgeronde hoeken en cover-crop
      // (de foto vult de tegel volledig; wat niet past wordt bijgesneden)
      for (const item of cells) {
        const gx = item.x
        const gy = headerH + item.y

        ctx.save()
        ctx.shadowColor = "rgba(0,0,0,0.18)"
        ctx.shadowBlur = 18
        ctx.shadowOffsetY = 6
        ctx.fillStyle = "#ffffff"
        pathRoundRect(ctx, gx - 5, gy - 5, item.w + 10, item.h + 10, TILE_RADIUS + 5)
        ctx.fill()
        ctx.restore()

        ctx.save()
        pathRoundRect(ctx, gx, gy, item.w, item.h, TILE_RADIUS)
        ctx.clip()
        const scale = Math.max(item.w / item.bitmap.width, item.h / item.bitmap.height)
        const sw = item.w / scale
        const sh = item.h / scale
        const sx = (item.bitmap.width - sw) / 2
        const sy = (item.bitmap.height - sh) / 2
        ctx.drawImage(item.bitmap, sx, sy, sw, sh, gx, gy, item.w, item.h)
        ctx.restore()
      }

      // Credit onderin, gecentreerd in de voetzone
      ctx.font = `500 ${isLandscape ? 28 : 34}px ${serif}`
      ctx.fillStyle = sc.bodyText
      ctx.globalAlpha = 0.75
      ctx.fillText(
        "Gemaakt met SayingYes — sayingyes.nl",
        CANVAS_W / 2,
        headerH + gridH + Math.round((footerH + bottomMargin) / 2)
      )
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
    a.download = `collage-${slug}-${format}.jpg`
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

            {/* Formaatkeuze */}
            <div className="px-7 pt-5 flex flex-wrap justify-center gap-2">
              {(Object.keys(FORMATS) as FormatKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled={!!progress}
                  onClick={() => { setFormat(key); void generate(key) }}
                  className="px-3 py-2 rounded-xl text-left transition-all disabled:opacity-60"
                  style={{
                    border: `2px solid ${format === key ? "#C5A059" : GOLD_LIGHT}`,
                    backgroundColor: format === key ? "#FBF5E8" : "white",
                    cursor: "pointer",
                  }}
                >
                  <span className="block text-sm font-semibold" style={{ color: format === key ? CHARCOAL : BODY }}>
                    {FORMATS[key].label}
                  </span>
                  <span className="block text-xs" style={{ color: BODY, opacity: 0.75 }}>
                    {FORMATS[key].hint}
                  </span>
                </button>
              ))}
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
                onClick={() => void generate(format)}
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
