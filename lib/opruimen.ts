// Alles wat bij één bruiloft hoort weghalen: rijen én bestanden in de opslag.
//
// Eén plek voor twee wegen naar hetzelfde: de cron die verlopen concepten
// opruimt, en het bruidspaar dat zijn site zelf weggooit. Die twee liepen uit
// elkaar. De cron haalde de foto's weg maar de dashboardactie niet, en die
// liet ook de kaarten staan: rijen zonder bruiloft, met een deel-token dat
// nergens meer op uitkomt. Zulke wezen zie je niet en ze verdwijnen ook niet.

import type { createServiceClient } from "./supabase"
import { GUEST_PHOTOS_BUCKET } from "./guest-photos"

type Service = ReturnType<typeof createServiceClient>

const HERO_BUCKET = "hero-images"

/** Het pad binnen de bucket uit een publieke opslag-URL, of null. */
function padInBucket(url: string | null, bucket: string): string | null {
  if (typeof url !== "string" || !url.includes(`/${bucket}/`)) return null
  return url.split(`/${bucket}/`)[1]?.split("?")[0] ?? null
}

/**
 * De headerfoto van de site en de foto's op de kaarten weghalen. Alleen
 * bestanden uit onze eigen bucket; een externe URL laten we staan.
 */
export async function verwijderEventFotos(
  service: Service,
  eventId: string,
  heroImageUrl: string | null
): Promise<number> {
  const { data: cards } = await service.from("cards").select("content").eq("event_id", eventId)
  const urls = [
    heroImageUrl,
    ...(cards ?? []).map((c) => (c.content as { photoUrl?: string } | null)?.photoUrl ?? null),
  ]

  const paden = urls
    .map((u) => padInBucket(u, HERO_BUCKET))
    .filter((p): p is string => !!p)

  if (paden.length === 0) return 0
  const { error } = await service.storage.from(HERO_BUCKET).remove(paden)
  if (error) {
    console.error("[opruimen] Foto's verwijderen mislukt:", eventId, error.message)
    return 0
  }
  return paden.length
}

/** De gastenfoto's van de fotomuur, bestanden eerst en dan de rijen. */
export async function verwijderGastenfotos(service: Service, eventId: string): Promise<number> {
  const { data: fotos } = await service
    .from("guest_photos")
    .select("storage_path")
    .eq("event_id", eventId)

  if (!fotos || fotos.length === 0) return 0
  const paden = fotos.map((f) => f.storage_path as string).filter(Boolean)
  if (paden.length > 0) {
    const { error } = await service.storage.from(GUEST_PHOTOS_BUCKET).remove(paden)
    if (error) console.error("[opruimen] Gastenfoto's verwijderen mislukt:", eventId, error.message)
  }
  await service.from("guest_photos").delete().eq("event_id", eventId)
  return paden.length
}

/**
 * Alles van één bruiloft opruimen behalve de rij in events zelf: foto's,
 * kaarten, pagina's en aanmeldingen. De aanroeper verwijdert daarna het event,
 * met zijn eigen extra voorwaarde (status nog draft, of eigenaar).
 *
 * Bewust niet de facturen. Die horen bij de boekhouding en niet bij het
 * bruidspaar; wie zijn site weggooit hoort de administratie niet mee te nemen.
 *
 * Geeft terug hoeveel bestanden er weg zijn, voor de log van de cron.
 */
export async function verwijderEventInhoud(
  service: Service,
  eventId: string,
  heroImageUrl: string | null
): Promise<number> {
  const fotos = await verwijderEventFotos(service, eventId, heroImageUrl)
  const gastenfotos = await verwijderGastenfotos(service, eventId)

  // Kaarten en pagina's expliciet, ook als er een cascade op staat: daar wil je
  // niet van afhangen bij het weggooien van persoonsgegevens van gasten.
  await service.from("cards").delete().eq("event_id", eventId)
  await service.from("pages").delete().eq("event_id", eventId)
  await service.from("rsvp").delete().eq("event_id", eventId)

  return fotos + gastenfotos
}
