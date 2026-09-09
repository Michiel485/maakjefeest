import { NextResponse } from "next/server"
import { createMollieClient } from "@mollie/api-client"
import type { Payment } from "@mollie/api-client"
import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase"
import { sendWebsiteLiveEmail, sendInvoiceEmail, sendPlanActivatedEmail } from "@/lib/mail"
import { generateInvoicePDF } from "@/lib/invoice-pdf"
import { PLANS, normalizePlan, planRank, planExpiry, isPlan } from "@/lib/plans"

export const dynamic = "force-dynamic"

const BTW_RATE = 21

function formatEur(n: number) {
  return n.toFixed(2).replace(".", ",")
}

function formatDate(d: Date) {
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })
}

// Factuur aanmaken op basis van het werkelijk betaalde bedrag: nummer, PDF in
// storage, rij in de database en de factuurmail. Wordt voor elke betaalsoort gebruikt.
async function verwerkFactuur(
  supabase: SupabaseClient,
  opts: {
    event_id: string
    payment: Payment
    description: string
    customerName: string
    customerEmail: string
    now: Date
  }
) {
  const { event_id, payment, description, customerName, customerEmail, now } = opts
  const year = now.getFullYear()

  const amountIncl = Math.round(parseFloat(payment.amount.value) * 100) / 100
  const amountExcl = Math.round((amountIncl / (1 + BTW_RATE / 100)) * 100) / 100
  const btwAmount  = Math.round((amountIncl - amountExcl) * 100) / 100
  const invoiceDate = formatDate(now)

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
  const invoiceNumber = `SY-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`

  let pdfBuffer: Buffer | undefined
  let pdfFilePath: string | undefined

  try {
    pdfBuffer = await generateInvoicePDF({
      invoiceNumber,
      invoiceDate,
      customerName,
      customerEmail,
      amountExcl:      formatEur(amountExcl),
      btwAmount:       formatEur(btwAmount),
      amountIncl:      formatEur(amountIncl),
      btwRate:         BTW_RATE,
      molliePaymentId: payment.id,
      description,
    })
    const pdfPath = `${year}/${invoiceNumber}.pdf`
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true })
    if (!uploadError) pdfFilePath = pdfPath
    else console.error("[webhook] PDF upload error:", uploadError)
  } catch (pdfErr) {
    console.error("[webhook] PDF generation error:", pdfErr)
  }

  const { error: invoiceError } = await supabase.from("invoices").insert({
    event_id,
    invoice_number:    invoiceNumber,
    customer_email:    customerEmail,
    customer_name:     customerName,
    description,
    amount_excl:       amountExcl,
    btw_amount:        btwAmount,
    amount_incl:       amountIncl,
    btw_rate:          BTW_RATE,
    date:              now.toISOString().split("T")[0],
    mollie_payment_id: payment.id,
    file_path:         pdfFilePath ?? null,
  })
  if (invoiceError) console.error("[webhook] invoice insert error:", invoiceError)

  if (customerEmail) {
    await sendInvoiceEmail({
      toEmail:         customerEmail,
      invoiceNumber,
      invoiceDate,
      customerName,
      amountExcl:      formatEur(amountExcl),
      btwAmount:       formatEur(btwAmount),
      amountIncl:      formatEur(amountIncl),
      molliePaymentId: payment.id,
      pdfBuffer,
    })
  }
}

