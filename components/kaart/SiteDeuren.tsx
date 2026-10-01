"use client"

// De kaart gaat open als twee deuren, en daarachter staat het begin van de
// trouwwebsite (Michiel, 30 september 2026, optie B).
//
// Hoe het loopt:
// 1. Het beginscherm van de site komt op over de pagina, en de kaart schuift
//    vanaf zijn plek naar het midden van het scherm.
// 2. De kaart splitst in twee helften die naar je toe openzwaaien.
// 3. Daarna gaat de gast naar de site, die met hetzelfde beginscherm begint
//    (app/events/[slug]/layout.tsx). Of, in de bouwer, naar het voorbeeld.
//
// De helften zijn twee kopieën van de kaart, elk voor de helft zichtbaar. Zo
// hoeft er niets van de echte kaart af te worden geknipt.

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import SiteOpening from "@/components/SiteOpening"
import type { SiteOpeningData } from "@/lib/site-opening"

type Fase = "start" | "midden" | "open"

const NAAR_MIDDEN_MS = 450
const OPEN_MS = 1000

export default function SiteDeuren({
  van,
  kaart,
  breedte,
  hoogte,
  opening,
  rustig,
  onKlaar,
}: {
  /** Waar de kaart nu op het scherm staat */
  van: DOMRect
  /** De voorkant van de kaart, op zijn eigen maat getekend */
  kaart: ReactNode
  breedte: number
  hoogte: number
  opening: SiteOpeningData
  /** Minder beweging: alleen het beginscherm, geen deuren */
  rustig: boolean
  onKlaar: () => void
}) {
  const [fase, setFase] = useState<Fase>("start")
  const [scherm] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))

  useEffect(() => {
    if (rustig) {
      const t0 = requestAnimationFrame(() => setFase("midden"))
      const t = setTimeout(onKlaar, 320)
      return () => { cancelAnimationFrame(t0); clearTimeout(t) }
    }
    // Twee beelden wachten: dan staat de beginstand echt op het scherm en loopt
    // de overgang ernaartoe
    let r2 = 0
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setFase("midden")) })
    const t1 = setTimeout(() => setFase("open"), NAAR_MIDDEN_MS + 60)
    const t2 = setTimeout(onKlaar, NAAR_MIDDEN_MS + OPEN_MS - 80)
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t1); clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // In het midden, zo groot als past
  const schaal = Math.min(1, (scherm.w - 32) / breedte, (scherm.h * 0.82) / hoogte)
  const links = (scherm.w - breedte * schaal) / 2
  const boven = (scherm.h - hoogte * schaal) / 2
  const beginSchaal = van.width / breedte
  const transform = fase === "start"
    ? `translate(${van.left - links}px, ${van.top - boven}px) scale(${beginSchaal})`
    : `translate(0px, 0px) scale(${schaal})`

  const deur = (kant: "links" | "rechts") => {
    const open = fase === "open"
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: kant === "links" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
          transformOrigin: kant === "links" ? "left center" : "right center",
          transform: open ? `rotateY(${kant === "links" ? -108 : 108}deg)` : "rotateY(0deg)",
          opacity: open ? 0 : 1,
          transition: `transform ${OPEN_MS}ms cubic-bezier(.62,.04,.3,1), opacity ${OPEN_MS * 0.45}ms ease ${OPEN_MS * 0.55}ms`,
          backfaceVisibility: "hidden",
          willChange: "transform, opacity",
        }}
      >
        {kaart}
        {/* De binnenkant van de deur wordt donkerder naarmate hij opendraait */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: kant === "links"
              ? "linear-gradient(to left, rgba(0,0,0,0.28), rgba(0,0,0,0) 35%)"
              : "linear-gradient(to right, rgba(0,0,0,0.28), rgba(0,0,0,0) 35%)",
            opacity: open ? 1 : 0,
            transition: `opacity ${OPEN_MS * 0.6}ms ease`,
            pointerEvents: "none",
          }}
        />
      </div>
    )
  }

  return createPortal(
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 300 }}>
      <SiteOpening
        data={opening}
        style={{
          position: "absolute",
          opacity: fase === "start" ? 0 : 1,
          transition: `opacity ${rustig ? 250 : 380}ms ease`,
        }}
        // De namen en de datum pas als de deuren opengaan. Kwamen ze meteen
        // op, dan staken ze links en rechts achter de kaart uit terwijl die nog
        // naar het midden schoof (Michiel, 1 oktober 2026).
        inhoudStijl={
          rustig
            ? undefined
            : {
                opacity: fase === "open" ? 1 : 0,
                transform: fase === "open" ? "scale(1)" : "scale(0.94)",
                transition: `opacity ${OPEN_MS * 0.55}ms ease ${OPEN_MS * 0.25}ms, transform ${OPEN_MS}ms cubic-bezier(.3,.7,.3,1) ${OPEN_MS * 0.15}ms`,
              }
        }
      />
      {!rustig && (
        <div
          style={{
            position: "absolute",
            left: links,
            top: boven,
            width: breedte,
            height: hoogte,
            transformOrigin: "top left",
            transform,
            transition: `transform ${NAAR_MIDDEN_MS}ms cubic-bezier(.3,.7,.3,1)`,
            perspective: 1600,
            willChange: "transform",
          }}
        >
          {deur("links")}
          {deur("rechts")}
        </div>
      )}
    </div>,
    document.body
  )
}
