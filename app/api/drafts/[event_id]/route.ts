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
    .select("id, slug, type, title, datum, locatie, style, hero_image_url, nav_layout, nav_title, use_frame, frame_style, initials, frame_names, frame_location, hero_image_pos_x, hero_image_pos_y, status")
    .eq("id", event_id)
    .eq("user_email", user.email)
    .single()

  if (!event) return Response.json({ error: "Niet gevonden" }, { status: 404 })

  const { data: pages } = await service
    .from("pages")
    .select("type, content, is_enabled, order")
    .eq("event_id", event_id)
    .order("order")

  return Response.json({ event, pages: pages ?? [] })
}
