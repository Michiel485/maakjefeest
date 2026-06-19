import { createMollieClient } from "@mollie/api-client"
import { createServerClient } from "@supabase/ssr"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

const RENEWAL_PRICE = 22.00

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

  const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })
  const baseUrl = new URL(request.url).origin

  const payment = await mollie.payments.create({
    amount:      { currency: "EUR", value: RENEWAL_PRICE.toFixed(2) },
    description: `SayingYes — verlenging 6 maanden (${event.title})`,
    redirectUrl: `${baseUrl}/dashboard?renewed=1`,
    webhookUrl:  `${baseUrl}/api/webhook`,
    metadata:    { event_id, payment_type: "renewal" },
    ...(customerEmail ? { billingEmail: customerEmail } : {}),
  })

  return Response.json({ url: payment._links.checkout?.href }, { status: 201 })
}
