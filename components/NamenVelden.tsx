"use client"

import { useEffect, useState } from "react"
import { splitsNamen, voegNamenSamen } from "@/lib/namen"
import { KLEUR } from "@/lib/ontwerp"

/**
 * Jullie namen als twee losse velden, met een & ertussen. Bewaart ze samen als
 * "Michiel & Lindsey" (lib/namen.ts): het ontwerp kiest dan zelf wat er op de
 * kaart tussen komt (Michiel, 28 september 2026). Eén naam kan ook.
 */
export default function NamenVelden({
  waarde,
  onWijzig,
  klasse,
  stijl,
  id,
  onFocus,
}: {
  waarde: string
  onWijzig: (namen: string) => void
  klasse: string
  stijl?: React.CSSProperties
  /** Voor het eerste veld, zodat een tik op de kaart hier kan landen */
  id?: string
  onFocus?: () => void
}) {
  const begin = splitsNamen(waarde)
  const [een, setEen] = useState(begin?.[0] ?? waarde.trim())
  const [twee, setTwee] = useState(begin?.[1] ?? "")

  // Komt de waarde van buiten (laden, of een ander veld), dan volgen de velden
  useEffect(() => {
    if (waarde === voegNamenSamen(een, twee)) return
    const delen = splitsNamen(waarde)
    setEen(delen?.[0] ?? waarde.trim())
    setTwee(delen?.[1] ?? "")
    // Alleen op een nieuwe waarde van buiten; een en twee zijn hier de bron
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waarde])

  return (
    <div className="grid items-center gap-2" style={{ gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)" }}>
      <input
        id={id}
        aria-label="Eerste naam"
        className={klasse}
        style={stijl}
        placeholder="Sophie"
        value={een}
        maxLength={40}
        onFocus={onFocus}
        onChange={(e) => {
          setEen(e.target.value)
          onWijzig(voegNamenSamen(e.target.value, twee))
        }}
      />
      <span aria-hidden className="text-lg" style={{ fontFamily: "var(--font-cormorant)", color: KLEUR.goud }}>&amp;</span>
      <input
        aria-label="Tweede naam"
        className={klasse}
        style={stijl}
        placeholder="Daan"
        value={twee}
        maxLength={40}
        onFocus={onFocus}
        onChange={(e) => {
          setTwee(e.target.value)
          onWijzig(voegNamenSamen(een, e.target.value))
        }}
      />
    </div>
  )
}
