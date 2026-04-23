"use client"

import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

function Spinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 font-sans antialiased flex items-center justify-center">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center">
          <svg className="w-7 h-7 text-rose-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <div>
          <p className="text-base font-bold text-gray-800">Betaling wordt geladen...</p>
          <p className="text-sm text-gray-400 mt-1">Even geduld, je wordt zo doorgestuurd naar Stripe.</p>
        </div>
      </div>
    </div>
  )
}

function BetalenContent() {
  const searchParams = useSearchParams()
  const event_id = searchParams.get("event_id")
  const called = useRef(false)

  useEffect(() => {
    if (!event_id || called.current) return
    called.current = true

    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.url) window.location.href = json.url
      })
      .catch(() => {})
  }, [event_id])

  return <Spinner />
}

export default function BetalenPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <BetalenContent />
    </Suspense>
  )
}
