import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function requireAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    return { user: null, response: NextResponse.json({ error: "Niet geconfigureerd" }, { status: 500 }) }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return { user: null, response: NextResponse.json({ error: "Geen toegang" }, { status: 401 }) }
  }

  return { user, response: null }
}
