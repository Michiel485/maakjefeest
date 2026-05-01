import { createServerClient } from "@supabase/ssr"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"

async function getAuthClient() {
  const cookieStore = await cookies()
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await db.auth.getUser()
  return { db, user }
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
  // Service role needed to check slugs across ALL events (including other users' drafts)
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
  const { db, user } = await getAuthClient()
  if (!user?.email) {
    return Response.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const { data, error } = await db
    .from("events")
    .select("id, slug, title, type, status, created_at")
    .eq("user_email", user.email)
    .order("created_at", { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// POST /api/drafts — create or update a draft event
export async function POST(request: Request) {
  const { db, user } = await getAuthClient()
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

  const pageList = Array.isArray(pages) && pages.length > 0 ? pages : ["home", "rsvp"]

  // Update existing event if event_id provided and belongs to this user
  if (event_id) {
    console.log("[drafts] update poging voor event_id:", event_id, "user:", user.email)
    const { data: existing } = await db
      .from("events")
      .select("id, slug, status")
      .eq("id", event_id)
      .single()

    console.log("[drafts] gevonden event:", existing)

    if (existing) {
      const { error: updateErr } = await db
        .from("events")
        .update({ type, title: naam, datum, locatie, style, hero_image_url, nav_layout })
        .eq("id", event_id)

      if (updateErr) {
        console.error("[drafts] update fout:", updateErr)
        return Response.json({ error: updateErr.message }, { status: 500 })
      }

      await db.from("pages").delete().eq("event_id", event_id)

      const pageRows = pageList.map((t, i) => ({
        event_id,
        type: t,
        title: PAGE_TITLES[t] ?? t,
        content: content[t] ?? {},
        is_enabled: true,
        order: i,
      }))
      const { error: pagesErr } = await db.from("pages").insert(pageRows)
      if (pagesErr) {
        console.error("[drafts] pages insert fout:", pagesErr)
        return Response.json({ error: pagesErr.message }, { status: 500 })
      }

      console.log("[drafts] update succesvol, id:", event_id, "slug:", existing.slug)
      return Response.json({ id: event_id, slug: existing.slug })
    }

    console.warn("[drafts] event_id opgegeven maar niet gevonden, maak nieuw event aan")
  }

  // Create new draft
  console.log("[drafts] nieuw event aanmaken voor user:", user.email)
  const slug = await uniqueSlug(toSlug(naam || "mijn-feest"))
  const { data: event, error: eventError } = await db
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

  if (eventError) {
    console.error("[drafts] nieuw event fout:", eventError)
    return Response.json({ error: eventError.message }, { status: 500 })
  }

  const pageRows = pageList.map((t, i) => ({
    event_id: event.id,
    type: t,
    title: PAGE_TITLES[t] ?? t,
    content: content[t] ?? {},
    is_enabled: true,
    order: i,
  }))
  const { error: pagesErr } = await db.from("pages").insert(pageRows)
  if (pagesErr) {
    console.error("[drafts] pages insert fout:", pagesErr)
    return Response.json({ error: pagesErr.message }, { status: 500 })
  }

  console.log("[drafts] nieuw event aangemaakt, id:", event.id, "slug:", event.slug)
  return Response.json({ id: event.id, slug: event.slug }, { status: 201 })
}
