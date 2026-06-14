import { createMollieClient } from "@mollie/api-client"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! })

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

  // Pre-fill checkout with the logged-in user's email
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

  const payment = await mollie.payments.create({
    amount: { currency: "EUR", value: "49.99" },
    description: "Saying Yes — bruiloftswebsite (1 jaar live)",
    redirectUrl: `${baseUrl}/betalen?event_id=${event_id}&from=mollie`,
    webhookUrl: `${baseUrl}/api/webhook`,
    metadata: { event_id },
  })

  return Response.json({ url: payment._links.checkout?.href }, { status: 201 })
}
