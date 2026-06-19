import { createMollieClient } from "@mollie/api-client"
import { createServerClient } from "@supabase/ssr"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

const RENEWAL_BASE = 22.00

async function validateDiscount(code: string): Promise<{ valid: boolean; finalAmount?: number }> {
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
  // Free codes don't apply to renewals
  if (data.type === "free") return { valid: false }

  let finalAmount = RENEWAL_BASE
  if (data.type === "fixed") {
    finalAmount = Math.max(0.01, Math.round((RENEWAL_BASE - Number(data.value)) * 100) / 100)
  } else if (data.type === "percentage") {
    finalAmount = Math.max(0.01, Math.round(RENEWAL_BASE * (1 - Number(data.value) / 100) * 100) / 100)
  }

  return { valid: true, finalAmount }
}

export async function POST(request: Request) {
  let body: { event_id: string; discount_code?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige JSON body" }, { status: 400 })
  }

  const { event_id, discount_code } = body
  if (!event_id) {
    return Response.json({ error: "event_id is verplicht" }, { status: 400 })
  }

  // Verify the user owns this event
  let customerEmail: string | undefined
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
    if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })
    customerEmail = user.email
  } catch {
    return Response.json({ error: "Authenticatie mislukt" }, { status: 401 })
  }

  // Verify event belongs to this user
  const supabase = createServiceClient()
  const { data: event } = await supabase
    .from("events")
    .select("id, title, user_email")
    .eq("id", event_id)
    .eq("user_email", customerEmail)
    .single()

  if (!event) {
    return Response.json({ error: "Event niet gevonden" }, { status: 404 })
  }

  // Apply discount if provided
  let paymentAmount = RENEWAL_BASE
  const metadata: Record<string, string> = { event_id, payment_type: "renewal" }

  if (discount_code) {
    const discount = await validateDiscount(discount_code)
    if (discount.valid && discount.finalAmount != null) {
      paymentAmount = discount.finalAmount
      metadata.discount_code = discount_code.trim().toUpperCase()
    }
  }

  const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })
  const baseUrl = new URL(request.url).origin

  const payment = await mollie.payments.create({
    amount:      { currency: "EUR", value: paymentAmount.toFixed(2) },
    description: `SayingYes — verlenging 6 maanden (${event.title})${discount_code ? ` | korting: ${discount_code}` : ""}`,
    redirectUrl: `${baseUrl}/dashboard?renewed=1`,
    webhookUrl:  `${baseUrl}/api/webhook?token=${process.env.MOLLIE_WEBHOOK_SECRET}`,
    metadata,
    ...(customerEmail ? { billingEmail: customerEmail } : {}),
  })

  return Response.json({ url: payment._links.checkout?.href }, { status: 201 })
}
