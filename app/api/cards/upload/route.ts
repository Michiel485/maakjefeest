import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { detectImageType } from "@/lib/guest-photos"

const MAX_SIZE_BYTES = 8 * 1024 * 1024

// POST: kaartfoto uploaden (alleen ingelogd). Gaat naar de bestaande
// publieke hero-images bucket, onder een eigen prefix.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file || file.size === 0) {
      return Response.json({ error: "Geen bestand meegestuurd" }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json({ error: "Deze foto is te groot (max 8 MB)" }, { status: 413 })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const imageType = detectImageType(bytes)
    if (!imageType) {
      return Response.json(
        { error: "Dit bestand is geen ondersteunde foto (JPEG, PNG of WebP)" },
        { status: 415 }
      )
    }

    const service = createServiceClient()
    const path = `kaarten/${crypto.randomUUID()}.${imageType.ext}`
    const { data, error } = await service.storage
      .from("hero-images")
      .upload(path, bytes, { contentType: imageType.mime })

    if (error || !data?.path) {
      console.error("[cards/upload]", error?.message)
      return Response.json({ error: "Upload mislukt, probeer opnieuw" }, { status: 500 })
    }

    const { data: urlData } = service.storage.from("hero-images").getPublicUrl(data.path)
    return Response.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error("[cards/upload] uncaught:", err)
    return Response.json({ error: "Er ging iets mis, probeer opnieuw" }, { status: 500 })
  }
}
