"use client"

import { useState } from "react"

export default function RsvpForm() {
  const [form, setForm] = useState({ naam: "", email: "", aantal: "1" })
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    // Placeholder — API koppeling volgt
    setTimeout(() => setStatus("sent"), 800)
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
        <p className="text-sm text-gray-500">Bedankt {form.naam}, we zien je graag.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Naam</label>
        <input
          type="text"
          required
          placeholder="Jouw naam"
          value={form.naam}
          onChange={(e) => setForm({ ...form, naam: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-[#E8627A] transition-all shadow-sm"
          style={{ "--tw-ring-color": "#E8627A33" } as React.CSSProperties}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mailadres</label>
        <input
          type="email"
          required
          placeholder="jouw@email.nl"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-[#E8627A] transition-all shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Aantal personen</label>
        <select
          value={form.aantal}
          onChange={(e) => setForm({ ...form, aantal: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 transition-all shadow-sm"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? "persoon" : "personen"}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-1 w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#E8627A" }}
      >
        {status === "sending" ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Versturen...
          </>
        ) : "Aanmelden"}
      </button>
    </form>
  )
}
