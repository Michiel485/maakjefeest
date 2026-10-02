"use client"

// Wie via zijn persoonlijke kaartlink naar de site komt (?gast=...) ziet
// "Hoi Sam" in de opening (ontwerpronde, 2 oktober 2026). De pagina staat in
// de cache, dus dit kan alleen in de browser: de naam wordt opgehaald en in
// het vak gezet dat de opening ervoor vrijhoudt (#sy-begroeting).

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export default function Begroeting({ eventId, kleur, font }: { eventId: string; kleur: string; font: string }) {
  const [naam, setNaam] = useState<string | null>(null)
  const [vak, setVak] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let gast = ""
    try { gast = new URLSearchParams(window.location.search).get("gast") ?? "" } catch {}
    if (!/^[0-9a-f-]{36}$/i.test(gast)) return
    const q = new URLSearchParams({ event: eventId, gast })
    fetch(`/api/rsvp?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { persoonlijk?: boolean; groepen?: { personen: { voornaam: string; is_kind: boolean }[] }[] } | null) => {
        const personen = d?.persoonlijk ? (d.groepen?.[0]?.personen ?? []) : []
        const namen = personen.filter((p) => !p.is_kind).map((p) => p.voornaam.trim()).filter(Boolean)
        if (!namen.length) return
        const tekst = namen.length === 1 ? namen[0] : `${namen.slice(0, -1).join(", ")} en ${namen[namen.length - 1]}`
        setNaam(tekst)
        setVak(document.getElementById("sy-begroeting"))
      })
      .catch(() => {})
  }, [eventId])

  if (!naam || !vak) return null
  return createPortal(
    <p
      style={{
        margin: "0 0 10px",
        fontFamily: font,
        fontSize: "1.05rem",
        fontWeight: 600,
        letterSpacing: "0.02em",
        color: kleur,
        opacity: 0,
        animation: "sy-opkomen 0.6s ease forwards",
      }}
    >
      Hoi {naam}
    </p>,
    vak
  )
}
