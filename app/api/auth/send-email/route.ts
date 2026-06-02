import { sendMagicLink } from "@/lib/mail"

// Verifies the HMAC-SHA256 JWT that Supabase attaches to every hook request.
async function verifyHookSignature(authHeader: string | null): Promise<boolean> {
  const secret = process.env.SUPABASE_HOOK_SECRET
  if (!secret) {
    console.warn("[send-email] SUPABASE_HOOK_SECRET not set — skipping verification")
    return true
  }
  if (!authHeader?.startsWith("Bearer ")) return false

  const token = authHeader.slice(7)
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [headerB64, payloadB64, sigB64] = parts

  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )
    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    )
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      enc.encode(`${headerB64}.${payloadB64}`)
    )
  } catch {
    return false
  }
}

interface HookPayload {
  user: { email: string }
  email_data: {
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  const verified = await verifyHookSignature(authHeader)

  if (!verified) {
    console.error("[send-email] Invalid hook signature")
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: HookPayload
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { user, email_data } = payload
  const { token_hash, redirect_to, email_action_type, site_url } = email_data

  // Only handle magic link and signup flows
  if (!["magiclink", "signup"].includes(email_action_type)) {
    return Response.json({ message: "Unhandled email action type" }, { status: 200 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? site_url
  const magicLink =
    `${supabaseUrl}/auth/v1/verify` +
    `?token=${token_hash}&type=${email_action_type}` +
    `&redirect_to=${encodeURIComponent(redirect_to)}`

  const result = await sendMagicLink({
    toEmail:   user.email,
    magicLink,
  })

  if (!result.success) {
    // Return 500 so Supabase can retry
    return Response.json({ error: "Failed to send email" }, { status: 500 })
  }

  // Supabase expects a 200 response to confirm the hook succeeded
  return Response.json({ message: "Email sent" }, { status: 200 })
}
