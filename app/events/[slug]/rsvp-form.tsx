"use client"

import { useState, useEffect } from "react"

interface Guest {
  name: string
  email: string
  guest_type: "daggast" | "avondgast"
  dietary: string
}

const defaultGuest = (): Guest => ({ name: "", email: "", guest_type: "daggast", dietary: "" })

export default function RsvpForm({
  eventId,
  accentColor = "#E8627A",
}: {
  eventId: string
  accentColor?: string
}) {
  const [count, setCount] = useState(1)
  const [guests, setGuests] = useState<Guest[]>([defaultGuest()])
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  useEffect(() => {
    setGuests((prev) => {
      if (count > prev.length) {
        return [...prev, ...Array.from({ length: count - prev.length }, defaultGuest)]
      }
      return prev.slice(0, count)
    })
  }, [count])

  function updateGuest(i: number, field: keyof Guest, value: string) {
    setGuests((prev) => prev.map((g, idx) => (idx === i ? { ...g, [field]: value } : g)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          guests: guests.map((g, i) => ({
            name: g.name,
            email: g.email || undefined,
            guest_type: g.guest_type,
            dietary: g.dietary || undefined,
            is_primary: i === 0,
          })),
        }),
      })
      if (!res.ok) throw new Error()
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-gray-900 mb-1">Aanmelding ontvangen!</p>
        <p className="text-sm text-gray-500">
          {count === 1
            ? "Bedankt voor je aanmelding — we zien je graag!"
            : `Bedankt! ${count} personen zijn ingeschreven.`}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-lg">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Met hoeveel personen komen jullie?
        </label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className="w-10 h-10 rounded-xl font-bold text-sm transition-all"
              style={{
                backgroundColor: count === n ? accentColor : "transparent",
                color: count === n ? "#fff" : "#6b7280",
                border: `2px solid ${count === n ? accentColor : "#e5e7eb"}`,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {guests.map((guest, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {i === 0 ? "Hoofdgast" : `Gast ${i + 1}`}
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Naam *</label>
            <input
              type="text"
              required
              placeholder="Voornaam"
              value={guest.name}
              onChange={(e) => updateGuest(i, "name", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-sm"
              style={{ "--tw-ring-color": `${accentColor}33` } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type gast</label>
            <div className="flex gap-2">
              {(["daggast", "avondgast"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateGuest(i, "guest_type", t)}
                  className="flex-1 py-2 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: guest.guest_type === t ? accentColor : "transparent",
                    color: guest.guest_type === t ? "#fff" : "#6b7280",
                    border: `2px solid ${guest.guest_type === t ? accentColor : "#e5e7eb"}`,
                  }}
                >
                  {t === "daggast" ? "Daggast" : "Avondgast"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Dieetwensen / Allergieën
            </label>
            <input
              type="text"
              placeholder="Bijv. vegetarisch, notenallergie"
              value={guest.dietary}
              onChange={(e) => updateGuest(i, "dietary", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-sm"
              style={{ "--tw-ring-color": `${accentColor}33` } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              E-mailadres {i === 0 ? "*" : "(optioneel)"}
            </label>
            <input
              type="email"
              required={i === 0}
              placeholder={i === 0 ? "jouw@email.nl" : "optioneel"}
              value={guest.email}
              onChange={(e) => updateGuest(i, "email", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-sm"
              style={{ "--tw-ring-color": `${accentColor}33` } as React.CSSProperties}
            />
          </div>
        </div>
      ))}

      {status === "error" && (
        <p className="text-sm text-red-500">Er ging iets mis. Probeer het opnieuw.</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: accentColor }}
      >
        {status === "sending" ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Versturen...
          </>
        ) : count === 1 ? (
          "Aanmelden"
        ) : (
          `${count} personen aanmelden`
        )}
      </button>
    </form>
  )
}
