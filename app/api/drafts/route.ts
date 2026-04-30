import { createServerClient } from "@supabase/ssr"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function toSlug(naam: string): string {
  return naam
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uniqueSlug(base: string): Promise<string> {
  const service = createServiceClient()
  const { data } = await service
    .from("events")
    .select("slug")
    .or(`slug.eq.${base},slug.like.${base}-*`)

  const taken = new Set((data ?? []).map((r: { slug: string }) => r.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

const PAGE_TITLES: Record<string, string> = {
  home: "Home",
  programma: "Programma",
  rsvp: "RSVP",
  praktisch: "Praktisch",
  wishlist: "Wishlist",
  fotos: "Foto's",
  ceremoniemeesters: "Ceremoniemeesters",
}

// GET /api/drafts — list all events for the logged-in user
export async function GET() {
  const user = await getUser()
  if (!user?.email) {
    return Response.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from("events")
    .select("id, slug, title, type, status, created_at")
    .eq("user_email", user.email)
    .order("created_at", { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// POST /api/drafts — create or update a draft event
export async function POST(request: Request) {
  const user = await getUser()
  if (!user?.email) {
    return Response.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  let body: {
    type: string
    naam: string
    datum?: string
    locatie?: string
    style?: string
    hero_image_url?: string | null
    nav_layout?: string
    pages: string[]
    content?: Record<string, Record<string, unknown>>
    event_id?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige JSON body" }, { status: 400 })
  }

  const {
    type,
    naam,
    datum = "",
    locatie = "",
    style = "roze",
    hero_image_url = null,
    nav_layout = "split",
    pages,
    content = {},
    event_id,
  } = body

  if (!type || !naam) {
    return Response.json({ error: "Verplichte velden ontbreken" }, { status: 400 })
  }

  const service = createServiceClient()
  const pageList = Array.isArray(pages) && pages.length > 0 ? pages : ["home", "rsvp"]

  // Update existing draft if event_id provided and belongs to this user
  if (event_id) {
    const { data: existing } = await service
      .from("events")
      .select("id, slug, status")
      .eq("id", event_id)
      .eq("user_email", user.email)
      .single()

    if (existing && existing.status === "draft") {
      await service
        .from("events")
        .update({ type, title: naam, datum, locatie, style, hero_image_url, nav_layout })
        .eq("id", event_id)

      await service.from("pages").delete().eq("event_id", event_id)

      const pageRows = pageList.map((t, i) => ({
        event_id,
        type: t,
        title: PAGE_TITLES[t] ?? t,
        content: content[t] ?? {},
        is_enabled: true,
        order: i,
      }))
      await service.from("pages").insert(pageRows)

      return Response.json({ id: event_id, slug: existing.slug })
    }
  }

  // Create new draft
  const slug = await uniqueSlug(toSlug(naam || "mijn-feest"))
  const { data: event, error: eventError } = await service
    .from("events")
    .insert({
      type,
      title: naam,
      datum,
      locatie,
      user_email: user.email,
      slug,
      status: "draft",
      style,
      hero_image_url,
      nav_layout,
    })
    .select("id, slug")
    .single()

  if (eventError) return Response.json({ error: eventError.message }, { status: 500 })

  const pageRows = pageList.map((t, i) => ({
    event_id: event.id,
    type: t,
    title: PAGE_TITLES[t] ?? t,
    content: content[t] ?? {},
    is_enabled: true,
    order: i,
  }))
  await service.from("pages").insert(pageRows)

  return Response.json({ id: event.id, slug: event.slug }, { status: 201 })
}
