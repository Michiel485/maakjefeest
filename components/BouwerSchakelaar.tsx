"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { KLEUR } from "@/lib/ontwerp"

// De vier onderdelen van één bruiloft: het dashboard, de Save the Date, de
// trouwkaart en de website.
//
// Staat in de kop van de schil die alle vier delen, zodat het voelt als één
// bouwer met vier tabbladen. Technisch zijn het nog aparte pagina's, maar dat
// hoeft de klant niet te merken: hij klikt op Website en is er, en klikt op
// Dashboard en is terug.
//
// Het pakket volgt uit wat je activeert, niet uit waar je begon, dus wisselen
// mag altijd en kost niets.
//
// Op een telefoon passen vier namen plus twee knoppen niet naast elkaar. Daar
// wordt het één menuknop met de naam van waar je bent, en een lijst eronder.
// Michiels keuze van 21 september 2026, boven een scrollende rij.

export type Onderdeel = "dashboard" | "save_the_date" | "trouwkaart" | "website"

export const ONDERDEEL_LABEL: Record<Onderdeel, string> = {
  dashboard: "Dashboard",
  save_the_date: "Save the Date",
  trouwkaart: "Trouwkaart",
  website: "Website",
}

const VOLGORDE: Onderdeel[] = ["dashboard", "save_the_date", "trouwkaart", "website"]

export default function BouwerSchakelaar({
  actief,
  eventId,
  /** Wisselen binnen de kaartbouwer hoeft niet te navigeren. */
  opKaartType,
  /**
   * Wat er moet gebeuren voordat we naar de websitebouwer gaan als er nog geen
   * bruiloft bewaard is. De kaartbouwer geeft hier de namen, de datum en de
   * stijl door, zodat de website niet leeg begint maar meteen in dezelfde
   * sfeer staat.
   */
  opWebsite,
  /** "menu" is de telefoonweergave: één knop die een lijst opent. */
  variant = "tabs",
  /** Bij welke onderdelen staat al iets van de klant: die krijgen een stip. */
  metInhoud = [],
}: {
  actief: Onderdeel
  eventId: string | null
  opKaartType?: (type: "save_the_date" | "trouwkaart") => void
  opWebsite?: () => void
  variant?: "tabs" | "menu"
  metInhoud?: Onderdeel[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  // Het menu sluit als je ernaast tikt.
  useEffect(() => {
    if (!open) return
    function dicht(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", dicht)
    return () => document.removeEventListener("mousedown", dicht)
  }, [open])

  function ga(naar: Onderdeel) {
    setOpen(false)
    if (naar === actief) return

    if (naar === "dashboard") {
      router.push("/dashboard")
      return
    }

    if (naar === "website") {
      if (eventId) {
        router.push(`/bouwen?event_id=${eventId}`)
        return
      }
      opWebsite?.()
      router.push("/bouwen?plan=compleet")
      return
    }

    // Binnen de kaartbouwer: gewoon het soort kaart omzetten, geen navigatie,
    // anders knippert het beeld voor niets.
    if (opKaartType && actief !== "dashboard" && actief !== "website") {
      opKaartType(naar)
      return
    }

    router.push(
      eventId ? `/kaart-maken?event_id=${eventId}&type=${naar}` : `/kaart-maken?type=${naar}`
    )
  }

  if (variant === "menu") {
    return (
      <div ref={wrap} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl min-h-[40px]"
          style={{ backgroundColor: KLEUR.goudVlak, color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, cursor: "pointer" }}
        >
          <span className="inline-flex flex-col gap-[3px]" aria-hidden="true">
            <i className="block w-4 h-[2px] rounded" style={{ backgroundColor: KLEUR.inkt }} />
            <i className="block w-4 h-[2px] rounded" style={{ backgroundColor: KLEUR.inkt }} />
            <i className="block w-4 h-[2px] rounded" style={{ backgroundColor: KLEUR.inkt }} />
          </span>
          {/* Past naast het logo op 375 pixels; langere namen knippen we af
              in plaats van dat de knop van het scherm loopt. */}
          <span className="truncate max-w-[40vw]">{ONDERDEEL_LABEL[actief]}</span>
        </button>
        {open && (
          <div
            role="menu"
            className="absolute left-0 mt-2 w-60 rounded-2xl overflow-hidden z-50"
            style={{ backgroundColor: "#fff", border: `1px solid ${KLEUR.zand}`, boxShadow: "0 18px 40px -22px rgba(26,18,4,0.35)" }}
          >
            {VOLGORDE.map((o) => {
              const aan = o === actief
              return (
                <button
                  key={o}
                  type="button"
                  role="menuitem"
                  onClick={() => ga(o)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left text-[15px] min-h-[48px]"
                  style={{
                    backgroundColor: aan ? KLEUR.goudVlak : "transparent",
                    color: aan ? KLEUR.inkt : KLEUR.tekst,
                    fontWeight: aan ? 600 : 400,
                    borderBottom: `1px solid ${KLEUR.zand}`,
                    cursor: aan ? "default" : "pointer",
                  }}
                >
                  <span>
                    {ONDERDEEL_LABEL[o]}
                    {!aan && metInhoud.includes(o) && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full ml-2 align-middle" style={{ backgroundColor: KLEUR.goud }} />
                    )}
                  </span>
                  {aan && <span style={{ color: KLEUR.goud }}>{"✓"}</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{ backgroundColor: KLEUR.goudVlak, border: `1px solid ${KLEUR.goudLicht}` }}
    >
      {VOLGORDE.map((o) => {
        const aan = o === actief
        return (
          <button
            key={o}
            type="button"
            onClick={() => ga(o)}
            aria-current={aan ? "page" : undefined}
            className="text-xs sm:text-sm font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors min-h-[34px]"
            style={{
              backgroundColor: aan ? "#fff" : "transparent",
              color: aan ? KLEUR.inkt : KLEUR.tekst,
              border: aan ? `1px solid ${KLEUR.goudLicht}` : "1px solid transparent",
              cursor: aan ? "default" : "pointer",
            }}
          >
            {ONDERDEEL_LABEL[o]}
            {!aan && metInhoud.includes(o) && (
              <span className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 align-middle" style={{ backgroundColor: KLEUR.goud }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
