import { createServiceClient } from "@/lib/supabase"
import { detectImageType } from "@/lib/guest-photos"
import { bezoekerIp, teVeelPogingen } from "@/lib/rem"

// Vercel neemt niet meer dan 4,5 MB per verzoek aan. De websitebouwer maakt
// een foto eerst kleiner (1920 pixels, WebP), dus meestal is hij een paar
// honderd kB.
const MAX_BYTES = 4 * 1024 * 1024

// POST: een foto uit de websitebouwer (de headerfoto en de foto's op de
// pagina's). Die uploadde eerst rechtstreeks vanuit de browser met de
// openbare sleutel. Daarvoor stond de map open voor iedereen: uploaden,
// overschrijven en weggooien, ook de foto's van andere klanten. Nu loopt het
// via de server, die alleen echte foto's aanneemt (28 september 2026).
//
// Ook zonder inloggen, want de websitebouwer werkt al voordat je een account
// hebt. Daarom een rem per bezoeker.
export async function POST(request: Request) {
  if (teVeelPogingen("upload-foto", bezoekerIp(request), 20)) {
    return Response.json({ error: "Even rustig aan, probeer het zo opnieuw" }, { status: 429 })
  }
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file || file.size === 0) {
      return Response.json({ error: "Geen bestand meegestuurd" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "Deze foto is te groot (max 4 MB)" }, { status: 413 })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const soort = detectImageType(bytes)
    if (!soort) {
      return Response.json({ error: "Dit bestand is geen ondersteunde foto (JPEG, PNG of WebP)" }, { status: 415 })
    }

    const supabase = createServiceClient()
    const pad = `site/${crypto.randomUUID()}.${soort.ext}`
    const { data, error } = await supabase.storage
      .from("hero-images")
      .upload(pad, bytes, { contentType: soort.mime })

    if (error || !data?.path) {
      console.error("[upload-hero]", error?.message ?? "geen pad teruggegeven")
      return Response.json({ error: "Upload mislukt, probeer opnieuw" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from("hero-images").getPublicUrl(data.path)
    return Response.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error("[upload-hero] uncaught:", err)
    return Response.json({ error: "Er ging iets mis, probeer opnieuw" }, { status: 500 })
  }
}
