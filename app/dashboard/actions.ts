"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { createServiceClient } from "@/lib/supabase"

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
