import { NextResponse } from "next/server"
import { createMollieClient } from "@mollie/api-client"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase"
import { sendWebsiteLiveEmail, sendInvoiceEmail } from "@/lib/mail"

export const dynamic = "force-dynamic"

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })

const AMOUNT_INCL = 49.99
const BTW_RATE    = 21
const AMOUNT_EXCL = Math.round((AMOUNT_INCL / (1 + BTW_RATE / 100)) * 100) / 100
const BTW_AMOUNT  = Math.round((AMOUNT_INCL - AMOUNT_EXCL) * 100) / 100

function formatEur(n: number) {
  return n.toFixed(2).replace(".", ",")
}

function formatDate(d: Date) {
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" })
}

export async function POST(request: Request) {
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

  let payment
  try {
    payment = await mollie.payments.get(paymentId)
  } catch {
    return NextResponse.json({ error: "Betaling niet gevonden" }, { status: 400 })
  }

  if (payment.status !== "paid") {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const metadata = payment.metadata as { event_id?: string } | null
  const event_id = metadata?.event_id

  if (!event_id) {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const supabase = createServiceClient()

  // Idempotency: skip if already published
  const { data: existing } = await supabase
    .from("events")
    .select("status")
    .eq("id", event_id)
    .single()

  if (existing?.status === "published") {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const { data: updatedEvent, error: updateError } = await supabase
    .from("events")
    .update({
      status: "published",
      stripe_payment_id: payment.id,
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

  // Create invoice record
  const now = new Date()
  const year = now.getFullYear()

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)

  const invoiceNum  = (count ?? 0) + 1
  const invoiceNumber = `SY-${year}-${String(invoiceNum).padStart(3, "0")}`
  const customerName  = updatedEvent?.frame_names || updatedEvent?.title || ""
  const customerEmail = updatedEvent?.user_email || ""

  const { error: invoiceError } = await supabase.from("invoices").insert({
    event_id,
    invoice_number:     invoiceNumber,
    customer_email:     customerEmail,
    customer_name:      customerName,
    description:        "Bruiloftswebsite — 1 jaar live",
    amount_excl:        AMOUNT_EXCL,
    btw_amount:         BTW_AMOUNT,
    amount_incl:        AMOUNT_INCL,
    btw_rate:           BTW_RATE,
    date:               now.toISOString().split("T")[0],
    mollie_payment_id:  payment.id,
  })

  if (invoiceError) {
    console.error("[webhook] invoice insert error:", invoiceError)
    // Don't fail the webhook — event is published, invoice can be retried
  }

  // Send invoice email + website live email
  if (customerEmail) {
    await Promise.all([
      sendInvoiceEmail({
        toEmail:          customerEmail,
        invoiceNumber,
        invoiceDate:      formatDate(now),
        customerName,
        amountExcl:       formatEur(AMOUNT_EXCL),
        btwAmount:        formatEur(BTW_AMOUNT),
        amountIncl:       formatEur(AMOUNT_INCL),
        molliePaymentId:  payment.id,
      }),
      sendWebsiteLiveEmail(
        customerEmail,
        updatedEvent?.frame_names || updatedEvent?.title || "jullie",
        `https://${updatedEvent?.slug}.sayingyes.nl`
      ),
    ])
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
