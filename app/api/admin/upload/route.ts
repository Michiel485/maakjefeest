import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const { response } = await requireAdmin()
  if (response) return response

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) return Response.json({ error: "Geen bestand ontvangen" }, { status: 400 })

  const ext  = file.name.split(".").pop() ?? "bin"
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const supabase = createServiceClient()
  const { error } = await supabase.storage
    .from("expense-docs")
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ path }, { status: 201 })
}
