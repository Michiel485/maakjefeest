"use client"

import { useEffect } from "react"
import { meldInBrowser } from "@/lib/fout-browser"

// Als zelfs de buitenste laag van de site vastloopt. Moet zijn eigen html en
// body hebben, want de gewone opmaak is er dan niet (28 september 2026).
export default function GlobaleFout({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    meldInBrowser(error, "hele site")
  }, [error])

  return (
    <html lang="nl">
      <body style={{ margin: 0, background: "#FAF7F2" }}>
        <title>Er ging iets mis</title>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
          <div style={{ maxWidth: 420, textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", color: "#1A1A1A" }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 12px" }}>Er ging iets mis</h1>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5C5248", margin: "0 0 24px" }}>
              Wij hebben er een melding van gekregen. Probeer het nog een keer.
            </p>
            <button
              onClick={() => unstable_retry()}
              style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "#C5A059", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
