import { createServerClient } from "@supabase/ssr"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"

async function getAuthUser() {
  const cookieStore = await cookies()
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    }
  )
  const { data: { user } } = await db.auth.getUser()
  return user
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ event_id: string }> }
) {
  const { event_id } = await params
  const user = await getAuthUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const service = createServiceClient()

  const { data: event } = await service
    .from("events")
    .select("id, slug, type, title, datum, locatie, style, font_hero, font_initials, font_frame_names, font_page_titles, hero_image_url, hero_overlay, nav_layout, nav_title, use_frame, frame_style, initials, frame_names, frame_location, frame_initials_size, frame_names_size, frame_date_size, frame_location_size, hero_image_pos_x, hero_image_pos_y, status, homepage_settings, pw_enabled, pw_type, pw_value, pw_question, pw_answer")
    .eq("id", event_id)
    .eq("user_email", user.email)
    .single()

  if (!event) return Response.json({ error: "Niet gevonden" }, { status: 404 })

  // Track last activity so the cleanup cron knows when the user was last active
  await service
    .from("events")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", event_id)
    .eq("status", "draft") // only touch drafts; published sites don't need this

  const { data: pages } = await service
    .from("pages")
    .select("type, content, is_enabled, order")
    .eq("event_id", event_id)
    .order("order")

  return Response.json({ event, pages: pages ?? [] })
}
