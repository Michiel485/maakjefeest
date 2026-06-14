import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  const { response } = await requireAdmin()
  if (response) return response

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  const { response } = await requireAdmin()
  if (response) return response

  let body: {
    code: string
    type: "free" | "fixed" | "percentage"
    value: number
    max_uses?: number | null
    expires_at?: string | null
    notes?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige body" }, { status: 400 })
  }

  const code = body.code.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, "")
  if (!code || code.length < 3) {
    return Response.json({ error: "Code moet minimaal 3 tekens bevatten (A-Z, 0-9)" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("discount_codes")
    .insert({
      code,
      type:       body.type,
      value:      body.value,
      max_uses:   body.max_uses ?? null,
      expires_at: body.expires_at ?? null,
      notes:      body.notes ?? null,
      is_active:  true,
      used_count: 0,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") return Response.json({ error: "Deze code bestaat al" }, { status: 409 })
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
