"use client"

import { useEffect, useRef } from "react"

// Meldt eenmalig dat deze kaart geopend is. Zat eerder in de serverrender van
// de kaartpagina, maar die is gecached; dan telt alleen de eerste gast mee.
// Zie app/api/cards/view/route.ts.
export default function KaartKijkTeller({ token }: { token: string }) {
  const gemeld = useRef(false)

  useEffect(() => {
    if (gemeld.current) return
    gemeld.current = true

    const body = JSON.stringify({ token })
    try {
      // sendBeacon overleeft het wegklikken van de pagina; fetch is de terugval
      const blob = new Blob([body], { type: "application/json" })
      if (!navigator.sendBeacon || !navigator.sendBeacon("/api/cards/view", blob)) {
        void fetch("/api/cards/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // een teller mag nooit iets breken
    }
  }, [token])

  return null
}
