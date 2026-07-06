// Client-side beeldhulpjes (browser only)

// Hercodeer via canvas: verkleint naar maxLongSide, jpeg. Stript EXIF en
// converteert HEIC → JPEG op iPhones (Safari decodeert HEIC native).
export async function compressImage(
  file: File,
  maxLongSide = 1600,
  quality = 0.85
): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("Kon deze foto niet lezen"))
      el.src = url
    })
    const scale = Math.min(1, maxLongSide / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Kon deze foto niet verwerken")
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    )
    if (!blob) throw new Error("Kon deze foto niet verwerken")
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
