import { createMollieClient } from "@mollie/api-client"
import { createServerClient } from "@supabase/ssr"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { PLANS, isPlan, normalizePlan, planRank, upgradePrice, type Plan } from "@/lib/plans"
import { verversEvent } from "@/lib/db"
import { sendWebsiteLiveEmail, sendPlanActivatedEmail } from "@/lib/mail"

export const dynamic = "force-dynamic"

async function validateDiscount(
  code: string,
  basePrice: number
): Promise<{ valid: boolean; type?: string; value?: number; finalAmount?: number; id?: string; used_count?: number }> {
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

  return { valid: true, type: data.type, value: Number(data.value), finalAmount, id: data.id as string, used_count: Number(data.used_count ?? 0) }
}

/**
 * Een upgrade met een 100%-code: het hogere pakket zonder betaling, zoals
 * /api/activate-free dat doet voor een eerste aankoop. Met een factuur van
 * nul euro voor de boekhouding en dezelfde mail als na een betaalde upgrade.
 */
async function gratisUpgrade(
  supabase: ReturnType<typeof createServiceClient>,
  opts: { event_id: string; target: Plan; code: string; codeId: string; gebruikt: number }
) {
  const { event_id, target, code } = opts
  const now = new Date()
  const { data: eventRow } = await supabase
    .from("events")
    .select("plan, slug, user_email, title, frame_names")
    .eq("id", event_id)
    .single()
  if (!eventRow) return
  if (planRank(target) > planRank(eventRow.plan)) {
    await supabase.from("events").update({ plan: target }).eq("id", event_id)
  }
  await supabase.from("discount_codes").update({ used_count: opts.gebruikt + 1 }).eq("id", opts.codeId)

  const year = now.getFullYear()
  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
  await supabase.from("invoices").insert({
    event_id,
    invoice_number:    `SY-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`,
    customer_email:    eventRow.user_email ?? "",
    customer_name:     eventRow.frame_names || eventRow.title || "",
    description:       `Upgrade naar ${PLANS[target].label} (kortingscode: ${code})`,
    amount_excl:       0,
    btw_amount:        0,
    amount_incl:       0,
    btw_rate:          21,
    date:              now.toISOString().split("T")[0],
    mollie_payment_id: `free-upgrade:${code}:${event_id}`,
  })

  const names = (eventRow.frame_names || eventRow.title || "jullie") as string
  const email = (eventRow.user_email ?? "") as string
  if (email && eventRow.slug) {
    if (target === "compleet") {
      await sendWebsiteLiveEmail(email, names, `https://${eventRow.slug}.sayingyes.nl`)
    } else {
      await sendPlanActivatedEmail({ toEmail: email, names, plan: target, slug: eventRow.slug as string, isUpgrade: true })
    }
  }
  await verversEvent(eventRow.slug as string | null)
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
//   { event_id, upgrade_to, discount_code? }  verschil bijbetalen naar een hoger pakket
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

  // ── Al betaald? Dan is een groter pakket altijd een upgrade ─────────────
  // Knoppen in het dashboard en de bouwers stuurden naar de kassa met
  // plan=... en niet met upgrade=..., en dan rekende deze route het volle
  // bedrag, ook als de Save the Date al betaald was (gevonden 24 september
  // 2026). Hier, op één plek, zodat geen enkele route dubbel kan laten
  // betalen.
  if (!body.upgrade_to && isPlan(body.plan)) {
    const { data: huidig } = await createServiceClient()
      .from("events")
      .select("plan, status")
      .eq("id", event_id)
      .single()
    if (huidig && ["published", "expired"].includes(huidig.status as string)) {
      if (upgradePrice(huidig.plan, body.plan) == null) {
        return Response.json({ error: "Dit pakket hebben jullie al." }, { status: 400 })
      }
      body.upgrade_to = body.plan
    }
  }

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

    // Een kortingscode telt over het verschil (Michiel, 26 september 2026)
    let teBetalen = bedrag
    const upgradeMeta: Record<string, string> = { event_id, payment_type: "upgrade", plan: target }
    const code = discount_code?.trim().toUpperCase()
    if (code) {
      const korting = await validateDiscount(code, bedrag)
      if (korting.valid && korting.type === "free") {
        // Gratis upgraden: geen betaling, meteen het hogere pakket. Alleen
        // voor de eigenaar zelf, anders kan iedereen met een code en een
        // event_id andermans pakket ophogen.
        if (!customerEmail || event.user_email !== customerEmail) {
          return Response.json({ error: "Log in om deze code te gebruiken" }, { status: 403 })
        }
        await gratisUpgrade(supabase, { event_id, target, code, codeId: korting.id!, gebruikt: korting.used_count ?? 0 })
        return Response.json({ free: true }, { status: 200 })
      }
      if (korting.valid && korting.finalAmount != null) {
        teBetalen = korting.finalAmount
        upgradeMeta.discount_code = code
      }
    }

    const payment = await mollie.payments.create({
      amount: { currency: "EUR", value: teBetalen.toFixed(2) },
      description: `SayingYes, upgrade naar ${PLANS[target].label}${upgradeMeta.discount_code ? ` | korting: ${upgradeMeta.discount_code}` : ""}`,
      redirectUrl: `${baseUrl}/betalen?event_id=${event_id}&from=mollie&upgrade=${target}`,
      webhookUrl,
      metadata: upgradeMeta,
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
