"use client"

import { useState, useEffect } from "react"
import type { UILocale } from "@/lib/ui-translations"

const LS_KEY = "gt-lang"

export function useUILocale(): UILocale {
  const [locale, setLocale] = useState<UILocale>(() => {
    if (typeof window === "undefined") return "nl"
    return (localStorage.getItem(LS_KEY) as UILocale) ?? "nl"
  })

  useEffect(() => {
    function onLangChanged(e: Event) {
      setLocale((e as CustomEvent<string>).detail as UILocale)
    }
    window.addEventListener("gt-lang-changed", onLangChanged)
    return () => window.removeEventListener("gt-lang-changed", onLangChanged)
  }, [])

  return locale
}
