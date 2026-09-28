"use client"

import { useEffect } from "react"
import { meldInBrowser } from "@/lib/fout-browser"

// Een pagina die vastloopt: een nette melding in plaats van een wit scherm,
// en een mail naar de beheerder (28 september 2026)
export default function Fout({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    meldInBrowser(error, "foutpagina")
  }, [error])

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px", background: "#FAF7F2" }}>
      <div style={{ maxWidth: 420, textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", color: "#1A1A1A" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C5A059", fontWeight: 600, margin: "0 0 10px" }}>Even mis</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 12px" }}>Er ging iets mis</h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5C5248", margin: "0 0 24px" }}>
          Deze pagina liep vast. Wij hebben er een melding van gekregen. Probeer het nog een keer; lukt het dan nog niet, laad de pagina dan opnieuw.
        </p>
        <button
          onClick={() => unstable_retry()}
          style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "#C5A059", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
        >
          Probeer opnieuw
        </button>
      </div>
    </div>
  )
}
