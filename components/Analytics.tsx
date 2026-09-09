"use client"

import { GoogleAnalytics } from "@next/third-parties/google"
import { useState, useEffect } from "react"
import { isMarketingHost } from "@/lib/marketing-host"

const GA_ID = "G-ST0S1N1KS4"

export default function Analytics() {
  const [consent, setConsent] = useState<string | null>(null)

  useEffect(() => {
    setConsent(localStorage.getItem("cookie_consent"))

    function onUpdate() {
      setConsent(localStorage.getItem("cookie_consent"))
    }

    window.addEventListener("cookie-consent-updated", onUpdate)
    window.addEventListener("storage", onUpdate)
    return () => {
      window.removeEventListener("cookie-consent-updated", onUpdate)
      window.removeEventListener("storage", onUpdate)
    }
  }, [])

  if (consent !== "accepted") return null
  if (!isMarketingHost(window.location.hostname)) return null

  return <GoogleAnalytics gaId={GA_ID} />
}
