import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  let body: { event_id: string }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Ongeldige JSON body" }, { status: 400 })
  }

  const { event_id } = body

  if (!event_id) {
    return Response.json({ error: "event_id is verplicht" }, { status: 400 })
  }

  // Pre-fill Stripe checkout with the logged-in user's email
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
    if (user?.email) customerEmail = user.email
  } catch {}

  const baseUrl = new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "ideal"],
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: 2400,
          product_data: {
            name: "Saying Yes — bruiloftswebsite",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/succes?event_id=${event_id}`,
    cancel_url: `${baseUrl}/betalen?event_id=${event_id}`,
    metadata: { event_id },
  })

  return Response.json({ url: session.url }, { status: 201 })
}
