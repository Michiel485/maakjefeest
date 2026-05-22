"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push("/")
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-medium transition-colors"
      style={{ color: "#8A7E72" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#C5A059")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#8A7E72")}
    >
      Uitloggen
    </button>
  )
}
