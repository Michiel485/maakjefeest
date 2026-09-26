import { createServiceClient } from "@/lib/supabase"
import { PLANS, isPlan, normalizePlan, upgradePrice } from "@/lib/plans"
import { bezoekerIp, teVeelPogingen } from "@/lib/rem"

export const dynamic = "force-dynamic"

// GET /api/discount?code=...&plan=...  Controleert een kortingscode en rekent
// het eindbedrag uit voor het gekozen pakket (standaard: compleet).
// Met &van=... is het een upgrade: dan telt de korting over het verschil
// (Michiel, 26 september 2026: bij een upgrade kon je geen code opgeven).
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")?.trim().toUpperCase()
  if (!code) return Response.json({ valid: false, reason: "Geen code opgegeven" })

  // Zonder rem is dit een orakel: een script kan hier zo snel als het wil
  // codes aflopen tot het er een vindt. Twintig pogingen per minuut is ruim
  // voor iemand die zijn code intikt en nutteloos voor een script.
  if (teVeelPogingen("discount", bezoekerIp(request), 20)) {
    return Response.json(
      { valid: false, reason: "Te veel pogingen. Wacht even en probeer het opnieuw." },
      { status: 429 }
    )
  }

  const plan = normalizePlan(url.searchParams.get("plan"))
  const van = url.searchParams.get("van")
  const verschil = isPlan(van) ? upgradePrice(van, plan) : null
  if (isPlan(van) && verschil == null) return Response.json({ valid: false, reason: "Dit pakket is geen upgrade" })
  const basePrice = verschil ?? PLANS[plan].price

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
