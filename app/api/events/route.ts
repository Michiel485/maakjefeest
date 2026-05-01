import { createServiceClient } from "@/lib/supabase"

const supabase = createServiceClient()

function toSlug(naam: string): string {
  return naam
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uniqueSlug(base: string): Promise<string> {
  const { data } = await supabase
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
  home:              "Home",
  programma:         "Programma",
  rsvp:              "RSVP",
  praktisch:         "Praktisch",
  wishlist:          "Wishlist",
  fotos:             "Foto's",
  ceremoniemeesters: "Ceremoniemeesters",
}

export async function POST(request: Request) {
  let body: {
    type: string
    naam: string
    datum: string
    locatie: string
    email: string
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
    type, naam, datum, locatie, email,
    style = "roze", hero_image_url = null, nav_layout = "split",
    pages, content = {}, event_id,
  } = body

  if (!type || !naam || !email) {
    return Response.json({ error: "Verplichte velden ontbreken" }, { status: 400 })
  }

  const pageList: string[] = Array.isArray(pages) && pages.length > 0 ? pages : ["home", "rsvp"]

  // ── Update existing event (draft already saved) ──────────────────────────────
  if (event_id) {
    const { data: existing } = await supabase
      .from("events")
      .select("id, slug, user_email")
      .eq("id", event_id)
      .single()

    if (!existing || existing.user_email !== email) {
      return Response.json({ error: "Evenement niet gevonden" }, { status: 404 })
    }

    const { error: updateErr } = await supabase
      .from("events")
      .update({ type, title: naam, datum, locatie, style, hero_image_url, nav_layout })
      .eq("id", event_id)

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 })

    await supabase.from("pages").delete().eq("event_id", event_id)

    const pageRows = pageList.map((t, i) => ({
      event_id,
      type: t,
      title: PAGE_TITLES[t] ?? t,
      content: content[t] ?? {},
      is_enabled: true,
      order: i,
    }))
    const { error: pagesErr } = await supabase.from("pages").insert(pageRows)
    if (pagesErr) return Response.json({ error: pagesErr.message }, { status: 500 })

    return Response.json({ id: existing.id, slug: existing.slug })
  }

  // ── Create new event ─────────────────────────────────────────────────────────
  if (!datum || !locatie) {
    return Response.json({ error: "Verplichte velden ontbreken" }, { status: 400 })
  }

  const slug = await uniqueSlug(toSlug(naam))

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({ type, title: naam, datum, locatie, user_email: email, slug, status: "draft", style, hero_image_url, nav_layout })
    .select("id, slug")
    .single()

  if (eventError) return Response.json({ error: eventError.message }, { status: 500 })

  const pageRows = pageList.map((t, i) => ({
    event_id:   event.id,
    type:       t,
    title:      PAGE_TITLES[t] ?? t,
    content:    content[t] ?? {},
    is_enabled: true,
    order:      i,
  }))

  const { error: pagesError } = await supabase.from("pages").insert(pageRows)
  if (pagesError) return Response.json({ error: pagesError.message }, { status: 500 })

  return Response.json({ id: event.id, slug: event.slug }, { status: 201 })
}
