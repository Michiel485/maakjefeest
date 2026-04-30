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
      className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
    >
      Uitloggen
    </button>
  )
}
