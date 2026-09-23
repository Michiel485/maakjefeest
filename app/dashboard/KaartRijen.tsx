"use client"

import { useState } from "react"
import { KLEUR } from "@/lib/ontwerp"
import { GUEST_TYPE_LABEL, CARD_TAAL_KORT, cardTaal, type CardGuestType, type CardRow } from "@/lib/cards"
import KaartActies from "./KaartActies"
import type { KaartRegel } from "./Tegels"

// De regels met kaarten in een tegel: naam, cijfers en het actiemenu.
//
// Dit is een clientonderdeel met de lijst in eigen staat, zodat hernoemen en
// verwijderen meteen te zien zijn. Het dashboard haalt daarna op de
// achtergrond de echte stand van de server; die duurt even (een handvol
// databasevragen), en op dat wachten zat Michiel niet te wachten
// (23 september 2026).

function kaartNaam(card: CardRow): string {
  // Heb je de kaart zelf een naam gegeven, dan die: twee kaarten voor dezelfde
  // groep heetten anders allebei "Alle gasten" en waren niet uit elkaar te
  // houden. Zie lib/cards.ts, kaartLabel.
  const eigen = card.content.naam?.trim()
  if (eigen) return eigen
  const groep = card.content.guestType ? GUEST_TYPE_LABEL[card.content.guestType as CardGuestType] : "Alle gasten"
  const taal = cardTaal(card.content.taal)
  return taal === "nl" ? groep : `${groep} · ${CARD_TAAL_KORT[taal]}`
}

export default function KaartRijen({
  regels: regelsVanServer,
  eventId,
  live,
}: {
  regels: KaartRegel[]
  eventId: string | null
  /** Werkt de link al voor gasten? Bepaalt wat er in het actiemenu staat. */
  live: boolean
}) {
  const [regels, setRegels] = useState(regelsVanServer)

  // Komt er een nieuwe lijst van de server, dan is die de waarheid.
  const [vorige, setVorige] = useState(regelsVanServer)
  if (regelsVanServer !== vorige) {
    setVorige(regelsVanServer)
    setRegels(regelsVanServer)
  }

  if (regels.length === 0) return null

  return (
    <div className="flex flex-col rounded-xl" style={{ border: `1px solid ${KLEUR.zand}` }}>
      {regels.map((r, i) => (
        <div
          key={r.card.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[13px]"
          style={{ borderTop: i === 0 ? undefined : `1px solid ${KLEUR.zand}` }}
        >
          <span className="font-medium flex-1 min-w-[120px]" style={{ color: KLEUR.inkt }}>{kaartNaam(r.card)}</span>
          <span className="flex items-center gap-3 ml-auto">
            <span className="tabular-nums" style={{ color: KLEUR.zacht }}>
              {r.verstuurd} verstuurd {"·"} {r.gereageerd} gereageerd {"·"} {r.card.view_count}{"×"} bekeken
            </span>
            <KaartActies
              card={r.card}
              eventId={eventId}
              live={live}
              naam={r.card.content.naam ?? ""}
              onHernoemd={(naam) =>
                setRegels((v) =>
                  v.map((x) =>
                    x.card.id === r.card.id
                      ? { ...x, card: { ...x.card, content: { ...x.card.content, naam: naam || undefined } } }
                      : x,
                  ),
                )
              }
              onVerwijderd={() => setRegels((v) => v.filter((x) => x.card.id !== r.card.id))}
            />
          </span>
        </div>
      ))}
    </div>
  )
}
