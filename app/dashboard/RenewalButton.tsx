"use client"

import { useState } from "react"

const GOLD     = "#C5A059"
const GOLD_BG  = "#FBF5E8"

export default function RenewalButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleRenew() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkout/renewal", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ event_id: eventId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Er ging iets mis. Probeer het opnieuw.")
        setLoading(false)
      }
    } catch {
      alert("Er ging iets mis. Probeer het opnieuw.")
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRenew}
      disabled={loading}
      className="text-sm font-semibold px-4 py-3 md:py-2 rounded-xl text-center transition-all hover:-translate-y-0.5 w-full md:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD}` }}
    >
      {loading ? "Laden..." : "Verleng abonnement — €22"}
    </button>
  )
}
