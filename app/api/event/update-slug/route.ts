import { createServerClient } from "@supabase/ssr"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function PATCH(request: Request) {
  // Auth check
  const cookieStore = await cookies()
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await db.auth.getUser()
  if (!user?.email) {
    return Response.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  let body: { eventId: string; newSlug: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige JSON" }, { status: 400 })
  }

  const { eventId, newSlug: rawSlug } = body
  if (!eventId || !rawSlug?.trim()) {
    return Response.json({ error: "eventId en newSlug zijn verplicht" }, { status: 400 })
  }

  const newSlug = toSlug(rawSlug.trim())
  if (newSlug.length < 3) {
    return Response.json({ error: "URL moet minimaal 3 tekens bevatten" }, { status: 400 })
  }

  const service = createServiceClient()

  // Verify the event belongs to this user
  const { data: existing } = await service
    .from("events")
    .select("id, slug, user_email")
    .eq("id", eventId)
    .single()

  if (!existing) {
    return Response.json({ error: "Event niet gevonden" }, { status: 404 })
  }
  if (existing.user_email !== user.email) {
    return Response.json({ error: "Geen toegang tot dit event" }, { status: 403 })
  }

  // No-op if slug unchanged
  if (existing.slug === newSlug) {
    return Response.json({ slug: newSlug })
  }

  // Check availability
  const { data: taken } = await service
    .from("events")
    .select("id")
    .eq("slug", newSlug)
    .neq("id", eventId)
    .maybeSingle()

  if (taken) {
    return Response.json({ error: "Deze URL is helaas al in gebruik. Kies een andere." }, { status: 400 })
  }

  // Update
  const { error: updateErr } = await service
    .from("events")
    .update({ slug: newSlug })
    .eq("id", eventId)

  if (updateErr) {
    console.error("[update-slug] update error:", updateErr)
    return Response.json({ error: "Kon URL niet bijwerken" }, { status: 500 })
  }

  console.log("[update-slug] slug updated:", existing.slug, "→", newSlug, "for event:", eventId)
  return Response.json({ slug: newSlug })
}
