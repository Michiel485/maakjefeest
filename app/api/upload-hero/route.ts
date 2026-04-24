import { createServiceClient } from "@/lib/supabase"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return Response.json({ error: "Geen bestand meegestuurd" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from("hero-images")
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from("hero-images")
    .getPublicUrl(data.path)

  return Response.json({ url: publicUrl })
}
