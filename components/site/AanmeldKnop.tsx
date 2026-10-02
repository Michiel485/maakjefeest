"use client"

// Op de telefoon staat onderaan altijd één knop naar het aanmelden, zodra de
// opening uit beeld is. Wie klaar is met lezen hoeft nooit te zoeken. Hij gaat
// weg zodra het aanmeldformulier zelf in beeld is (ontwerpronde, 2 oktober
// 2026).

import { useEffect, useState } from "react"
import type { SC } from "@/lib/event-styles"

export default function AanmeldKnop({ href, sc, label = "Ben je erbij?" }: { href: string; sc: SC; label?: string }) {
  const [voorbij, setVoorbij] = useState(false)
  const [formulierInBeeld, setFormulierInBeeld] = useState(false)

  useEffect(() => {
    const kijk = () => setVoorbij(window.scrollY > window.innerHeight * 0.7)
    kijk()
    window.addEventListener("scroll", kijk, { passive: true })
    const formulier = document.getElementById("rsvp")
    let kijker: IntersectionObserver | null = null
    if (formulier) {
      kijker = new IntersectionObserver((items) => setFormulierInBeeld(items.some((i) => i.isIntersecting)), { rootMargin: "0px 0px -20% 0px" })
      kijker.observe(formulier)
    }
    return () => { window.removeEventListener("scroll", kijk); kijker?.disconnect() }
  }, [])

  const zichtbaar = voorbij && !formulierInBeeld
  return (
    <div
      className="md:hidden"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        display: "flex",
        justifyContent: "center",
        padding: `0 16px calc(14px + env(safe-area-inset-bottom, 0px))`,
        pointerEvents: zichtbaar ? "auto" : "none",
        opacity: zichtbaar ? 1 : 0,
        transform: zichtbaar ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      <a
        href={href}
        aria-hidden={!zichtbaar}
        tabIndex={zichtbaar ? 0 : -1}
        style={{
          display: "inline-block",
          padding: "12px 26px",
          borderRadius: 999,
          backgroundColor: sc.buttonBg,
          color: sc.buttonText,
          fontFamily: sc.fontFamily,
          fontWeight: 700,
          fontSize: "0.9375rem",
          textDecoration: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
        }}
      >
        {label}
      </a>
    </div>
  )
}
