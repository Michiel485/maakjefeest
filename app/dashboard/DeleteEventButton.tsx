"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { deleteEvent } from "./actions"

function ConfirmModal({
  isPending,
  error,
  onConfirm,
  onCancel,
}: {
  isPending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onCancel() }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #FECACA" }}
      >
        <p className="text-base font-semibold mb-2" style={{ color: "#DC2626" }}>
          Dit kan niet ongedaan gemaakt worden!
        </p>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "#6B7280" }}>
          Alle RSVP-aanmeldingen, pagina-inhoud en de bruiloftswebsite worden permanent uit de database gewist. Facturen blijven bewaard voor de administratie.
        </p>
        {error && (
          <p className="text-sm mb-4" style={{ color: "#DC2626" }}>{error}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
          >
            {isPending ? "Verwijderen…" : "Ja, alles definitief verwijderen"}
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

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
      } else {
        setConfirming(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-medium transition-colors hover:opacity-80"
        style={{ color: "#EF4444" }}
      >
        Website verwijderen
      </button>
      {confirming && (
        <ConfirmModal
          isPending={isPending}
          error={error}
          onConfirm={handleDelete}
          onCancel={() => { if (!isPending) setConfirming(false) }}
        />
      )}
    </>
  )
}
