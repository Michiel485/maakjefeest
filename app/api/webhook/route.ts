import { NextResponse } from "next/server"
import { createMollieClient } from "@mollie/api-client"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase"
import { sendWebsiteLiveEmail } from "@/lib/mail"

export const dynamic = "force-dynamic"

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })

export async function POST(request: Request) {
  // Mollie stuurt een form-encoded body met alleen het payment id: id=tr_xxxxxxxx
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

  // Verifieer de betaalstatus via de Mollie API (nooit vertrouwen op de body zelf)
  let payment
  try {
    payment = await mollie.payments.get(paymentId)
  } catch {
    return NextResponse.json({ error: "Betaling niet gevonden" }, { status: 400 })
  }

  // Alleen verwerken als betaling daadwerkelijk geslaagd is
  if (payment.status !== "paid") {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const metadata = payment.metadata as { event_id?: string } | null
  const event_id = metadata?.event_id

  if (!event_id) {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const supabase = createServiceClient()

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

  if (updatedEvent?.slug && updatedEvent?.user_email) {
    const websiteUrl = `https://${updatedEvent.slug}.sayingyes.nl`
    const names = updatedEvent.frame_names || updatedEvent.title || "jullie"
    await sendWebsiteLiveEmail(updatedEvent.user_email, names, websiteUrl)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