export async function POST(request: Request) {
  // Verify webhook secret token
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  if (!token || token !== process.env.MOLLIE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let paymentId: string | null = null
  try {
    const text = await request.text()
    const params = new URLSearchParams(text)
    paymentId = params.get("id")
  } catch {
    return NextResponse.json({ error: "Ongeldige body" }, { status: 400 })
  }

  if (!paymentId) {
    return NextResponse.json({ error: "Geen payment id" }, { status: 400 })
  }

  const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })
  let payment: Payment
  try {
    payment = await mollie.payments.get(paymentId)
  } catch {
    return NextResponse.json({ error: "Betaling niet gevonden" }, { status: 400 })
  }

  if (payment.status !== "paid") {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const metadata = payment.metadata as {
    event_id?: string
    discount_code?: string
    payment_type?: string
    plan?: string
  } | null
  const event_id      = metadata?.event_id
  const discount_code = metadata?.discount_code
  const payment_type  = metadata?.payment_type ?? "initial"

  if (!event_id) {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const supabase = createServiceClient()
  const now      = new Date()

  // Idempotentie voor verlenging en upgrade: dezelfde Mollie-betaling nooit twee keer verwerken
  if (payment_type === "renewal" || payment_type === "upgrade") {
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("mollie_payment_id", payment.id)
      .maybeSingle()
    if (existingInvoice) {
      return NextResponse.json({ received: true }, { status: 200 })
    }
  }

  // ── Verlenging: expires_at zes maanden opschuiven ───────────────────────
  if (payment_type === "renewal") {
    const { data: eventRow } = await supabase
      .from("events")
      .select("expires_at, status, slug, user_email, title, frame_names")
      .eq("id", event_id)
      .single()

    if (eventRow) {
      const currentExpiry = eventRow.expires_at ? new Date(eventRow.expires_at as string) : now
      const baseDate      = currentExpiry > now ? currentExpiry : now
      const newExpiry     = new Date(baseDate)
      newExpiry.setMonth(newExpiry.getMonth() + 6)

      await supabase
        .from("events")
        .update({
          expires_at:               newExpiry.toISOString(),
          status:                   "published",
          renewal_reminder_sent_at: null,
          expiry_warning_sent_at:   null,
        })
        .eq("id", event_id)

      await verwerkFactuur(supabase, {
        event_id,
        payment,
        description: discount_code
          ? `SayingYes, verlenging 6 maanden (kortingscode: ${discount_code})`
          : "SayingYes, verlenging 6 maanden",
        customerName:  (eventRow.frame_names || eventRow.title || "") as string,
        customerEmail: (eventRow.user_email ?? "") as string,
        now,
      })

      if (eventRow.slug) revalidatePath(`/events/${eventRow.slug}`, "layout")
    }
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // ── Upgrade: hoger pakket activeren, geldigheid blijft ──────────────────
  if (payment_type === "upgrade") {
    if (!isPlan(metadata?.plan)) {
      return NextResponse.json({ received: true }, { status: 200 })
    }
    const target = metadata.plan

    const { data: eventRow } = await supabase
      .from("events")
      .select("plan, slug, user_email, title, frame_names")
      .eq("id", event_id)
      .single()

    if (eventRow) {
      if (planRank(target) > planRank(eventRow.plan)) {
        await supabase.from("events").update({ plan: target }).eq("id", event_id)
      }

      const names = (eventRow.frame_names || eventRow.title || "jullie") as string
      const email = (eventRow.user_email ?? "") as string

      await verwerkFactuur(supabase, {
        event_id,
        payment,
        description:   `Upgrade naar ${PLANS[target].label}`,
        customerName:  (eventRow.frame_names || eventRow.title || "") as string,
        customerEmail: email,
        now,
      })

      if (email && eventRow.slug) {
        if (target === "compleet") {
          await sendWebsiteLiveEmail(email, names, `https://${eventRow.slug}.sayingyes.nl`)
        } else {
          await sendPlanActivatedEmail({ toEmail: email, names, plan: target, slug: eventRow.slug as string, isUpgrade: true })
        }
      }

      if (eventRow.slug) revalidatePath(`/events/${eventRow.slug}`, "layout")
    }
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // ── Eerste aankoop: idempotentie via status ─────────────────────────────
  const { data: existing } = await supabase
    .from("events")
    .select("status, datum")
    .eq("id", event_id)
    .single()

  if (existing?.status === "published") {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const plan = normalizePlan(metadata?.plan)
  const expiresAt = planExpiry(now, existing?.datum as string | null)

  const { data: updatedEvent, error: updateError } = await supabase
    .from("events")
    .update({
      status:       "published",
      plan,
      published_at: now.toISOString(),
      expires_at:   expiresAt.toISOString(),
    })
    .eq("id", event_id)
    .select("slug, title, frame_names, user_email")
    .single()

  if (updateError) {
    console.error("[webhook] update error:", updateError)
    return NextResponse.json({ error: "DB update failed" }, { status: 500 })
  }

  if (updatedEvent?.slug) {
    revalidatePath(`/events/${updatedEvent.slug}`, "layout")
  }

  // Mark discount code as used
  if (discount_code) {
    const { data: codeRow } = await supabase
      .from("discount_codes")
      .select("id, used_count")
      .eq("code", discount_code)
      .single()
    if (codeRow) {
      await supabase
        .from("discount_codes")
        .update({ used_count: codeRow.used_count + 1 })
        .eq("id", codeRow.id)
    }
  }

  const customerName  = (updatedEvent?.frame_names || updatedEvent?.title || "") as string
  const customerEmail = (updatedEvent?.user_email || "") as string
  const names         = (updatedEvent?.frame_names || updatedEvent?.title || "jullie") as string

  await verwerkFactuur(supabase, {
    event_id,
    payment,
    description: discount_code
      ? `${PLANS[plan].invoiceDescription} (kortingscode: ${discount_code})`
      : PLANS[plan].invoiceDescription,
    customerName,
    customerEmail,
    now,
  })

  if (customerEmail && updatedEvent?.slug) {
    if (plan === "compleet") {
      await sendWebsiteLiveEmail(customerEmail, names, `https://${updatedEvent.slug}.sayingyes.nl`)
    } else {
      await sendPlanActivatedEmail({ toEmail: customerEmail, names, plan, slug: updatedEvent.slug, isUpgrade: false })
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
