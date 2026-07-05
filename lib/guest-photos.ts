// Gedeelde config en helpers voor de gastenfotomuur

export const GUEST_PHOTOS_BUCKET = "guest-photos"

export const MAX_NAME_LENGTH = 60
export const MAX_CAPTION_LENGTH = 200

export function maxPhotosPerEvent(): number {
  const n = Number(process.env.GUEST_PHOTOS_MAX_PER_EVENT)
  return Number.isFinite(n) && n > 0 ? n : 500
}

export function maxPhotoSizeBytes(): number {
  const mb = Number(process.env.GUEST_PHOTOS_MAX_SIZE_MB)
  return (Number.isFinite(mb) && mb > 0 ? mb : 5) * 1024 * 1024
}

export function rateLimitPerMinute(): number {
  const n = Number(process.env.GUEST_PHOTOS_RATE_LIMIT)
  return Number.isFinite(n) && n > 0 ? n : 20
}

// ── Magic bytes: bepaal het échte beeldformaat, negeer wat de client claimt ──
export function detectImageType(bytes: Uint8Array): { ext: string; mime: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" }
  }
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { ext: "png", mime: "image/png" }
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" }
  }
  return null
}

// ── Sliding-window rate limiter, in-memory per serverless instance ──────────
const uploadHits = new Map<string, number[]>()
const WINDOW_MS = 60_000

export function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (uploadHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= rateLimitPerMinute()) {
    uploadHits.set(ip, recent)
    return true
  }
  recent.push(now)
  uploadHits.set(ip, recent)
  if (uploadHits.size > 5000) {
    for (const [key, times] of uploadHits) {
      if (times.every((t) => now - t >= WINDOW_MS)) uploadHits.delete(key)
    }
  }
  return false
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}
