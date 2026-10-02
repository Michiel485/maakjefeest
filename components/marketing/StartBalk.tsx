"use client"

// Op de telefoon: zodra je voorbij het namenblok bovenaan scrolt, verschijnt
// onderaan een smalle balk met Start gratis. De homepage is op een telefoon
// lang, en de knop uit de kop stond daar verborgen; nu is beginnen altijd
// één tik weg (Michiel, 2 oktober 2026). Op de laptop staat de knop in de
// kop en doet deze balk niets.

import { useEffect, useState } from "react"
import Link from "next/link"
import { GOUD_LICHT, INKT, IVOOR } from "./stijl"

/** naId: het blok bovenaan; de balk komt zodra dat helemaal voorbij is */
export default function StartBalk({ href = "/start", naId }: { href?: string; naId: string }) {
  const [zichtbaar, setZichtbaar] = useState(false)

  useEffect(() => {
    const el = document.getElementById(naId)
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setZichtbaar(!e.isIntersecting && e.boundingClientRect.bottom < 0),
      { threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [naId])

  return (
    <div
      className="sm:hidden fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 px-5 py-3 border-t backdrop-blur-md"
      style={{
        backgroundColor: `${IVOOR}F2`,
        borderColor: `${GOUD_LICHT}80`,
        paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        transform: zichtbaar ? "translateY(0)" : "translateY(110%)",
        transition: "transform 0.35s ease",
        pointerEvents: zichtbaar ? "auto" : "none",
      }}
      aria-hidden={!zichtbaar}
    >
      <p className="text-xs leading-snug" style={{ color: INKT }}>
        Gratis ontwerpen,<br />zonder account
      </p>
      <Link
        href={href}
        tabIndex={zichtbaar ? 0 : -1}
        className="inline-flex items-center justify-center text-sm font-semibold px-6 py-3 rounded-xl flex-shrink-0"
        style={{ backgroundColor: INKT, color: IVOOR, textDecoration: "none", boxShadow: "0 6px 20px rgba(26,26,26,0.2)" }}
      >
        Start gratis
      </Link>
    </div>
  )
}
