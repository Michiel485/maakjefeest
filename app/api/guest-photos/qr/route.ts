import QRCode from "qrcode"
import { createServiceClient } from "@/lib/supabase"
import { eventSiteUrl } from "@/lib/site-url"

export const dynamic = "force-dynamic"

// GET: QR-code als kale PNG (download). De QR wijst naar de publieke
// upload-pagina, dus hier is geen login voor nodig.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get("slug")
  if (!slug) {
    return Response.json({ error: "slug is verplicht" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: event } = await supabase
    .from("events")
    .select("id, guest_photos_enabled")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event || !event.guest_photos_enabled) {
    return Response.json({ error: "Niet gevonden" }, { status: 404 })
  }

  // In productie een absolute subdomein-URL; in dev relatief → origin ervoor
  const siteUrl = eventSiteUrl(slug)
  const target = siteUrl.startsWith("/") ? `${url.origin}${siteUrl}/foto-delen` : `${siteUrl}/foto-delen`

  const png = await QRCode.toBuffer(target, {
    type: "png",
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#FFFFFF" },
  })

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-fotomuur-${slug}.png"`,
      "Cache-Control": "no-store",
    },
  })
}
