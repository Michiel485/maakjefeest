import { sendMagicLink, sendSignupWelcomeMagicLink } from "@/lib/mail"

// Supabase Auth Hooks use the Standard Webhooks spec:
// https://docs.svix.com/receiving/verifying-payloads/how
//
// Signed content : "{webhook-id}.{webhook-timestamp}.{raw-body}"
// HMAC-SHA256 key: base64-decode the part after "whsec_" in the secret
// Signature header: "webhook-signature: v1,<base64-encoded-sig>"
async function verifyHookSignature(request: Request, rawBody: string): Promise<boolean> {
  const secret = process.env.SUPABASE_HOOK_SECRET
  if (!secret) {
    console.warn("[send-email] SUPABASE_HOOK_SECRET not set — skipping verification")
    return true
  }

  const msgId        = request.headers.get("webhook-id")
  const msgTimestamp = request.headers.get("webhook-timestamp")
  const msgSignature = request.headers.get("webhook-signature")

  if (!msgId || !msgTimestamp || !msgSignature) {
    console.error("[send-email] Missing Standard Webhooks headers")
    return false
  }

  try {
    // Secret format: "v1,whsec_<base64>" — strip everything before the base64 part
    const base64Secret = secret.replace(/^v\d+,whsec_/, "").replace(/^whsec_/, "")
    const secretBytes  = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0))

    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const signedContent = `${msgId}.${msgTimestamp}.${rawBody}`
    const sigBuffer     = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent))
    const computed      = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))

    // Header may contain multiple space-separated signatures: "v1,sigA v1,sigB"
    return msgSignature.split(" ").some((entry) => {
      const value = entry.split(",")[1]
      return value === computed
    })
  } catch (err) {
    console.error("[send-email] Signature verification error:", err)
    return false
  }
}

interface HookPayload {
  user: {
    email: string
    email_confirmed_at: string | null
  }
  email_data: {
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
  }
}

export async function POST(request: Request) {
  // Read raw body first — needed for signature verification
  const rawBody = await request.text()

  const verified = await verifyHookSignature(request, rawBody)
  if (!verified) {
    console.error("[send-email] Invalid hook signature — request rejected")
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: HookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { user, email_data } = payload
  const { token_hash, redirect_to, email_action_type, site_url } = email_data

  if (!["magiclink", "signup"].includes(email_action_type)) {
    return Response.json({ message: "Unhandled email action type" }, { status: 200 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? site_url
  const magicLink =
    `${supabaseUrl}/auth/v1/verify` +
    `?token=${token_hash}&type=${email_action_type}` +
    `&redirect_to=${encodeURIComponent(redirect_to)}`

  // Supabase always sends email_action_type "magiclink" for signInWithOtp(),
  // even for brand-new users. The only reliable way to distinguish new from
  // returning is email_confirmed_at: null means never confirmed = new user.
  const isNewUser = !user.email_confirmed_at

  const result = isNewUser
    ? await sendSignupWelcomeMagicLink({ toEmail: user.email, magicLink })
    : await sendMagicLink({ toEmail: user.email, magicLink })

  if (!result.success) {
    return Response.json({ error: "Failed to send email" }, { status: 500 })
  }

  return Response.json({ message: "Email sent" }, { status: 200 })
}
