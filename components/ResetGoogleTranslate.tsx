"use client"

import { useEffect } from "react"

// Clears the Google Translate cookie so marketing/auth pages always render in Dutch.
// Include this on any page that should never be translated (homepage, dashboard, etc.).
export default function ResetGoogleTranslate() {
  useEffect(() => {
    const host = window.location.hostname
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host}`
    localStorage.removeItem("gt-lang")
  }, [])

  return null
}
