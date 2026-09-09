"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { isMarketingHost } from "@/lib/marketing-host"

// Paden die niet meetellen: alles achter login, betaalflows, privelinks en klant-sites
const UITGESLOTEN = [
  "/dashboard", "/bouwen", "/admin", "/api", "/betalen", "/succes",
  "/inloggen", "/verlengen", "/kaart/", "/print/", "/events",
]

// De verwijzer is alleen zinvol bij de eerste paginaweergave van een bezoek
let eersteWeergave = true

// Anonieme paginateller voor de marketingsite: geen cookies, geen persoonsgegevens.
// Respecteert Do Not Track / Global Privacy Control en de eigenaar-uitsluiting.
export default function VisitorTracking() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    try {
      if (localStorage.getItem("sy_no_track") === "1") return

      const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
      if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return

      if (!isMarketingHost(location.hostname, process.env.NODE_ENV !== "production")) return
      if (UITGESLOTEN.some((p) => pathname.startsWith(p))) return

      const payload = JSON.stringify({
        path: pathname,
        referrer: eersteWeergave ? document.referrer || null : null,
      })
      eersteWeergave = false

      const blob = new Blob([payload], { type: "application/json" })
      if (!navigator.sendBeacon || !navigator.sendBeacon("/api/track", blob)) {
        fetch("/api/track", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // tracking mag nooit iets breken
    }
  }, [pathname])

  return null
}
