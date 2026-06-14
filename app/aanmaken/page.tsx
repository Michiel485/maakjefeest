"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"

const DEFAULT_PROGRAMMA = {
  layout: "timeline",
  items: [
    { id: "p1", time: "13:00", title: "Aankomst",  description: "Welkom bij onze trouwdag",  iconId: "welkom"  },
    { id: "p2", time: "14:00", title: "Ceremonie", description: "Het ja-woord moment",        iconId: "ringen"  },
    { id: "p3", time: "17:00", title: "Borrel",    description: "Toasten op het geluk",       iconId: "toost"   },
    { id: "p4", time: "19:00", title: "Diner",     description: "Geniet van het feestmaal",   iconId: "cutlery" },
    { id: "p5", time: "22:00", title: "Feest",     description: "Dansen tot in de nacht",     iconId: "feest"   },
  ],
}

const DEFAULT_PRAKTISCH = {
  items: [
    { id: "1", iconId: "dresscode",  title: "Dresscode",      text: "Wij zien jullie graag in feestelijke kleding. Voel je vooral comfortabel, maar laat de spijkerbroek liever thuis!" },
    { id: "2", iconId: "cutlery",    title: "Dieetwensen",    text: "Heb je speciale dieetwensen of allergieën? Laat het onze ceremoniemeester uiterlijk 4 weken van tevoren weten, dan houdt de catering daar graag rekening mee." },
    { id: "3", iconId: "geen_smart", title: "Geen telefoons", text: "Wij willen onze ceremonie graag 'unplugged' beleven. Geniet in het moment met ons mee en laat de telefoons lekker in de tas zitten. Onze fotograaf legt alles vast!" },
  ],
}

function buildInitials(naam1: string, naam2: string): string {
  const a = naam1.trim()[0]?.toUpperCase()
  const b = naam2.trim()[0]?.toUpperCase()
  return a && b ? `${a}|${b}` : "M|L"
}

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

