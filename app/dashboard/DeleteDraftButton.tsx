"use client"

import { useState, useTransition } from "react"
import { deleteDraft } from "./actions"

export default function DeleteDraftButton({ eventId }: { eventId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteDraft(eventId)
      if (result.error) {
        setError(result.error)
        setConfirming(false)
      }
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Zeker weten?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
        >
          {isPending ? "Verwijderen…" : "Ja, verwijder"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
        >
          Annuleren
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-medium transition-colors hover:opacity-80"
      style={{ color: "#9CA3AF" }}
    >
      Verwijderen
    </button>
  )
}
