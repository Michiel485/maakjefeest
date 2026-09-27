"use client"

// Een keuzelijst voor lettertypes waarin elk lettertype in zijn eigen letter
// staat (Michiel, 27 september 2026). Een gewone keuzelijst kan dat niet
// overal: op een iPhone en een Mac toont de browser de opties altijd in de
// systeemletter.

import { useEffect, useRef, useState } from "react"
import { TITLE_FONT_OPTIONS } from "@/lib/title-fonts"

export default function LetterKiezer({
  waarde,
  onKies,
  leegLabel,
  leegFont,
  label = "Lettertype",
}: {
  /** Het id uit lib/title-fonts.ts; leeg is de standaard */
  waarde?: string
  onKies: (id: string | undefined) => void
  /** Een eerste keuze zonder eigen lettertype, zoals "Lettertype van het ontwerp" */
  leegLabel?: string
  /** In welke letter die eerste keuze staat */
  leegFont?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const vak = useRef<HTMLDivElement>(null)
  const lijst = useRef<HTMLUListElement>(null)

  // Sluiten bij een klik ernaast of met Escape
  useEffect(() => {
    if (!open) return
    const klik = (e: MouseEvent) => {
      if (vak.current && !vak.current.contains(e.target as Node)) setOpen(false)
    }
    const toets = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", klik)
    document.addEventListener("keydown", toets)
    // De gekozen letter in beeld
    lijst.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" })
    return () => {
      document.removeEventListener("mousedown", klik)
      document.removeEventListener("keydown", toets)
    }
  }, [open])

  const gekozen = TITLE_FONT_OPTIONS.find((f) => f.id === waarde)
  const opties: { id?: string; label: string; font: string; gewicht?: number }[] = [
    ...(leegLabel ? [{ id: undefined, label: leegLabel, font: leegFont ?? "inherit" }] : []),
    ...TITLE_FONT_OPTIONS.map((f) => ({ id: f.id as string, label: f.label, font: `var(${f.cssVar})`, gewicht: f.weight })),
  ]
  const nu = gekozen
    ? { label: gekozen.label, font: `var(${gekozen.cssVar})`, gewicht: gekozen.weight as number | undefined }
    : { label: leegLabel ?? TITLE_FONT_OPTIONS[0].label, font: leegFont ?? `var(${TITLE_FONT_OPTIONS[0].cssVar})`, gewicht: undefined }

  return (
    <div ref={vak} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${nu.label}`}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-[var(--goud-licht)] bg-white px-2.5 py-1.5 text-left focus:outline-none focus:ring-1 focus:ring-[var(--goud-vlak)]"
        style={{ cursor: "pointer" }}
      >
        <span className="truncate text-[15px] leading-tight text-gray-700" style={{ fontFamily: nu.font, fontWeight: nu.gewicht }}>
          {nu.label}
        </span>
        <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          ref={lijst}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--goud-licht)] bg-white py-1 shadow-xl"
        >
          {opties.map((o) => {
            const aan = (o.id ?? undefined) === (gekozen?.id ?? undefined) && (o.id !== undefined || !gekozen)
            return (
              <li key={o.id ?? "leeg"} role="option" aria-selected={aan}>
                <button
                  type="button"
                  onClick={() => { onKies(o.id); setOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-[17px] leading-tight transition-colors ${aan ? "bg-[#FBF5E8] text-[#C5A059]" : "text-gray-700 hover:bg-gray-50"}`}
                  style={{ fontFamily: o.font, fontWeight: o.gewicht, cursor: "pointer", border: 0, background: undefined }}
                >
                  {o.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
