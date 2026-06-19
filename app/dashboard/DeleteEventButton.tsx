"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteEvent } from "./actions"

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteEvent(eventId)
      if (result.error) {
        setError(result.error)
        setConfirming(false)
      } else {
        router.refresh()
      }
    })
  }

  if (confirming) {
    return (
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "#DC2626" }}>
            Dit kan niet ongedaan gemaakt worden!
          </p>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#6B7280" }}>
            Alle RSVP-aanmeldingen, pagina-inhoud en de bruiloftswebsite worden permanent uit de database gewist.
            Facturen blijven bewaard voor de administratie.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
          >
            {isPending ? "Verwijderen…" : "Ja, alles definitief verwijderen"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
          >
            Annuleren
          </button>
        </div>
        {error && <span className="text-xs" style={{ color: "#DC2626" }}>{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-medium transition-colors hover:opacity-80"
      style={{ color: "#EF4444" }}
    >
      Website verwijderen
    </button>
  )
}
