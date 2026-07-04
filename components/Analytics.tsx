"use client"

import { GoogleAnalytics } from "@next/third-parties/google"
import { useState, useEffect } from "react"

const GA_ID = "G-ST0S1N1KS4"

function isMarketingHost(host: string): boolean {
  const h = host.split(":")[0]
  if (h === "localhost" || h.endsWith(".localhost")) return false
  const base =
    h === "sayingyes.be" || h.endsWith(".sayingyes.be") ? "sayingyes.be" : "sayingyes.nl"
  return h === base || h === `www.${base}`
}

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
