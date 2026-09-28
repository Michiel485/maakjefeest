"use client"

import { useEffect } from "react"
import { meldInBrowser } from "@/lib/fout-browser"

// Fouten die geen foutpagina geven maar wel iets stukmaken, zoals een knop die
// niets doet omdat zijn code vastliep. Alleen fouten uit onze eigen scripts.
export default function FoutVanger() {
  useEffect(() => {
    const bijFout = (e: ErrorEvent) => {
      if (e.filename && !e.filename.startsWith(window.location.origin)) return
      meldInBrowser(e.error ?? e.message, "browser")
    }
    const bijBelofte = (e: PromiseRejectionEvent) => meldInBrowser(e.reason, "browser (async)")
    window.addEventListener("error", bijFout)
    window.addEventListener("unhandledrejection", bijBelofte)
    return () => {
      window.removeEventListener("error", bijFout)
      window.removeEventListener("unhandledrejection", bijBelofte)
    }
  }, [])
  return null
}
