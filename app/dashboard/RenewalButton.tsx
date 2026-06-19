"use client"

import { useRouter } from "next/navigation"

const GOLD    = "#C5A059"
const GOLD_BG = "#FBF5E8"

export default function RenewalButton({ eventId }: { eventId: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/verlengen?event_id=${eventId}`)}
      className="text-sm font-semibold px-4 py-3 md:py-2 rounded-xl text-center transition-all hover:-translate-y-0.5 w-full md:w-auto"
      style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD}` }}
    >
      Verleng abonnement — €22
    </button>
  )
}
