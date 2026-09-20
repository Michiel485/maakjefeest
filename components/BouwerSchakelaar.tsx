"use client"

import { useRouter } from "next/navigation"
import { KLEUR } from "@/lib/ontwerp"

// Wat maak je: Save the Date, trouwkaart of website.
//
// Staat in de kop van beide bouwers en ziet er in beide hetzelfde uit, zodat
// het voelt als één bouwer met drie onderdelen. Technisch zijn het twee
// pagina's, maar dat hoeft de klant niet te merken: hij klikt op Website en is
// er, en klikt op Trouwkaart en is terug. Eerder was de websitebouwer een
// doodlopende weg, daar kon je niet naar de kaarten terug.
//
// Het pakket volgt uit wat je activeert, niet uit waar je begon, dus wisselen
// mag altijd en kost niets.

export type Onderdeel = "save_the_date" | "trouwkaart" | "website"

const LABEL: Record<Onderdeel, string> = {
  save_the_date: "Save the Date",
  trouwkaart: "Trouwkaart",
  website: "Website",
}

export default function BouwerSchakelaar({
  actief,
  eventId,
  /** Wisselen binnen de kaartbouwer hoeft niet te navigeren. */
  opKaartType,
  /**
   * Wat er moet gebeuren voordat we naar de websitebouwer gaan als er nog geen
   * bruiloft bewaard is. De kaartbouwer geeft hier de namen, de datum en de
   * stijl door, zodat de website niet leeg begint maar meteen in dezelfde
   * sfeer staat. Zonder dit belandt een nieuwe bezoeker op het aanmaakformulier
   * en voelt het als een andere plek.
   */
  opWebsite,
}: {
  actief: Onderdeel
  eventId: string | null
  opKaartType?: (type: "save_the_date" | "trouwkaart") => void
  opWebsite?: () => void
}) {
  const router = useRouter()

  function ga(naar: Onderdeel) {
    if (naar === actief) return

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
    // anders knippert het beeld voor niets
    if (opKaartType) {
      opKaartType(naar)
      return
    }

    router.push(
      eventId ? `/kaart-maken?event_id=${eventId}&type=${naar}` : `/kaart-maken?type=${naar}`
    )
  }

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{ backgroundColor: KLEUR.goudVlak, border: `1px solid ${KLEUR.goudLicht}` }}
    >
      {(Object.keys(LABEL) as Onderdeel[]).map((o) => {
        const aan = o === actief
        return (
          <button
            key={o}
            onClick={() => ga(o)}
            aria-current={aan ? "page" : undefined}
            className="text-xs sm:text-sm font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors"
            style={{
              backgroundColor: aan ? "#fff" : "transparent",
              color: aan ? KLEUR.inkt : KLEUR.tekst,
              border: aan ? `1px solid ${KLEUR.goudLicht}` : "1px solid transparent",
              cursor: aan ? "default" : "pointer",
            }}
          >
            {LABEL[o]}
          </button>
        )
      })}
    </div>
  )
}
