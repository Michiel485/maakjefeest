import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin()
  if (response) return response

  const { id } = await params

  let body: {
    description?: string
    supplier?: string
    category?: string
    amount_excl?: number
    btw_amount?: number
    amount_incl?: number
    btw_rate?: number
    date?: string
    file_path?: string
    notes?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige body" }, { status: 400 })
  }

  // Only include fields that were actually provided
  const allowed = ["description", "supplier", "category", "amount_excl", "btw_amount", "amount_incl", "btw_rate", "date", "file_path", "notes"] as const
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Geen velden om bij te werken" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("expenses")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin()
  if (response) return response

  const { id } = await params
  const supabase = createServiceClient()

  // Remove file from storage if present
  const { data: row } = await supabase.from("expenses").select("file_path").eq("id", id).single()
  if (row?.file_path) {
    await supabase.storage.from("expense-docs").remove([row.file_path])
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ deleted: true })
}
