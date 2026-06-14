import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  const { response } = await requireAdmin()
  if (response) return response

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Generate signed URLs for files
  const rows = await Promise.all(
    (data ?? []).map(async row => {
      if (!row.file_path) return row
      const { data: signed } = await supabase.storage
        .from("expense-docs")
        .createSignedUrl(row.file_path, 3600)
      return { ...row, file_url: signed?.signedUrl ?? null }
    })
  )

  return Response.json(rows)
}

export async function POST(request: Request) {
  const { response } = await requireAdmin()
  if (response) return response

  let body: {
    description: string
    supplier?: string
    category: string
    amount_excl: number
    btw_amount: number
    amount_incl: number
    btw_rate?: number
    date: string
    file_path?: string
    notes?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige body" }, { status: 400 })
  }

  const { description, supplier, category, amount_excl, btw_amount, amount_incl, btw_rate, date, file_path, notes } = body

  if (!description || !category || !date || amount_incl == null) {
    return Response.json({ error: "Verplichte velden ontbreken" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("expenses")
    .insert({ description, supplier, category, amount_excl, btw_amount, amount_incl, btw_rate: btw_rate ?? 21, date, file_path, notes })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
