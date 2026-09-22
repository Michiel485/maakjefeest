"use client"

import { useEffect, useRef, useState } from "react"
import { KLEUR } from "@/lib/ontwerp"

// Eén knop "Acties" met een lijstje eronder, voor een regel in een tegel.
//
// Michiels wens van 22 september 2026: alles wat je met een kaart of met je
// website kunt doen op de regel zelf, achter één knop, in plaats van losse
// blokken onder de tegels. De kaartregels en de websiteregel delen deze
// vorm; wat erin staat bepalen zij zelf.

export default function ActieMenu({
  label = "Acties",
  children,
}: {
  label?: string
  /** De inhoud krijgt een sluitfunctie mee, voor na een geslaagde actie. */
  children: (sluit: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  // Buiten het menu klikken sluit het, net als Escape. Zonder dit blijft er
  // een open paneel achter zodra je verderop in het dashboard iets aanraakt.
  useEffect(() => {
    if (!open) return
    function buiten(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    function toets(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", buiten)
    document.addEventListener("keydown", toets)
    return () => {
      document.removeEventListener("mousedown", buiten)
      document.removeEventListener("keydown", toets)
    }
  }, [open])

  return (
    <div className="relative ml-auto" ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-[13px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap flex-shrink-0"
        style={{
          color: KLEUR.inkt,
          backgroundColor: open ? KLEUR.goudVlak : "transparent",
          border: `1px solid ${KLEUR.zand}`,
          cursor: "pointer",
        }}
      >
        {label} <span aria-hidden style={{ color: KLEUR.zacht }}>▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-64 rounded-xl overflow-hidden shadow-lg"
          style={{ backgroundColor: "#fff", border: `1px solid ${KLEUR.goudLicht}` }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function ActieScheiding() {
  return <div style={{ borderTop: `1px solid ${KLEUR.zand}` }} />
}

export function ActieUitleg({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 px-3 pb-2 text-[11px] leading-snug" style={{ color: KLEUR.zacht }}>
      {children}
    </p>
  )
}

export function ActieFout({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 px-3 py-2 text-[12px] font-semibold" style={{ color: "#991B1B" }}>
      {children}
    </p>
  )
}

export function ActieItem({
  children,
  href,
  onClick,
  nieuwTabblad,
  rood,
  nadruk,
}: {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  nieuwTabblad?: boolean
  rood?: boolean
  nadruk?: boolean
}) {
  const stijl: React.CSSProperties = {
    color: rood ? "#991B1B" : KLEUR.inkt,
    fontWeight: nadruk ? 700 : 500,
    textDecoration: "none",
    background: "none",
    border: 0,
    cursor: "pointer",
  }
  const cls = "block w-full text-left px-3 py-2 text-[13px] hover:bg-[#FBF5E8]"
  if (href) {
    return (
      <a
        href={href}
        role="menuitem"
        className={cls}
        style={stijl}
        {...(nieuwTabblad ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    )
  }
  return (
    <button type="button" role="menuitem" onClick={onClick} className={cls} style={stijl}>
      {children}
    </button>
  )
}

/** Een klein formulier in het menu: één veld, bewaren, laat maar. */
export function ActieVeld({
  waarde,
  opWaarde,
  placeholder,
  bewaar,
  annuleer,
  bezig,
  mono,
  maxLength = 60,
  kinderen,
}: {
  waarde: string
  opWaarde: (v: string) => void
  placeholder?: string
  bewaar: () => void
  annuleer: () => void
  bezig: boolean
  mono?: boolean
  maxLength?: number
  /** Iets onder het veld, zoals een voorbeeld of een waarschuwing. */
  kinderen?: React.ReactNode
}) {
  return (
    <div className="p-3 flex flex-col gap-2">
      <input
        autoFocus
        value={waarde}
        onChange={(e) => opWaarde(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") bewaar()
          if (e.key === "Escape") annuleer()
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-lg border px-2.5 py-2 text-[13px] focus:outline-none"
        style={{ borderColor: KLEUR.goudLicht, color: KLEUR.inkt, fontFamily: mono ? "monospace" : undefined }}
      />
      {kinderen}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={bewaar}
          disabled={bezig}
          className="text-[13px] font-semibold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: KLEUR.inkt, color: KLEUR.ivoor, border: 0, cursor: "pointer" }}
        >
          {bezig ? "Bewaren…" : "Bewaren"}
        </button>
        <button
          type="button"
          onClick={annuleer}
          className="text-[13px] px-2 py-1.5 rounded-lg"
          style={{ color: KLEUR.zacht, background: "none", border: 0, cursor: "pointer" }}
        >
          Laat maar
        </button>
      </div>
    </div>
  )
}
