"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type EventType = "bruiloft" | "verjaardag" | "evenement"

const eventTypes: { id: EventType; label: string; description: string; icon: React.ReactNode; gradient: string; ring: string }[] = [
  {
    id: "bruiloft",
    label: "Bruiloft",
    description: "Een stijlvolle website voor jullie mooiste dag. Met RSVP, programma en wishlist.",
    gradient: "from-rose-400 to-pink-500",
    ring: "ring-rose-400",
    icon: (
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="16" r="4" />
        <circle cx="17" cy="16" r="4" />
        <path d="M11 16a4 4 0 0 1 2 0" />
        <path d="M10.5 7 Q12 4.5 13.5 7" />
        <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "verjaardag",
    label: "Verjaardag",
    description: "Nodig al je vrienden en familie uit op één plek. Vertel wanneer en waar het feest is.",
    gradient: "from-amber-400 to-orange-400",
    ring: "ring-amber-400",
    icon: (
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M3 15h18" />
        <path d="M7 11V9a5 5 0 0 1 10 0v2" />
        <path d="M8 6 Q8.5 4 9 6" />
        <path d="M12 5 Q12.5 3 13 5" />
        <path d="M16 6 Q16.5 4 17 6" />
      </svg>
    ),
  },
  {
    id: "evenement",
    label: "Evenement",
    description: "Van bedrijfsborrel tot buurtfeest — één centrale plek voor info en aanmeldingen.",
    gradient: "from-teal-400 to-cyan-500",
    ring: "ring-teal-400",
    icon: (
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeWidth={2.5} />
      </svg>
    ),
  },
]

export default function AanmakenPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState<EventType | null>(null)
  const [form, setForm] = useState({ naam: "", datum: "", locatie: "", email: "" })

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    const data = { type: selectedType, ...form, aangemaakt: new Date().toISOString() }
    localStorage.setItem("maakjefeest_onboarding", JSON.stringify(data))
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 font-sans antialiased">

      {/* Decorative circles */}
      <div className="pointer-events-none fixed -top-20 -left-20 w-80 h-80 rounded-full bg-rose-200 opacity-20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-20 -right-20 w-96 h-96 rounded-full bg-orange-200 opacity-20 blur-3xl" />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 max-w-3xl mx-auto">
        <a href="/" className="text-lg font-bold text-rose-600 tracking-tight">maakjefeest.nl</a>
        <a href="/" className="text-sm font-medium text-gray-500 hover:text-rose-600 transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Terug
        </a>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 pb-20">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10 mt-2">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === n
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                  : step > n
                  ? "bg-rose-100 text-rose-500"
                  : "bg-white border-2 border-gray-200 text-gray-400"
              }`}>
                {step > n ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : n}
              </div>
              <span className={`text-sm font-medium ${step === n ? "text-gray-900" : "text-gray-400"}`}>
                {n === 1 ? "Kies je type" : "Basisinfo"}
              </span>
              {n < 2 && <div className={`w-10 h-0.5 rounded-full ${step > 1 ? "bg-rose-300" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Wat voor feest organiseer je?</h1>
            <p className="text-gray-500 mb-8">Kies het type dat het beste bij jouw evenement past.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              {eventTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`text-left rounded-3xl border-2 bg-white p-7 flex flex-col gap-5 shadow-sm hover:shadow-lg transition-all duration-200 ${
                    selectedType === type.id
                      ? `border-rose-400 ring-2 ${type.ring} ring-offset-2 shadow-lg`
                      : "border-transparent hover:-translate-y-0.5"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-md`}>
                    {type.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1.5">{type.label}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{type.description}</p>
                  </div>
                  {selectedType === type.id && (
                    <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Geselecteerd
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedType}
              className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-200 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0 transition-all"
            >
              Volgende stap
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Vertel ons meer over je feest</h1>
            <p className="text-gray-500 mb-8">We gebruiken dit om je website alvast voor je klaar te zetten.</p>

            <form onSubmit={handleStart} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Naam van het evenement</label>
                <input
                  type="text"
                  required
                  placeholder={selectedType === "bruiloft" ? "Bijv. Bruiloft Sanne & Tom" : selectedType === "verjaardag" ? "Bijv. Feest 30 jaar Lisa" : "Bijv. Zomerborrel 2026"}
                  value={form.naam}
                  onChange={(e) => setForm({ ...form, naam: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Datum</label>
                <input
                  type="date"
                  required
                  value={form.datum}
                  onChange={(e) => setForm({ ...form, datum: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Locatie</label>
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
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Terug
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Start bouwen
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
