"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { togglePause } from "./actions"

export default function PauseButton({
  eventId,
  status,
  isSubscriptionExpired,
}: {
  eventId: string
  status: string
  isSubscriptionExpired: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (status !== "published" && status !== "paused") return null
  if (status === "paused" && isSubscriptionExpired) return null

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await togglePause(eventId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const isPaused = status === "paused"

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="text-xs font-medium transition-colors hover:opacity-80 whitespace-nowrap"
        style={{ color: isPaused ? "#059669" : "#6B7280" }}
      >
        {isPending
          ? (isPaused ? "Online zetten…" : "Offline zetten…")
          : (isPaused ? "Online zetten" : "Offline zetten")
        }
      </button>
      {error && <span className="text-xs" style={{ color: "#DC2626" }}>{error}</span>}
    </div>
  )
}
