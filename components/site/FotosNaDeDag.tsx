// Na de bruiloft komen de foto's bovenaan: de fotomuur bekijken en je eigen
// foto's delen (ontwerpronde, 2 oktober 2026). Alleen als de fotomuur aanstaat.

import type { SC } from "@/lib/event-styles"
import SectieKop from "./SectieKop"

export default function FotosNaDeDag({ sc, fotomuurHref, delenHref }: { sc: SC; fotomuurHref: string; delenHref: string }) {
  const knop = (vol: boolean) => ({
    display: "inline-block",
    padding: "12px 24px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: "0.9375rem",
    textDecoration: "none",
    backgroundColor: vol ? sc.buttonBg : "transparent",
    color: vol ? sc.buttonText : sc.accent,
    border: `1px solid ${vol ? sc.buttonBg : sc.accent}`,
  } as const)
  return (
    <div className="@container" style={{ fontFamily: sc.fontFamily, padding: "48px 24px 56px", textAlign: "center" }}>
      <SectieKop
        sc={sc}
        kopje="Wat een dag"
        titel="De foto's"
        onder={<p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: sc.bodyText }}>Bedankt dat je erbij was. Bekijk de foto's van iedereen, en deel die van jou.</p>}
      />
      <div className="flex flex-wrap justify-center" style={{ gap: 10 }}>
        <a href={fotomuurHref} style={knop(true)}>Bekijk de fotomuur</a>
        <a href={delenHref} style={knop(false)}>Deel jouw foto&apos;s</a>
      </div>
    </div>
  )
}
