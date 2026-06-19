"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { createServiceClient } from "@/lib/supabase"

export async function togglePause(eventId: string): Promise<{ status?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Niet ingelogd" }

  const service = createServiceClient()

  const { data: event } = await service
    .from("events")
    .select("id, slug, status, expires_at, user_email")
    .eq("id", eventId)
    .single()

  if (!event) return { error: "Website niet gevonden" }
  if (event.user_email !== user.email) return { error: "Geen toegang" }

  if (event.status === "published") {
    const { error } = await service.from("events").update({ status: "paused" }).eq("id", eventId)
    if (error) return { error: error.message }
    revalidatePath(`/events/${event.slug}`, "layout")
    revalidatePath("/dashboard")
    return { status: "paused" }
  }

  if (event.status === "paused") {
    const now = new Date()
    const expiresAt = event.expires_at ? new Date(event.expires_at as string) : null
    if (!expiresAt || expiresAt <= now) {
      return { error: "Abonnement verlopen — verleng eerst om de site weer online te zetten." }
    }
    const { error } = await service.from("events").update({ status: "published" }).eq("id", eventId)
    if (error) return { error: error.message }
    revalidatePath(`/events/${event.slug}`, "layout")
    revalidatePath("/dashboard")
    return { status: "published" }
  }

  return { error: "Ongeldige status" }
}

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

  await service.from("rsvp").delete().eq("event_id", eventId)
  await service.from("pages").delete().eq("event_id", eventId)
  await service.from("invoices").delete().eq("event_id", eventId)

  const { error } = await service.from("events").delete().eq("id", eventId).eq("user_email", user.email)
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
