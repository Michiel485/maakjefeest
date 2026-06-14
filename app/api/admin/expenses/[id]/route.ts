import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

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
