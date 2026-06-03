import { NextResponse } from "next/server"
import Stripe from "stripe"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase"
import { sendWebsiteLiveEmail } from "@/lib/mail"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Geen signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: "Ongeldige webhook signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const event_id = session.metadata?.event_id

    if (!event_id) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const supabase = createServiceClient()

    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({
        status: "published",
        stripe_payment_id: session.payment_intent as string,
      })
      .eq("id", event_id)
      .select("slug, title, user_email")
      .single()

    if (updateError) {
      console.error("[webhook] update error:", updateError)
      return NextResponse.json({ error: "DB update failed" }, { status: 500 })
    }

    if (updatedEvent?.slug) {
      revalidatePath(`/events/${updatedEvent.slug}`, "layout")
    }

    if (updatedEvent?.slug && updatedEvent?.user_email) {
      const websiteUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://sayingyes.nl"}/events/${updatedEvent.slug}`
      await sendWebsiteLiveEmail(
        updatedEvent.user_email,
        updatedEvent.title ?? "jullie",
        websiteUrl
      )
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
