"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MAX_PUNT_TEKST,
  leesStand,
  puntenVanFase,
  voortgang,
  type ChecklistFase,
  type ChecklistStand,
  type Signalen,
} from "@/lib/checklist"
import { FASE_NAAM, FASE_ORDE, faseIndex, type Fase } from "@/lib/fasen"

const GOLD = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG = "#FBF5E8"
const CHARCOAL = "#1A1A1A"
const BODY = "#5C5248"
const SOFT = "#9A8E82"
const IVORY_CARD = "#F5EFE4"
const GREEN = "#059669"

// De checklist in het dashboard. Michiels punt: dit moet vanaf het begin
// zichtbaar zijn, en de Save the Date is er zelf een punt van. Dus geen los
// scherm en geen extraatje onderaan, maar de ruggengraat waar onze producten
// tussen staan.
//
// De fase waarin het bruidspaar zit staat open, de rest is ingeklapt. Zo zie je
// wat er nu te doen is zonder dat de andere zesentwintig punten in de weg
// staan, en zonder dat ze verstopt zijn.

export default function Checklist({
  eventId,
  fase,
  stand: standIn,
  signalen,
}: {
  eventId: string
  fase: Fase
  stand: unknown
  signalen: Signalen
}) {
  const [stand, setStand] = useState<ChecklistStand>(() => leesStand(standIn))
  const [open, setOpen] = useState<Set<Fase>>(() => new Set([fase]))
  const [bezig, setBezig] = useState<string | null>(null)
  const [nieuwVoor, setNieuwVoor] = useState<Fase | null>(null)
  const [nieuwWat, setNieuwWat] = useState("")
  const [fout, setFout] = useState<string | null>(null)

  const totaal = voortgang(stand, signalen)
  const deel = totaal.totaal > 0 ? Math.round((totaal.af / totaal.totaal) * 100) : 0

  async function stuur(body: Record<string, unknown>, sleutel: string) {
    setBezig(sleutel)
    setFout(null)
    try {
      const res = await fetch("/api/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, ...body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFout(data.error ?? "Bijwerken mislukte, probeer het nog eens.")
        return false
      }
      setStand(leesStand(data.checklist))
      return true
    } catch {
      setFout("Bijwerken mislukte, probeer het nog eens.")
      return false
    } finally {
      setBezig(null)
    }
  }

  async function voegToe(f: Fase) {
    const wat = nieuwWat.trim()
    if (!wat) return
    const goed = await stuur({ nieuw: { wat, fase: f } }, `nieuw-${f}`)
    if (goed) {
      setNieuwWat("")
      setNieuwVoor(null)
    }
  }

  function wisselFase(f: Fase) {
    setOpen((v) => {
      const n = new Set(v)
      if (n.has(f)) n.delete(f)
      else n.add(f)
      return n
    })
  }

  return (
    <section id="checklist" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl" style={{ color: CHARCOAL, fontFamily: "var(--font-cormorant)" }}>
            Je checklist
          </h2>
          <p className="text-sm mt-0.5" style={{ color: SOFT }}>
            Alles wat er bij een bruiloft komt kijken, op volgorde. Wat bij ons gebeurt vinkt zichzelf af.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ width: 120, backgroundColor: IVORY_CARD }}
            role="img"
            aria-label={`${totaal.af} van ${totaal.totaal} punten af`}
          >
            <div style={{ width: `${deel}%`, height: "100%", backgroundColor: GOLD }} />
          </div>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: CHARCOAL }}
          >
            {totaal.af} van {totaal.totaal}
          </span>
        </div>
      </div>

      {fout && (
        <p className="text-sm font-semibold" style={{ color: "#991B1B" }}>
          {fout}
        </p>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${GOLD_LIGHT}` }}>
        {FASE_ORDE.map((f, i) => {
          const punten = puntenVanFase(f as ChecklistFase, stand, signalen)
          const afAantal = punten.filter((p) => p.af).length
          const isNu = f === fase
          const voorbij = faseIndex(f) < faseIndex(fase)
          const isOpen = open.has(f)

          return (
            <div
              key={f}
              style={{
                borderTop: i === 0 ? undefined : `1px solid ${GOLD_LIGHT}`,
                backgroundColor: isNu ? GOLD_BG : "transparent",
              }}
            >
              <button
                onClick={() => wisselFase(f)}
                aria-expanded={isOpen}
                className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left"
                style={{ cursor: "pointer", background: "transparent", border: 0 }}
              >
                <span className="font-semibold flex-1 min-w-[140px]" style={{ color: CHARCOAL }}>
                  {FASE_NAAM[f]}
                  {isNu && (
                    <span
                      className="ml-2 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: GOLD, color: "#fff" }}
                    >
                      Nu
                    </span>
                  )}
                </span>
                <span className="text-sm tabular-nums" style={{ color: voorbij && afAantal < punten.length ? "#B45309" : SOFT }}>
                  {afAantal} van {punten.length}
                </span>
                <span aria-hidden="true" style={{ color: SOFT, width: 14, textAlign: "center" }}>
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <ul className="list-none m-0 px-4 pb-4 flex flex-col gap-2.5">
                  {punten.map((p) => (
                    <li key={p.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`punt-${p.id}`}
                        checked={p.af}
                        disabled={p.doorOns || bezig === p.id}
                        onChange={(e) => void stuur({ punt: p.id, af: e.target.checked }, p.id)}
                        className="mt-1"
                        style={{
                          accentColor: p.doorOns ? GREEN : GOLD,
                          cursor: p.doorOns ? "default" : "pointer",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`punt-${p.id}`}
                          className="text-sm"
                          style={{
                            color: p.af ? SOFT : CHARCOAL,
                            textDecoration: p.af ? "line-through" : undefined,
                            cursor: p.doorOns ? "default" : "pointer",
                          }}
                        >
                          {p.wat}
                        </label>
                        {p.doorOns && (
                          <span className="ml-2 text-[11px] font-semibold" style={{ color: GREEN }}>
                            gelukt
                          </span>
                        )}
                        {p.waarom && !p.af && (
                          <p className="text-xs mt-0.5" style={{ color: SOFT }}>
                            {p.waarom}
                          </p>
                        )}
                        {p.bijOns && !p.af && (
                          <Link
                            href={p.bijOns.naar}
                            className="inline-block text-xs font-semibold mt-1 underline"
                            style={{ color: GOLD }}
                          >
                            {p.bijOns.knop}
                          </Link>
                        )}
                      </div>
                      {p.eigen && (
                        <button
                          onClick={() => void stuur({ weg: p.id }, p.id)}
                          className="text-xs underline shrink-0"
                          style={{ color: SOFT, cursor: "pointer" }}
                          aria-label={`${p.wat} verwijderen`}
                        >
                          weg
                        </button>
                      )}
                    </li>
                  ))}

                  {nieuwVoor === f ? (
                    <li className="flex flex-wrap items-center gap-2 mt-1">
                      <input
                        value={nieuwWat}
                        onChange={(e) => setNieuwWat(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void voegToe(f)
                          if (e.key === "Escape") { setNieuwVoor(null); setNieuwWat("") }
                        }}
                        maxLength={MAX_PUNT_TEKST}
                        autoFocus
                        placeholder="Wat wil je onthouden?"
                        className="flex-1 min-w-[180px] text-sm px-3 py-2 rounded-xl"
                        style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: "#fff", color: CHARCOAL }}
                      />
                      <button
                        onClick={() => void voegToe(f)}
                        disabled={!nieuwWat.trim() || bezig === `nieuw-${f}`}
                        className="text-sm font-semibold px-3 py-2 rounded-xl"
                        style={{
                          backgroundColor: CHARCOAL,
                          color: "#fff",
                          opacity: nieuwWat.trim() ? 1 : 0.5,
                          cursor: nieuwWat.trim() ? "pointer" : "default",
                        }}
                      >
                        Toevoegen
                      </button>
                      <button
                        onClick={() => { setNieuwVoor(null); setNieuwWat("") }}
                        className="text-sm underline"
                        style={{ color: SOFT, cursor: "pointer" }}
                      >
                        Annuleren
                      </button>
                    </li>
                  ) : (
                    <li>
                      <button
                        onClick={() => { setNieuwVoor(f); setNieuwWat(""); setFout(null) }}
                        className="text-sm font-semibold"
                        style={{ color: GOLD, cursor: "pointer", background: "transparent", border: 0, padding: 0 }}
                      >
                        + Eigen punt toevoegen
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
