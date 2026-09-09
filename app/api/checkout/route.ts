import { createMollieClient } from "@mollie/api-client"
import { createServerClient } from "@supabase/ssr"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { PLANS, isPlan, normalizePlan, upgradePrice, type Plan } from "@/lib/plans"

export const dynamic = "force-dynamic"

async function validateDiscount(
  code: string,
  basePrice: number
): Promise<{ valid: boolean; type?: string; value?: number; finalAmount?: number }> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .single()

  if (!data) return { valid: false }
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false }
  if (data.max_uses != null && data.used_count >= data.max_uses) return { valid: false }

  let finalAmount = basePrice
  if (data.type === "fixed") {
    finalAmount = Math.max(0.01, Math.round((basePrice - Number(data.value)) * 100) / 100)
  } else if (data.type === "percentage") {
    finalAmount = Math.max(0.01, Math.round(basePrice * (1 - Number(data.value) / 100) * 100) / 100)
  }

  return { valid: true, type: data.type, value: Number(data.value), finalAmount }
}

async function ingelogdEmail(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies()
    const db = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data: { user } } = await db.auth.getUser()
    return user?.email ?? undefined
  } catch {
    return undefined
  }
}

// POST: Mollie-betaling starten. Twee varianten:
//   { event_id, plan, discount_code? }   eerste aankoop van een pakket
//   { event_id, upgrade_to }             verschil bijbetalen naar een hoger pakket
export async function POST(request: Request) {
  let body: { event_id: string; plan?: string; upgrade_to?: string; discount_code?: string }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige JSON body" }, { status: 400 })
  }

  const { event_id, discount_code } = body
  if (!event_id) {
    return Response.json({ error: "event_id is verplicht" }, { status: 400 })
  }

  const customerEmail = await ingelogdEmail()
  const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })
  const baseUrl = new URL(request.url).origin
  const webhookUrl = `${baseUrl}/api/webhook?token=${process.env.MOLLIE_WEBHOOK_SECRET}`

  // ── Upgrade: alleen het verschil betalen ────────────────────────────────
  if (body.upgrade_to) {
    if (!isPlan(body.upgrade_to)) {
      return Response.json({ error: "Onbekend pakket" }, { status: 400 })
    }
    const target: Plan = body.upgrade_to
    const supabase = createServiceClient()
    const { data: event } = await supabase
      .from("events")
      .select("id, plan, status, user_email")
      .eq("id", event_id)
      .single()

    if (!event) return Response.json({ error: "Event niet gevonden" }, { status: 404 })
    if (customerEmail && event.user_email !== customerEmail) {
      return Response.json({ error: "Geen toegang" }, { status: 403 })
    }
    if (!["published", "expired"].includes(event.status as string)) {
      return Response.json({ error: "Upgraden kan pas na de eerste aankoop" }, { status: 400 })
    }

    const bedrag = upgradePrice(event.plan, target)
    if (bedrag == null) {
      return Response.json({ error: "Dit pakket is geen upgrade ten opzichte van het huidige" }, { status: 400 })
    }

    const payment = await mollie.payments.create({
      amount: { currency: "EUR", value: bedrag.toFixed(2) },
      description: `SayingYes, upgrade naar ${PLANS[target].label}`,
      redirectUrl: `${baseUrl}/betalen?event_id=${event_id}&from=mollie&upgrade=${target}`,
      webhookUrl,
      metadata: { event_id, payment_type: "upgrade", plan: target },
      ...(customerEmail ? { billingEmail: customerEmail } : {}),
    })

    return Response.json({ url: payment._links.checkout?.href }, { status: 201 })
  }

  // ── Eerste aankoop van een pakket ───────────────────────────────────────
  const plan = normalizePlan(body.plan)
  const basePrice = PLANS[plan].price

  let paymentAmount = basePrice
  const metadata: Record<string, string> = { event_id, plan }

  if (discount_code) {
    const discount = await validateDiscount(discount_code, basePrice)
    if (discount.valid && discount.finalAmount != null) {
      paymentAmount = discount.finalAmount
      metadata.discount_code = discount_code.trim().toUpperCase()
    }
  }

  const payment = await mollie.payments.create({
    amount: { currency: "EUR", value: paymentAmount.toFixed(2) },
    description: `SayingYes, ${PLANS[plan].label}${discount_code ? ` | korting: ${discount_code}` : ""}`,
    redirectUrl: `${baseUrl}/betalen?event_id=${event_id}&from=mollie`,
    webhookUrl,
    metadata,
    ...(customerEmail ? { billingEmail: customerEmail } : {}),
  })

  return Response.json({ url: payment._links.checkout?.href }, { status: 201 })
}
