"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { createServiceClient } from "@/lib/supabase"
import { GUEST_PHOTOS_BUCKET } from "@/lib/guest-photos"

export async function deleteEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Niet ingelogd" }

  const service = createServiceClient()

  const { data: event } = await service
    .from("events")
    .select("id, slug, status, user_email")
    .eq("id", eventId)
    .single()

  if (!event) return { error: "Website niet gevonden" }
  if (event.user_email !== user.email) return { error: "Geen toegang" }
  if (event.status === "draft") return { error: "Gebruik de concepten-verwijderfunctie voor concepten" }

  // Gastenfoto's: eerst de storage-objecten opruimen, dan de rijen
  const { data: guestPhotos } = await service
    .from("guest_photos")
    .select("storage_path")
    .eq("event_id", eventId)
  if (guestPhotos && guestPhotos.length > 0) {
    await service.storage
      .from(GUEST_PHOTOS_BUCKET)
      .remove(guestPhotos.map((p) => p.storage_path))
    await service.from("guest_photos").delete().eq("event_id", eventId)
  }

  await service.from("rsvp").delete().eq("event_id", eventId)
  await service.from("pages").delete().eq("event_id", eventId)
  await service.from("invoices").delete().eq("event_id", eventId)

  const { error } = await service.from("events").delete().eq("id", eventId).eq("user_email", user.email)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return {}
}

export async function updateGuestPhotoSettings(
  eventId: string,
  settings: { enabled: boolean; moderation: "live" | "approve" }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Niet ingelogd" }

  const service = createServiceClient()

  const { data: event } = await service
    .from("events")
    .select("id, user_email")
    .eq("id", eventId)
    .single()

  if (!event) return { error: "Website niet gevonden" }
  if (event.user_email !== user.email) return { error: "Geen toegang" }

  const { error } = await service
    .from("events")
    .update({
      guest_photos_enabled: settings.enabled,
      guest_photos_moderation: settings.moderation,
    })
    .eq("id", eventId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return {}
}

export async function deleteDraft(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Niet ingelogd" }

  const service = createServiceClient()

  // Verify the event belongs to this user AND is still a draft
  const { data: event } = await service
    .from("events")
    .select("id, status, user_email")
    .eq("id", eventId)
    .single()

  if (!event) return { error: "Concept niet gevonden" }
  if (event.user_email !== user.email) return { error: "Geen toegang" }
  if (event.status !== "draft") return { error: "Alleen concepten kunnen worden verwijderd" }

  const { error } = await service.from("events").delete().eq("id", eventId)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return {}
}
