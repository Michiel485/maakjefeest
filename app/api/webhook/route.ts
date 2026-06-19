import { NextResponse } from "next/server"
import { createMollieClient } from "@mollie/api-client"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase"
import { sendWebsiteLiveEmail, sendInvoiceEmail } from "@/lib/mail"
import { generateInvoicePDF } from "@/lib/invoice-pdf"

export const dynamic = "force-dynamic"

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

  const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })
  let payment
  try {
    payment = await mollie.payments.get(paymentId)
  } catch {
    return NextResponse.json({ error: "Betaling niet gevonden" }, { status: 400 })
  }

  if (payment.status !== "paid") {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const metadata      = payment.metadata as { event_id?: string; discount_code?: string; payment_type?: string } | null
  const event_id      = metadata?.event_id
  const discount_code = metadata?.discount_code
  const payment_type  = metadata?.payment_type ?? "initial"

  if (!event_id) {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const supabase = createServiceClient()
  const now      = new Date()

  // ── Renewal payment: extend expires_at by 6 months ───────────────────────
  if (payment_type === "renewal") {
    // Idempotency: skip if this Mollie payment was already processed
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("mollie_payment_id", payment.id)
      .maybeSingle()

    if (existingInvoice) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const { data: eventRow } = await supabase
      .from("events")
      .select("expires_at, status, slug, user_email, title, frame_names")
      .eq("id", event_id)
      .single()

    if (eventRow) {
      const currentExpiry  = eventRow.expires_at ? new Date(eventRow.expires_at as string) : now
      const baseDate       = currentExpiry > now ? currentExpiry : now
      const newExpiry      = new Date(baseDate)
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

      // Record renewal invoice + PDF + email
      const renewalYear        = now.getFullYear()
      const renewalAmountExcl  = 18.18
      const renewalBtwAmount   = 3.82
      const renewalAmountIncl  = 22.00
      const renewalBtwRate     = 21
      const renewalDescription = "SayingYes — verlenging 6 maanden"
      const renewalCustomerName  = (eventRow.frame_names || eventRow.title || "") as string
      const renewalCustomerEmail = (eventRow.user_email ?? "") as string
      const renewalInvoiceDate   = formatDate(now)

      const { count: invCount } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${renewalYear}-01-01`)
      const renewalInvoiceNumber = `SY-${renewalYear}-${String((invCount ?? 0) + 1).padStart(3, "0")}`

      let renewalPdfBuffer: Buffer | undefined
      let renewalPdfPath: string | undefined

      try {
        renewalPdfBuffer = await generateInvoicePDF({
          invoiceNumber:   renewalInvoiceNumber,
          invoiceDate:     renewalInvoiceDate,
          customerName:    renewalCustomerName,
          customerEmail:   renewalCustomerEmail,
          amountExcl:      formatEur(renewalAmountExcl),
          btwAmount:       formatEur(renewalBtwAmount),
          amountIncl:      formatEur(renewalAmountIncl),
          btwRate:         renewalBtwRate,
          molliePaymentId: payment.id,
          description:     renewalDescription,
        })
        const pdfPath = `${renewalYear}/${renewalInvoiceNumber}.pdf`
        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(pdfPath, renewalPdfBuffer, { contentType: "application/pdf", upsert: true })
        if (!uploadError) renewalPdfPath = pdfPath
        else console.error("[webhook/renewal] PDF upload error:", uploadError)
      } catch (pdfErr) {
        console.error("[webhook/renewal] PDF generation error:", pdfErr)
      }

      await supabase.from("invoices").insert({
        event_id,
        invoice_number:    renewalInvoiceNumber,
        customer_email:    renewalCustomerEmail,
        customer_name:     renewalCustomerName,
        description:       renewalDescription,
        amount_excl:       renewalAmountExcl,
        btw_amount:        renewalBtwAmount,
        amount_incl:       renewalAmountIncl,
        btw_rate:          renewalBtwRate,
        date:              now.toISOString().split("T")[0],
        mollie_payment_id: payment.id,
        file_path:         renewalPdfPath ?? null,
      })

      if (renewalCustomerEmail) {
        await sendInvoiceEmail({
          toEmail:         renewalCustomerEmail,
          invoiceNumber:   renewalInvoiceNumber,
          invoiceDate:     renewalInvoiceDate,
          customerName:    renewalCustomerName,
          amountExcl:      formatEur(renewalAmountExcl),
          btwAmount:       formatEur(renewalBtwAmount),
          amountIncl:      formatEur(renewalAmountIncl),
          molliePaymentId: payment.id,
          pdfBuffer:       renewalPdfBuffer,
        })
      }

      if (eventRow.slug) revalidatePath(`/events/${eventRow.slug}`, "layout")
    }
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // ── Initial payment: idempotency check ───────────────────────────────────
  const { data: existing } = await supabase
    .from("events")
    .select("status")
    .eq("id", event_id)
    .single()

  if (existing?.status === "published") {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const { data: updatedEvent, error: updateError } = await supabase
    .from("events")
    .update({
      status:       "published",
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

  // Create invoice record
  const year = now.getFullYear()

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)

  const invoiceNum  = (count ?? 0) + 1
  const invoiceNumber = `SY-${year}-${String(invoiceNum).padStart(3, "0")}`
  const customerName  = updatedEvent?.frame_names || updatedEvent?.title || ""
  const customerEmail = updatedEvent?.user_email || ""

  // Generate PDF — gebruik het werkelijk betaalde bedrag (kan lager zijn door kortingscode)
  const paidAmountIncl = Math.round(parseFloat(payment.amount.value) * 100) / 100
  const paidAmountExcl = Math.round((paidAmountIncl / (1 + BTW_RATE / 100)) * 100) / 100
  const paidBtwAmount  = Math.round((paidAmountIncl - paidAmountExcl) * 100) / 100

  const invoiceDate = formatDate(now)
  const description = discount_code
    ? `Bruiloftswebsite — 1 jaar live (kortingscode: ${discount_code})`
    : "Bruiloftswebsite — 1 jaar live"
  let pdfBuffer: Buffer | undefined
  let pdfFilePath: string | undefined

  try {
    pdfBuffer = await generateInvoicePDF({
      invoiceNumber,
      invoiceDate,
      customerName,
      customerEmail,
      amountExcl:      formatEur(paidAmountExcl),
      btwAmount:       formatEur(paidBtwAmount),
      amountIncl:      formatEur(paidAmountIncl),
      btwRate:         BTW_RATE,
      molliePaymentId: payment.id,
      description,
    })

    // Upload PDF to Supabase Storage
    const pdfPath = `${year}/${invoiceNumber}.pdf`
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true })

    if (!uploadError) pdfFilePath = pdfPath
    else console.error("[webhook] PDF upload error:", uploadError)
  } catch (pdfErr) {
    console.error("[webhook] PDF generation error:", pdfErr)
  }

  // Store invoice in DB
  const { error: invoiceError } = await supabase.from("invoices").insert({
    event_id,
    invoice_number:    invoiceNumber,
    customer_email:    customerEmail,
    customer_name:     customerName,
    description,
    amount_excl:       paidAmountExcl,
    btw_amount:        paidBtwAmount,
    amount_incl:       paidAmountIncl,
    btw_rate:          BTW_RATE,
    date:              now.toISOString().split("T")[0],
    mollie_payment_id: payment.id,
    file_path:         pdfFilePath ?? null,
  })

  if (invoiceError) {
    console.error("[webhook] invoice insert error:", invoiceError)
  }

  // Send invoice email + website live email
  if (customerEmail) {
    await Promise.all([
      sendInvoiceEmail({
        toEmail:         customerEmail,
        invoiceNumber,
        invoiceDate,
        customerName,
        amountExcl:      formatEur(paidAmountExcl),
        btwAmount:       formatEur(paidBtwAmount),
        amountIncl:      formatEur(paidAmountIncl),
        molliePaymentId: payment.id,
        pdfBuffer,
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
