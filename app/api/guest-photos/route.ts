import { createServiceClient } from "@/lib/supabase"
import {
  GUEST_PHOTOS_BUCKET,
  MAX_CAPTION_LENGTH,
  MAX_NAME_LENGTH,
  clientIp,
  detectImageType,
  isRateLimited,
  maxPhotoSizeBytes,
  maxPhotosPerEvent,
} from "@/lib/guest-photos"

export const dynamic = "force-dynamic"

// ── POST: gast uploadt één foto (multipart form) ─────────────────────────────
export async function POST(request: Request) {
  try {
    if (isRateLimited(clientIp(request))) {
      return Response.json(
        { error: "Even rustig aan — probeer het over een minuutje opnieuw." },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const eventId = formData.get("event_id")
    const rawName = formData.get("name")
    const rawCaption = formData.get("caption")
    const file = formData.get("file") as File | null

    if (typeof eventId !== "string" || !eventId) {
      return Response.json({ error: "event_id is verplicht" }, { status: 400 })
    }
    const name = typeof rawName === "string" ? rawName.trim().slice(0, MAX_NAME_LENGTH) : ""
    if (!name) {
      return Response.json({ error: "Vul je naam in" }, { status: 400 })
    }
    const caption =
      typeof rawCaption === "string" && rawCaption.trim()
        ? rawCaption.trim().slice(0, MAX_CAPTION_LENGTH)
        : null
    if (!file || file.size === 0) {
      return Response.json({ error: "Geen foto meegestuurd" }, { status: 400 })
    }
    if (file.size > maxPhotoSizeBytes()) {
      const mb = Math.round(maxPhotoSizeBytes() / 1024 / 1024)
      return Response.json(
        { error: `Deze foto is te groot (max ${mb} MB). Probeer een kleinere foto.` },
        { status: 413 }
      )
    }

    const supabase = createServiceClient()

    const { data: event } = await supabase
      .from("events")
      .select("id, guest_photos_enabled, guest_photos_moderation")
      .eq("id", eventId)
      .eq("status", "published")
      .single()

    if (!event || !event.guest_photos_enabled) {
      return Response.json({ error: "De fotomuur is niet beschikbaar voor dit event" }, { status: 404 })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const imageType = detectImageType(bytes)
    if (!imageType) {
      return Response.json(
        { error: "Dit bestand is geen ondersteunde foto. Alleen JPEG, PNG of WebP kan geüpload worden." },
        { status: 415 }
      )
    }

    const { count } = await supabase
      .from("guest_photos")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)

    if ((count ?? 0) >= maxPhotosPerEvent()) {
      return Response.json(
        { error: "De fotomuur zit vol — er kunnen geen foto's meer bij. 📸" },
        { status: 409 }
      )
    }

    const path = `${event.id}/${crypto.randomUUID()}.${imageType.ext}`
    let upload = await supabase.storage
      .from(GUEST_PHOTOS_BUCKET)
      .upload(path, bytes, { contentType: imageType.mime })

    // Bucket bestaat nog niet → aanmaken (public read) en opnieuw proberen
    if (upload.error && /bucket not found/i.test(upload.error.message ?? "")) {
      await supabase.storage.createBucket(GUEST_PHOTOS_BUCKET, { public: true })
      upload = await supabase.storage
        .from(GUEST_PHOTOS_BUCKET)
        .upload(path, bytes, { contentType: imageType.mime })
    }

    if (upload.error || !upload.data?.path) {
      console.error("[guest-photos] upload:", upload.error?.message)
      return Response.json({ error: "Upload mislukt, probeer het opnieuw" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(GUEST_PHOTOS_BUCKET).getPublicUrl(upload.data.path)
    const status = event.guest_photos_moderation === "approve" ? "pending" : "approved"

    const { error: insertError } = await supabase.from("guest_photos").insert({
      event_id: event.id,
      name,
      caption,
      storage_path: upload.data.path,
      url: urlData.publicUrl,
      status,
    })

    if (insertError) {
      console.error("[guest-photos] insert:", insertError.message)
      await supabase.storage.from(GUEST_PHOTOS_BUCKET).remove([upload.data.path])
      return Response.json({ error: "Kon de foto niet opslaan, probeer het opnieuw" }, { status: 500 })
    }

    return Response.json({ success: true, status }, { status: 201 })
  } catch (err) {
    console.error("[guest-photos] uncaught:", err)
    return Response.json({ error: "Er ging iets mis, probeer het opnieuw" }, { status: 500 })
  }
}

// ── GET: goedgekeurde foto's van een event (fotomuur + slideshow-polling) ────
export async function GET(request: Request) {
  const eventId = new URL(request.url).searchParams.get("event_id")
  if (!eventId) {
    return Response.json({ error: "event_id is verplicht" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, guest_photos_enabled")
    .eq("id", eventId)
    .eq("status", "published")
    .single()

  if (!event || !event.guest_photos_enabled) {
    return Response.json({ error: "Niet gevonden" }, { status: 404 })
  }

  const { data: photos, error } = await supabase
    .from("guest_photos")
    .select("id, name, caption, url, created_at")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(maxPhotosPerEvent())

  if (error) {
    console.error("[guest-photos] list:", error.message)
    return Response.json({ error: "Kon foto's niet ophalen" }, { status: 500 })
  }

  return Response.json({ photos: photos ?? [] })
}
