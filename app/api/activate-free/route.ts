import { createServiceClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { sendWebsiteLiveEmail } from "@/lib/mail"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { event_id: string; code: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige body" }, { status: 400 })
  }

  const { event_id, code } = body
  if (!event_id || !code) {
    return Response.json({ error: "event_id en code zijn verplicht" }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Validate code (same checks as /api/discount)
  const { data: codeRow } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .eq("type", "free")
    .single()

  if (!codeRow) return Response.json({ error: "Ongeldige kortingscode" }, { status: 400 })
  if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
    return Response.json({ error: "Kortingscode is verlopen" }, { status: 400 })
  }
  if (codeRow.max_uses != null && codeRow.used_count >= codeRow.max_uses) {
    return Response.json({ error: "Kortingscode is al gebruikt" }, { status: 400 })
  }

  // Idempotency: skip if already published
  const { data: existing } = await supabase.from("events").select("status").eq("id", event_id).single()
  if (existing?.status === "published") {
    return Response.json({ ok: true })
  }

  // Publish event
  const now = new Date()
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

  if (updateError) return Response.json({ error: "DB update mislukt" }, { status: 500 })

  if (updatedEvent?.slug) revalidatePath(`/events/${updatedEvent.slug}`, "layout")

  // Mark code used
  await supabase
    .from("discount_codes")
    .update({ used_count: codeRow.used_count + 1 })
    .eq("id", codeRow.id)

  // Create €0 invoice record for bookkeeping
  const year = now.getFullYear()
  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)

  const invoiceNumber = `SY-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`
  await supabase.from("invoices").insert({
    event_id,
    invoice_number:    invoiceNumber,
    customer_email:    updatedEvent?.user_email ?? "",
    customer_name:     updatedEvent?.frame_names || updatedEvent?.title || "",
    description:       `Bruiloftswebsite — 1 jaar live (kortingscode: ${code})`,
    amount_excl:       0,
    btw_amount:        0,
    amount_incl:       0,
    btw_rate:          21,
    date:              now.toISOString().split("T")[0],
    mollie_payment_id: `free:${code}`,
  })

  // Send website live email
  if (updatedEvent?.user_email && updatedEvent?.slug) {
    await sendWebsiteLiveEmail(
      updatedEvent.user_email,
      updatedEvent.frame_names || updatedEvent.title || "jullie",
      `https://${updatedEvent.slug}.sayingyes.nl`
    )
  }

  return Response.json({ ok: true })
}
