"use client"

import { useEffect } from "react"

// Wie het adminpaneel opent is de eigenaar: markeer dit apparaat zodat eigen
// bezoeken niet in de bezoekersstatistieken terechtkomen.
export default function OwnerOptOut() {
  useEffect(() => {
    try {
      localStorage.setItem("sy_no_track", "1")
    } catch {}
  }, [])

  return (
    <p className="text-center text-xs py-6" style={{ color: "#9A8E82" }}>
      Bezoeken vanaf dit apparaat tellen niet mee in de bezoekersstatistieken.
    </p>
  )
}
