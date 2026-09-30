"use client"

// De vorige-knop van de telefoon of de browser (Michiel, 30 september 2026).
// In de demo bracht hij je terug naar de start, omdat de demo geen eigen stap
// in de geschiedenis had. Nu:
// - een laag (de demo, een venster) sluit met de vorige-knop
// - in de start en de bouwers ga je met de vorige-knop een stap terug
//
// Beide zetten een eigen regel in de geschiedenis van de browser, met de
// gegevens van Next erbij (de spread van history.state), zodat de router van
// Next gewoon blijft werken.

import { useEffect, useRef } from "react"

type Staat = Record<string, unknown> | null

function staat(): Record<string, unknown> {
  return ((window.history.state as Staat) ?? {}) as Record<string, unknown>
}

/** Een laag die open is, sluit met de vorige-knop in plaats van dat je de pagina verlaat */
export function useTerugSluit(open: boolean, sluit: () => void) {
  const sluitRef = useRef(sluit)
  useEffect(() => {
    sluitRef.current = sluit
  })
  useEffect(() => {
    if (!open) return
    window.history.pushState({ ...staat(), syLaag: true }, "")
    let viaTerug = false
    const bijTerug = () => {
      viaTerug = true
      sluitRef.current()
    }
    window.addEventListener("popstate", bijTerug)
    return () => {
      window.removeEventListener("popstate", bijTerug)
      // Met een knop gesloten: de regel van de laag weer weghalen
      if (!viaTerug && staat().syLaag) window.history.back()
    }
  }, [open])
}

/**
 * Elke stap een eigen regel in de geschiedenis, zodat de vorige-knop een stap
 * terug gaat. `sleutel` houdt de start en de bouwers uit elkaar.
 */
export function useStapGeschiedenis(sleutel: string, stap: number, zet: (i: number) => void) {
  const zetRef = useRef(zet)
  const stapRef = useRef(stap)
  const vanTerug = useRef(false)
  const eerste = useRef(true)
  useEffect(() => {
    zetRef.current = zet
  })
  useEffect(() => {
    stapRef.current = stap
    const st = staat()
    if (eerste.current) {
      eerste.current = false
      window.history.replaceState({ ...st, syStap: stap, sySleutel: sleutel }, "")
      return
    }
    if (vanTerug.current) {
      vanTerug.current = false
      return
    }
    if (st.sySleutel === sleutel && st.syStap === stap) return
    window.history.pushState({ ...st, syLaag: undefined, syStap: stap, sySleutel: sleutel }, "")
  }, [stap, sleutel])
  useEffect(() => {
    const bijTerug = () => {
      const st = staat()
      if (st.syLaag) return
      if (st.sySleutel !== sleutel || typeof st.syStap !== "number") return
      if (st.syStap === stapRef.current) return
      vanTerug.current = true
      zetRef.current(st.syStap)
    }
    window.addEventListener("popstate", bijTerug)
    return () => window.removeEventListener("popstate", bijTerug)
  }, [sleutel])
}

/** De stap die de geschiedenis onthield, na terugkomen op een pagina */
export function bewaardeStap(sleutel: string): number | null {
  try {
    const st = staat()
    return st.sySleutel === sleutel && typeof st.syStap === "number" ? st.syStap : null
  } catch {
    return null
  }
}
