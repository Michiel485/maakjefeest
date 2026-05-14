import { createServiceClient } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug") ?? ""

  if (!slug || slug.length < 3) {
    return Response.json({ available: false })
  }

  const supabase = createServiceClient()
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  return Response.json({ available: data === null })
}
