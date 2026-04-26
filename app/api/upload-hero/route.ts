import { createServiceClient } from "@/lib/supabase"

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file || file.size === 0) {
      return Response.json({ error: "Geen bestand meegestuurd" }, { status: 400 })
    }

    const ext = (file.name ?? "upload").split(".").pop()?.toLowerCase() ?? "jpg"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const contentType = file.type || MIME_MAP[ext] || "image/jpeg"

    const buffer = await file.arrayBuffer()

    const supabase = createServiceClient()

    const { data, error } = await supabase.storage
      .from("hero-images")
      .upload(filename, buffer, { contentType, upsert: true })

    if (error || !data?.path) {
      console.error("[upload-hero]", error?.message ?? "geen pad teruggegeven")
      return Response.json({ error: error?.message ?? "Upload mislukt" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from("hero-images").getPublicUrl(data.path)

    return Response.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error("[upload-hero] uncaught:", err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
