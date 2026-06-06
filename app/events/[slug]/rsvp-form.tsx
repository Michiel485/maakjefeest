"use client"

import { useState, useEffect } from "react"

type Attending = "yes" | "no"

interface Guest {
  name: string
  email: string
  guest_type: string
  dietary: string
}

const makeDefaultGuest = (defaultType: string): Guest => ({
  name: "", email: "", guest_type: defaultType, dietary: "",
})

const GUEST_TYPE_LABELS: Record<string, string> = {
  daggast: "Daggast",
  avondgast: "Avondgast",
  receptiegast: "Receptiegast",
}

export default function RsvpForm({
  eventId,
  accentColor = "#E8627A",
  labelColor = "#374151",
  guestTypes = ["daggast", "avondgast"],
  showSongRequest = false,
  deadline = null,
  showOvernachting = false,
  customQuestion = null,
  customQuestion2 = null,
}: {
  eventId: string
  accentColor?: string
  labelColor?: string
  guestTypes?: string[]
  showSongRequest?: boolean
  deadline?: string | null
  showOvernachting?: boolean
  customQuestion?: string | null
  customQuestion2?: string | null
}) {
  const defaultType = guestTypes[0] ?? "daggast"
  const [attending, setAttending] = useState<Attending>("yes")
  const [count, setCount] = useState(1)
  const [guests, setGuests] = useState<Guest[]>([makeDefaultGuest(defaultType)])
  const [message, setMessage] = useState("")
  const [song, setSong] = useState("")
  const [overnachting, setOvernachting] = useState<boolean | null>(null)
  const [customAnswer, setCustomAnswer] = useState<boolean | null>(null)
  const [customAnswer2, setCustomAnswer2] = useState<boolean | null>(null)
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const isDeadlinePassed = deadline ? new Date() > new Date(deadline) : false
  const hasCustomQ1 = typeof customQuestion === "string" && customQuestion.trim().length > 0
  const hasCustomQ2 = typeof customQuestion2 === "string" && customQuestion2.trim().length > 0

  useEffect(() => {
    setGuests((prev) => {
      if (count > prev.length) {
        return [...prev, ...Array.from({ length: count - prev.length }, () => makeDefaultGuest(defaultType))]
      }
      return prev.slice(0, count)
    })
  }, [count, defaultType])

  function updateGuest(i: number, field: keyof Guest, value: string) {
    setGuests((prev) => prev.map((g, idx) => (idx === i ? { ...g, [field]: value } : g)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const primaryEmail = guests[0].email
      const guestPayload =
        attending === "no"
          ? [{ name: guests[0].name, email: primaryEmail || undefined, is_primary: true, attending: "no", message: message || undefined }]
          : guests.map((g, i) => ({
              name: g.name,
              email: g.email || (i > 0 && primaryEmail ? primaryEmail : undefined),
              guest_type: g.guest_type,
              dietary: g.dietary || undefined,
              is_primary: i === 0,
              attending: "yes",
              ...(i === 0 && showSongRequest && song ? { song } : {}),
              ...(i === 0 && showOvernachting && overnachting !== null ? { overnachting } : {}),
              ...(i === 0 && hasCustomQ1 && customAnswer !== null ? { custom_answer: customAnswer } : {}),
              ...(i === 0 && hasCustomQ2 && customAnswer2 !== null ? { custom_answer_2: customAnswer2 } : {}),
            }))

      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, guests: guestPayload }),
      })
      if (!res.ok) throw new Error()
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  if (isDeadlinePassed) {
    return (
      <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center">
        <p className="font-bold text-gray-700 mb-2">Aanmelden is gesloten</p>
        <p className="text-sm text-gray-500">
          De uiterste RSVP-datum is verstreken. Neem contact op met het bruidspaar of de ceremoniemeester.
        </p>
      </div>
    )
  }

  if (status === "sent") {
    if (attending === "no") {
      return (
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="font-bold text-gray-900 mb-1">Afmelding ontvangen.</p>
          <p className="text-sm text-gray-500">Jammer dat je er niet bij kunt zijn — bedankt voor het laten weten!</p>
        </div>
      )
    }
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-gray-900 mb-1">Aanmelding ontvangen!</p>
        <p className="text-sm text-gray-500">
          {count === 1 ? "Bedankt voor je aanmelding — we zien je graag!" : `Bedankt! ${count} personen zijn ingeschreven.`}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-lg">

      {/* ── Ben je erbij? ── */}
      <div>
        <label className="block text-sm font-semibold mb-3" style={{ color: labelColor }}>Ben je erbij?</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {(["yes", "no"] as Attending[]).map((val) => {
            const active = attending === val
            return (
              <button
                key={val}
                type="button"
                onClick={() => setAttending(val)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all text-left flex items-center gap-3"
                style={{
                  backgroundColor: active ? (val === "yes" ? "#ecfdf5" : "#fff7ed") : "#f9fafb",
                  border: `2px solid ${active ? (val === "yes" ? "#10b981" : "#f59e0b") : "#e5e7eb"}`,
                  color: active ? (val === "yes" ? "#065f46" : "#92400e") : "#6b7280",
                }}
              >
                <span className="text-base">{val === "yes" ? "✓" : "✕"}</span>
                {val === "yes" ? "Ja, ik ben erbij!" : "Nee, ik kan helaas niet komen."}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Aantal personen ── */}
      {attending === "yes" && (
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: labelColor }}>Met hoeveel personen komen jullie?</label>
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
      )}

      {/* ── Gast(en) gegevens ── */}
      {guests.slice(0, attending === "no" ? 1 : count).map((guest, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {attending === "no" ? "Jouw gegevens" : i === 0 ? "Hoofdgast" : `Gast ${i + 1}`}
          </p>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: labelColor }}>Naam *</label>
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

          {attending === "yes" && guestTypes.length > 1 && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: labelColor }}>Type gast</label>
              <div className="flex gap-2 flex-wrap">
                {guestTypes.map((t) => (
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
                    {GUEST_TYPE_LABELS[t] ?? t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {attending === "yes" && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: labelColor }}>Dieetwensen / Allergieën</label>
              <input
                type="text"
                placeholder="Bijv. vegetarisch, notenallergie"
                value={guest.dietary}
                onChange={(e) => updateGuest(i, "dietary", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-sm"
                style={{ "--tw-ring-color": `${accentColor}33` } as React.CSSProperties}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: labelColor }}>
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

      {/* ── Song request ── */}
      {attending === "yes" && showSongRequest && (
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: labelColor }}>
            Welk nummer brengt jou gegarandeerd naar de dansvloer?{" "}
            <span className="text-gray-400 font-normal">(optioneel)</span>
          </label>
          <input
            type="text"
            placeholder="Artiest — Nummertitel"
            value={song}
            onChange={(e) => setSong(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-sm"
            style={{ "--tw-ring-color": `${accentColor}33` } as React.CSSProperties}
          />
        </div>
      )}

      {/* ── Overnachting ── */}
      {attending === "yes" && showOvernachting && (
        <YesNoQuestion question="Blijven jullie overnachten?" value={overnachting} onChange={setOvernachting} labelColor={labelColor} />
      )}

      {/* ── Eigen vraag 1 ── */}
      {attending === "yes" && hasCustomQ1 && (
        <YesNoQuestion question={customQuestion!} value={customAnswer} onChange={setCustomAnswer} labelColor={labelColor} />
      )}

      {/* ── Eigen vraag 2 ── */}
      {attending === "yes" && hasCustomQ2 && (
        <YesNoQuestion question={customQuestion2!} value={customAnswer2} onChange={setCustomAnswer2} labelColor={labelColor} />
      )}

      {/* ── Berichtje bij afmelding ── */}
      {attending === "no" && (
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: labelColor }}>
            Lief berichtje voor het bruidspaar{" "}
            <span className="text-gray-400 font-normal">(optioneel)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Jullie zijn een prachtig stel en ik wens jullie veel geluk!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-sm resize-none"
            style={{ "--tw-ring-color": `${accentColor}33` } as React.CSSProperties}
          />
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-500">Er ging iets mis. Probeer het opnieuw.</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: attending === "no" ? "#f59e0b" : accentColor }}
      >
        {status === "sending" ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Versturen...
          </>
        ) : attending === "no" ? "Afmelding versturen" : count === 1 ? "Aanmelden" : `${count} personen aanmelden`}
      </button>
    </form>
  )
}

function YesNoQuestion({
  question,
  value,
  onChange,
  labelColor = "#374151",
}: {
  question: string
  value: boolean | null
  onChange: (v: boolean) => void
  labelColor?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-3" style={{ color: labelColor }}>{question}</label>
      <div className="flex gap-2">
        {([true, false] as const).map((val) => {
          const active = value === val
          return (
            <button
              key={String(val)}
              type="button"
              onClick={() => onChange(val)}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all"
              style={{
                backgroundColor: active ? (val ? "#ecfdf5" : "#fff7ed") : "#f9fafb",
                border: `2px solid ${active ? (val ? "#10b981" : "#f59e0b") : "#e5e7eb"}`,
                color: active ? (val ? "#065f46" : "#92400e") : "#6b7280",
              }}
            >
              {val ? "Ja" : "Nee"}
            </button>
          )
        })}
      </div>
    </div>
  )
}
