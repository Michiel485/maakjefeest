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

export async function POST(request: Request) {
  let body: {
    type: string
    naam: string
    datum: string
    locatie: string
    email: string
    pages: string[]
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige JSON body" }, { status: 400 })
  }

  const { type, naam, datum, locatie, email, pages } = body

  if (!type || !naam || !datum || !locatie || !email) {
    return Response.json({ error: "Verplichte velden ontbreken" }, { status: 400 })
  }

  const slug = await uniqueSlug(toSlug(naam))

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({ type, title: naam, datum, locatie, user_email: email, slug, status: "draft" })
    .select("id, slug")
    .single()

  if (eventError) {
    return Response.json({ error: eventError.message }, { status: 500 })
  }

  const PAGE_TITLES: Record<string, string> = {
    home:      "Home",
    programma: "Programma",
    rsvp:      "RSVP",
    praktisch: "Praktisch",
    wishlist:  "Wishlist",
    fotos:     "Foto's",
  }

  const pageList: string[] = Array.isArray(pages) && pages.length > 0
    ? pages
    : ["home", "rsvp"]

  const pageRows = pageList.map((type, index) => ({
    event_id:   event.id,
    type,
    title:      PAGE_TITLES[type] ?? type,
    content:    {},
    is_enabled: true,
    order:      index,
  }))

  const { error: pagesError } = await supabase.from("pages").insert(pageRows)

  if (pagesError) {
    return Response.json({ error: pagesError.message }, { status: 500 })
  }

  return Response.json({ id: event.id, slug: event.slug }, { status: 201 })
}
