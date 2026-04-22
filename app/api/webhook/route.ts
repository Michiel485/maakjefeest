import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase"

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

    await supabase
      .from("events")
      .update({
        status: "published",
        stripe_payment_id: session.payment_intent as string,
      })
      .eq("id", event_id)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