function sanitizeSlug(value: string): string {
  return formatSlugInput(value).replace(/^-+|-+$/g, "")
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid"

const inputBase = "w-full rounded-2xl border bg-white px-4 py-3.5 text-sm placeholder-gray-400 focus:outline-none transition-all"
const inputStyle: React.CSSProperties = { color: CHARCOAL, borderColor: GOLD_LIGHT }

export default function AanmakenPage() {
  const router = useRouter()
  const [form, setForm] = useState({ naam1: "", naam2: "", datum: "", email: "", slug: "" })
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle")
  const [submitting, setSubmitting] = useState(false)
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
    try {
      const saved = localStorage.getItem("sayingyes_draft")
      if (saved) {
        const { naam1 = "", naam2 = "", datum = "", email = "", slug = "" } = JSON.parse(saved)
        setForm({ naam1, naam2, datum, email, slug })
        if (slug) scheduleSlugCheck(sanitizeSlug(slug))
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSlugInput(raw: string) {
    const formatted = formatSlugInput(raw)
    setForm({ ...form, slug: formatted })
    scheduleSlugCheck(sanitizeSlug(formatted))
  }

  async function handleStart(e: React.SyntheticEvent) {
    e.preventDefault()
    const cleanSlug = sanitizeSlug(form.slug)
    if (!cleanSlug || slugStatus !== "available" || submitting) return

    setSubmitting(true)

    const frameNames = `${form.naam1.trim()} & ${form.naam2.trim()}`
    const eventTitle = `De bruiloft van ${form.naam1.trim()} & ${form.naam2.trim()}`

    const payload = {
      type: "bruiloft",
      naam: eventTitle,
      slug: cleanSlug,
      style: "zand",
      nav_title: frameNames,
      datum: form.datum,
      locatie: "Stadhuis Amersfoort",
      use_frame: true,
      frame_style: "gold-circle",
      frame_names: frameNames,
      frame_location: "Stadhuis Amersfoort",
      initials: buildInitials(form.naam1, form.naam2),
      pages: ["Home", "Programma", "RSVP", "Informatie", "Cadeautips", "OnsVerhaal", "Fotos", "Ceremoniemeesters"],
      content: {
        Home: {
          title: "Wij gaan trouwen!",
          body: "We zijn zo blij dat jullie erbij zijn op onze grote dag. Hieronder vinden jullie alles wat jullie moeten weten.",
          align: "center",
        },
        Programma: DEFAULT_PROGRAMMA,
        Informatie: DEFAULT_PRAKTISCH,
      },
    }

    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const json = await res.json()
        // Gelukt: direct naar builder met het nieuwe event_id
        router.push(`/bouwen?event_id=${json.id}`)
        return
      }
    } catch {}

    // Terugval voor niet-ingelogde gebruikers: localStorage + /bouwen zonder event_id
    // De builder toont dan de magic-link flow en maakt het event aan na inloggen
    const draft = {
      type: "bruiloft", naam: eventTitle, naam1: form.naam1.trim(), naam2: form.naam2.trim(),
      slug: cleanSlug, style: "zand", nav_title: frameNames, datum: form.datum,
      locatie: "Stadhuis Amersfoort", email: form.email, aangemaakt: new Date().toISOString(),
      use_frame: true, frame_style: "gold-circle", frame_names: frameNames,
      frame_location: "Stadhuis Amersfoort", initials: buildInitials(form.naam1, form.naam2),
      homeContent: { title: "Wij gaan trouwen!", body: "We zijn zo blij dat jullie erbij zijn op onze grote dag. Hieronder vinden jullie alles wat jullie moeten weten.", align: "center" },
    }
    localStorage.setItem("sayingyes_draft", JSON.stringify(draft))
    localStorage.setItem("sayingyes_content", JSON.stringify({ Programma: DEFAULT_PROGRAMMA, Informatie: DEFAULT_PRAKTISCH }))
    localStorage.removeItem("sayingyes_saved_event_id")
    router.push("/bouwen")
    setSubmitting(false)
  }

  const canSubmit =
    form.naam1.trim().length > 0 &&
    form.naam2.trim().length > 0 &&
    sanitizeSlug(form.slug).length >= 3 &&
    slugStatus === "available" &&
    !submitting

  const slugBorderColor =
    slugStatus === "available" ? "#10b981"
    : slugStatus === "taken"   ? "#ef4444"
    : GOLD_LIGHT

  return (
    <div style={{ backgroundColor: IVORY }} className="min-h-screen antialiased">

      {/* Subtle background warmth */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${GOLD_BG} 0%, transparent 60%)`, zIndex: 0 }}
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-2xl tracking-wide transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--font-cormorant)", color: CHARCOAL, fontWeight: 600 }}
        >
          SayingYes
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: BODY }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Terug
        </Link>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-6 pb-24 pt-4">

        {/* Page header */}
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6 tracking-wide"
            style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: GOLD_BG, color: GOLD }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <path d="M4 0 L8 4 L4 8 L0 4 Z" />
            </svg>
            Jullie bruiloftswebsite
          </div>

          <h1
            className="leading-[1.1] mb-4"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 700,
              color: CHARCOAL,
            }}
          >
            Vertel ons over<br />
            jullie grote dag
          </h1>

          <p className="text-sm leading-relaxed" style={{ color: BODY }}>
            We gebruiken dit om jullie bruiloftswebsite alvast klaar te zetten — inclusief programma en praktische info.
            Alles is achteraf nog aanpasbaar.
          </p>

          {/* Thin gold ornament */}
          <div className="flex items-center gap-3 mt-7">
            <div style={{ width: 40, height: 1, backgroundColor: GOLD_LIGHT }} />
            <svg width="7" height="7" viewBox="0 0 8 8" fill={GOLD_LIGHT}>
              <path d="M4 0 L8 4 L4 8 L0 4 Z" />
            </svg>
            <div style={{ flex: 1, height: 1, backgroundColor: GOLD_LIGHT }} />
          </div>
        </div>

        <form onSubmit={handleStart} className="flex flex-col gap-6">

          {/* Namen */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: GOLD }}>
              Namen bruidspaar
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="bijv. Michiel"
                value={form.naam1}
                onChange={(e) => setForm({ ...form, naam1: e.target.value })}
                className={inputBase}
                style={{ ...inputStyle, boxShadow: "0 1px 4px rgba(197,160,89,0.08)" }}
              />
              <input
                type="text"
                required
                placeholder="bijv. Lindsey"
                value={form.naam2}
                onChange={(e) => setForm({ ...form, naam2: e.target.value })}
                className={inputBase}
                style={{ ...inputStyle, boxShadow: "0 1px 4px rgba(197,160,89,0.08)" }}
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: GOLD }}>
              Jullie unieke websitelink
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="bijv. sanne-en-tom"
                value={form.slug}
                onChange={(e) => handleSlugInput(e.target.value)}
                className={inputBase}
                style={{
                  ...inputStyle,
                  borderColor: slugBorderColor,
                  paddingRight: "2.75rem",
                  boxShadow: "0 1px 4px rgba(197,160,89,0.08)",
                }}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {slugStatus === "checking" && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: GOLD_LIGHT }}>
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
            <div className="mt-2 flex flex-col gap-0.5">
              {form.slug ? (
                <p className="text-xs" style={{ color: BODY }}>
                  Jouw link:{" "}
                  <span className="font-semibold" style={{ color: CHARCOAL }}>
                    {sanitizeSlug(form.slug)}.sayingyes.nl
                  </span>
                </p>
              ) : (
                <p className="text-xs" style={{ color: BODY }}>
                  Bijv. <span style={{ color: CHARCOAL }}>sanne-en-tom.sayingyes.nl</span>
                </p>
              )}
              {slugStatus === "available" && (
                <p className="text-xs font-semibold text-emerald-600">Beschikbaar!</p>
              )}
              {slugStatus === "taken" && (
                <p className="text-xs font-semibold text-red-500">Al bezet — kies een andere naam</p>
              )}
              {slugStatus === "invalid" && (
                <p className="text-xs" style={{ color: BODY }}>Minimaal 3 tekens vereist</p>
              )}
            </div>
          </div>

          {/* Datum */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: GOLD }}>
              Trouwdatum
            </label>
            <input
              type="date"
              required
              value={form.datum}
              onChange={(e) => setForm({ ...form, datum: e.target.value })}
              className={inputBase}
              style={{ ...inputStyle, boxShadow: "0 1px 4px rgba(197,160,89,0.08)" }}
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: GOLD }}>
              E-mailadres
            </label>
            <input
              type="email"
              required
              placeholder="jouw@email.nl"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputBase}
              style={{ ...inputStyle, boxShadow: "0 1px 4px rgba(197,160,89,0.08)" }}
            />
            <p className="text-xs mt-1.5" style={{ color: BODY }}>
              Voor je inloglink en bevestiging — nooit voor spam.
            </p>
          </div>

          {/* Info box */}
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-4"
            style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
          >
            <svg width="16" height="16" viewBox="0 0 8 8" fill={GOLD} className="flex-shrink-0 mt-0.5">
              <path d="M4 0 L8 4 L4 8 L0 4 Z" />
            </svg>
            <p className="text-sm leading-snug" style={{ color: BODY }}>
              Geen stress — je kunt al deze gegevens later nog aanpassen in de builder.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full inline-flex items-center justify-center gap-2.5 font-semibold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:translate-y-0"
              style={{
                backgroundColor: canSubmit ? CHARCOAL : "#6B6460",
                color: IVORY,
                boxShadow: canSubmit ? "0 8px 32px rgba(26,26,26,0.18)" : "none",
              }}
            >
              {submitting ? "Bezig..." : "Start bouwen"}
              {!submitting && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </button>
            {!canSubmit && form.slug && slugStatus !== "checking" && slugStatus !== "idle" && (
              <p className="text-xs text-center mt-2" style={{ color: BODY }}>
                {slugStatus === "taken"
                  ? "Kies eerst een beschikbare websitelink"
                  : "Vul een geldige websitelink in (minimaal 3 tekens)"}
              </p>
            )}
          </div>

          {/* Consent */}
          <p className="text-xs text-center leading-relaxed" style={{ color: "#8A7E72" }}>
            Door op &lsquo;Start bouwen&rsquo; te klikken maak je een account aan en ga je akkoord met onze{" "}
            <Link href="/voorwaarden" className="underline transition-opacity hover:opacity-70" style={{ color: BODY }}>
              Algemene Voorwaarden
            </Link>{" "}
            (incl. Verwerkersovereenkomst) en ons{" "}
            <Link href="/privacy" className="underline transition-opacity hover:opacity-70" style={{ color: BODY }}>
              Privacybeleid
            </Link>
            .
          </p>

          {/* Trust signal */}
          <div className="flex items-center justify-center gap-6 pt-2">
            {[
              { icon: "✦", label: "Eenmalig €49,99" },
              { icon: "✦", label: "1 jaar online" },
              { icon: "✦", label: "Geen abonnement" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: BODY }}>
                <span style={{ color: GOLD, fontSize: "0.5rem" }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>

        </form>
      </main>
    </div>
  )
}
