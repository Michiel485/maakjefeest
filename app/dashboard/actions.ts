"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { createServiceClient } from "@/lib/supabase"
import { verwijderEventInhoud } from "@/lib/opruimen"

export async function deleteEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Niet ingelogd" }

  const service = createServiceClient()

  const { data: event } = await service
    .from("events")
    .select("id, slug, status, user_email, hero_image_url")
    .eq("id", eventId)
    .single()

  if (!event) return { error: "Website niet gevonden" }
  if (event.user_email !== user.email) return { error: "Geen toegang" }
  if (event.status === "draft") return { error: "Gebruik de concepten-verwijderfunctie voor concepten" }

  // Foto's, kaarten, pagina's en aanmeldingen: dezelfde opruiming als de cron
  // gebruikt. Hier stonden eerder alleen de gastenfoto's, waardoor de
  // headerfoto en de kaartfoto's bleven staan en de kaartrijen als wezen
  // achterbleven.
  await verwijderEventInhoud(service, eventId, event.hero_image_url as string | null)

  // Facturen blijven expres staan. Die horen bij de boekhouding en moeten
  // jaren bewaard blijven, niet bij het bruidspaar dat zijn site weggooit. De
  // database is daar al op ingericht: de koppeling van invoices naar events
  // staat op ON DELETE SET NULL, dus de factuur blijft compleet achter met
  // event_id op null. Deze regel gooide ze weg voordat de database zijn werk
  // kon doen.

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
