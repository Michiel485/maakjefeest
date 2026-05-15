"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const DEFAULT_PROGRAMMA = {
  layout: "timeline",
  items: [
    { id: "1", time: "12:00", title: "Ontvangst",   description: "Welkom bij de receptie met een drankje en hapje.",    iconId: "welkom"   },
    { id: "2", time: "14:00", title: "Ceremonie",   description: "De officiële huwelijksceremonie.",                   iconId: "ringen"   },
    { id: "3", time: "15:30", title: "Receptie",    description: "Proost op het gelukkige paar!",                      iconId: "toost"    },
    { id: "4", time: "18:30", title: "Diner",       description: "Geniet van een heerlijk driegangendiner.",           iconId: "cutlery"  },
    { id: "5", time: "20:30", title: "Avondfeest",  description: "Dans de nacht weg met het bruidspaar.",              iconId: "feest"    },
  ],
}

const DEFAULT_PRAKTISCH = {
  items: [
    { label: "Dresscode",    value: "Festive / Smart Casual" },
    { label: "Parkeren",     value: "Gratis parkeren aanwezig op het terrein" },
    { label: "Overnachten",  value: "Zie de link op de website voor hotelinfo" },
  ],
}

function buildInitials(naam1: string, naam2: string): string {
  const a = naam1.trim()[0]?.toUpperCase()
  const b = naam2.trim()[0]?.toUpperCase()
  return a && b ? `${a}|${b}` : "M|L"
}

// Live formatting during typing — keeps trailing hyphen so space→hyphen is visible
function formatSlugInput(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "en")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
}

// Final cleanup for availability checks and submission
function sanitizeSlug(value: string): string {
  return formatSlugInput(value).replace(/^-+|-+$/g, "")
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid"

export default function AanmakenPage() {
  const router = useRouter()

  const [form, setForm] = useState(() => {
    if (typeof window === "undefined") return { naam1: "", naam2: "", datum: "", email: "", slug: "" }
    try {
      const saved = localStorage.getItem("sayingyes_draft")
      if (saved) {
        const { naam1 = "", naam2 = "", datum = "", email = "", slug = "" } = JSON.parse(saved)
        return { naam1, naam2, datum, email, slug }
      }
    } catch {}
    return { naam1: "", naam2: "", datum: "", email: "", slug: "" }
  })

  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleSlugCheck(slug: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!slug) { setSlugStatus("idle"); return }
    if (slug.length < 3) { setSlugStatus("invalid"); return }
    setSlugStatus("checking")
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`)
        const { available } = await res.json()
        setSlugStatus(available ? "available" : "taken")
      } catch {
        setSlugStatus("idle")
      }
    }, 500)
  }

  useEffect(() => {
    if (form.slug) scheduleSlugCheck(form.slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSlugInput(raw: string) {
    const formatted = formatSlugInput(raw)
    setForm({ ...form, slug: formatted })
    scheduleSlugCheck(sanitizeSlug(formatted))
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    const cleanSlug = sanitizeSlug(form.slug)
    if (!cleanSlug || slugStatus !== "available") return

    const frameNames = `${form.naam1.trim()} & ${form.naam2.trim()}`
    const eventTitle = `De bruiloft van ${form.naam1.trim()} & ${form.naam2.trim()}`

    const draft = {
      type: "bruiloft",
      naam: eventTitle,
      slug: cleanSlug,
      nav_title: eventTitle,
      datum: form.datum,
      locatie: "Stadhuis Amersfoort",
      email: form.email,
      aangemaakt: new Date().toISOString(),
      use_frame: true,
      frame_style: "gold-circle",
      frame_names: frameNames,
      frame_location: "Stadhuis Amersfoort",
      initials: buildInitials(form.naam1, form.naam2),
      homeContent: {
        title: `Wij gaan trouwen!`,
        body: `We zijn zo blij dat jullie erbij zijn op onze grote dag. Hieronder vinden jullie alles wat jullie moeten weten.`,
        align: "center",
      },
    }

    const content = {
      programma: DEFAULT_PROGRAMMA,
      praktisch: DEFAULT_PRAKTISCH,
    }

    localStorage.setItem("sayingyes_draft", JSON.stringify(draft))
    localStorage.setItem("sayingyes_content", JSON.stringify(content))
    localStorage.removeItem("sayingyes_saved_event_id")
    router.push("/bouwen")
  }

  const canSubmit =
    form.naam1.trim().length > 0 &&
    form.naam2.trim().length > 0 &&
    sanitizeSlug(form.slug).length >= 3 &&
    slugStatus === "available"

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

          {/* Namen bruidspaar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Namen Bruidspaar</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="bijv. Michiel"
                value={form.naam1}
                onChange={(e) => setForm({ ...form, naam1: e.target.value })}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all shadow-sm"
              />
              <input
                type="text"
                required
                placeholder="bijv. Lindsey"
                value={form.naam2}
                onChange={(e) => setForm({ ...form, naam2: e.target.value })}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Kies jullie unieke website link
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="bijv. sanne-en-tom"
                value={form.slug}
                onChange={(e) => handleSlugInput(e.target.value)}
                className={`w-full rounded-2xl border bg-white px-4 py-3 pr-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                  slugStatus === "available"
                    ? "border-emerald-300 focus:ring-emerald-200 focus:border-emerald-400"
                    : slugStatus === "taken"
                    ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                    : "border-gray-200 focus:ring-rose-300 focus:border-rose-400"
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {slugStatus === "checking" && (
                  <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {slugStatus === "available" && (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {slugStatus === "taken" && (
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>

            <div className="mt-1.5 flex flex-col gap-0.5">
              <p className="text-xs text-gray-400">Alleen kleine letters, cijfers en streepjes zijn toegestaan.</p>
              {form.slug ? (
                <p className="text-xs text-gray-500 mt-0.5">
                  Jouw link wordt:{" "}
                  <span className="font-semibold text-gray-700">{sanitizeSlug(form.slug)}.sayingyes.nl</span>
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Bijv. sanne-en-tom.sayingyes.nl</p>
              )}
              {slugStatus === "available" && (
                <p className="text-xs font-medium text-emerald-600">Beschikbaar!</p>
              )}
              {slugStatus === "taken" && (
                <p className="text-xs font-medium text-red-500">Al bezet — kies een andere naam</p>
              )}
              {slugStatus === "invalid" && (
                <p className="text-xs text-gray-400">Minimaal 3 tekens vereist</p>
              )}
            </div>
          </div>

          {/* Datum */}
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

          {/* E-mail */}
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

          <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-slate-600 leading-snug">
              Geen stress — je kunt al deze gegevens later nog aanpassen in de builder.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0 transition-all"
            >
              Start bouwen
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            {!canSubmit && form.slug && slugStatus !== "checking" && slugStatus !== "idle" && (
              <p className="text-xs text-center text-gray-400 mt-2">
                {slugStatus === "taken" ? "Kies eerst een beschikbare website link" : "Vul een geldige website link in"}
              </p>
            )}
          </div>

        </form>
      </main>
    </div>
  )
}
