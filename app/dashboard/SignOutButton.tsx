"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { wisBruiloftUitBrowser } from "@/lib/browser-opslag"

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await createClient().auth.signOut()
    wisBruiloftUitBrowser()
    router.push("/")
    // Anders houdt de app de serverpagina's van je ingelogde sessie nog even
    // in de cache en zie je bij een volgende klik je dashboard terug.
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      type="button"
      className="text-sm font-medium transition-colors"
      style={{ color: "#8A7E72", background: "none", border: 0, padding: 0, cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#C5A059")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#8A7E72")}
    >
      Uitloggen
    </button>
  )
}
