import { createServiceClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ event_id: string }> }
) {
  const { event_id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("events")
    .select("id, slug, type, title, status, datum, locatie")
    .eq("id", event_id)
    .single()

  if (error || !data) {
    return Response.json({ error: "Event niet gevonden" }, { status: 404 })
  }

  return Response.json(data)
}
