"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const DEFAULT_PROGRAMMA = {
  layout: "timeline",
  items: [
    { id: "1", time: "12:00", title: "Ontvangst",   description: "Welkom bij de receptie met een drankje en hapje.",    iconId: "champagne" },
    { id: "2", time: "14:00", title: "Ceremonie",   description: "De officiële huwelijksceremonie.",                   iconId: "rings"     },
    { id: "3", time: "15:30", title: "Receptie",    description: "Proost op het gelukkige paar!",                      iconId: "heart"     },
    { id: "4", time: "18:30", title: "Diner",       description: "Geniet van een heerlijk driegangendiner.",           iconId: "cutlery"   },
    { id: "5", time: "20:30", title: "Avondfeest",  description: "Dans de nacht weg met het bruidspaar.",              iconId: "champagne" },
  ],
}

const DEFAULT_PRAKTISCH = {
  items: [
    { label: "Dresscode",    value: "Festive / Smart Casual" },
    { label: "Parkeren",     value: "Gratis parkeren aanwezig op het terrein" },
    { label: "Overnachten",  value: "Zie de link op de website voor hotelinfo" },
  ],
}

export default function AanmakenPage() {
  const router = useRouter()
  const [form, setForm] = useState({ naam: "", datum: "", locatie: "", email: "" })

  function handleStart(e: React.FormEvent) {
    e.preventDefault()

    const draft = {
      type: "bruiloft",
      naam: form.naam,
      datum: form.datum,
      locatie: form.locatie,
      email: form.email,
      aangemaakt: new Date().toISOString(),
      homeContent: {
        title: `Wij gaan trouwen!`,
        body: `<p>We zijn zo blij dat jullie erbij zijn op onze grote dag. Hieronder vinden jullie alles wat jullie moeten weten.</p>`,
        align: "center",
      },
    }

    const content = {
      programma: DEFAULT_PROGRAMMA,
      praktisch: DEFAULT_PRAKTISCH,
    }

    localStorage.setItem("maakjefeest_draft", JSON.stringify(draft))
    localStorage.setItem("maakjefeest_content", JSON.stringify(content))
    localStorage.removeItem("maakjefeest_saved_event_id")
    router.push("/bouwen")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 font-sans antialiased">

      {/* Decorative circles */}
      <div className="pointer-events-none fixed -top-20 -left-20 w-80 h-80 rounded-full bg-rose-200 opacity-20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-20 -right-20 w-96 h-96 rounded-full bg-orange-200 opacity-20 blur-3xl" />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 max-w-3xl mx-auto">
        <a href="/" className="text-lg font-bold text-rose-600 tracking-tight">Saying Yes</a>
        <a href="/" className="text-sm font-medium text-gray-500 hover:text-rose-600 transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Terug
        </a>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-6 pb-20 pt-2">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-rose-100 text-rose-500 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 shadow-sm">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            Bruiloftswebsite
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
            Vertel ons over jullie<br />grote dag
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            We gebruiken dit om jullie bruiloftswebsite alvast klaar te zetten — inclusief programma en praktische info.
          </p>
        </div>

        <form onSubmit={handleStart} className="flex flex-col gap-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jullie namen</label>
            <input
              type="text"
              required
              placeholder="Bijv. Sanne & Tom"
              value={form.naam}
              onChange={(e) => setForm({ ...form, naam: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trouwdatum</label>
            <input
              type="date"
              required
              value={form.datum}
              onChange={(e) => setForm({ ...form, datum: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trouwlocatie</label>
            <input
              type="text"
              required
              placeholder="Bijv. Kasteel De Hooge Vuursche, Baarn"
              value={form.locatie}
              onChange={(e) => setForm({ ...form, locatie: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all shadow-sm"
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
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all shadow-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5">Voor je inloglink en bevestiging — nooit voor spam.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Start bouwen
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </form>

      </main>
    </div>
  )
}
