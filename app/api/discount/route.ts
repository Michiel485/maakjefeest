import { createServiceClient } from "@/lib/supabase"
import { PLANS, normalizePlan } from "@/lib/plans"

export const dynamic = "force-dynamic"

// GET /api/discount?code=...&plan=...  Controleert een kortingscode en rekent
// het eindbedrag uit voor het gekozen pakket (standaard: compleet).
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")?.trim().toUpperCase()
  if (!code) return Response.json({ valid: false, reason: "Geen code opgegeven" })

  const basePrice = PLANS[normalizePlan(url.searchParams.get("plan"))].price

  const supabase = createServiceClient()
  const { data } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single()

  if (!data) return Response.json({ valid: false, reason: "Kortingscode niet gevonden" })

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return Response.json({ valid: false, reason: "Deze kortingscode is verlopen" })
  }

  if (data.max_uses != null && data.used_count >= data.max_uses) {
    return Response.json({ valid: false, reason: "Deze kortingscode is al volledig gebruikt" })
  }

  let finalAmount = basePrice
  let label = ""

  if (data.type === "free") {
    finalAmount = 0
    label = "100% gratis"
  } else if (data.type === "fixed") {
    finalAmount = Math.max(0, Math.round((basePrice - Number(data.value)) * 100) / 100)
    label = `€${Number(data.value).toFixed(2).replace(".", ",")} korting`
  } else if (data.type === "percentage") {
    finalAmount = Math.round(basePrice * (1 - Number(data.value) / 100) * 100) / 100
    label = `${Number(data.value)}% korting`
  }

  return Response.json({ valid: true, type: data.type, value: Number(data.value), finalAmount, label, code })
}
