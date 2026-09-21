"use client"

import { useState } from "react"
import {
  EERSTE_HERINNERING_DAGEN,
  MAX_LOCATIE_NAAM,
  dagenTotDeadline,
  leesDeadline,
  voorstelDatum,
  type Deadline,
} from "@/lib/deadline"

const GOLD = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG = "#FBF5E8"
const CHARCOAL = "#1A1A1A"
const BODY = "#5C5248"
const SOFT = "#9A8E82"
const GREEN_BG = "#ECFDF5"
const GREEN_TEXT = "#065F46"
const ATTN = "#B45309"
const RED = "#991B1B"

const FREQUENTIES: { waarde: string; label: string; uitleg: string }[] = [
  { waarde: "dagelijks", label: "Dagelijks", uitleg: "alleen op dagen dat er iets binnenkwam" },
  { waarde: "wekelijks", label: "Wekelijks", uitleg: "één mail per week met de stand" },
  { waarde: "maandelijks", label: "Maandelijks", uitleg: "genoeg als je bruiloft nog ver weg is" },
  { waarde: "nooit", label: "Nooit", uitleg: "je kijkt zelf in je dashboard" },
]

// De deadline voor de aantallen bij de locatie, en hoe vaak je een tussenstand
// wilt horen.
//
// Het eerste komt uit Michiels eigen bruiloft: hij was te laat, de locatie had
// de inkoop al gedaan, en hij betaalde voor gasten die niet kwamen. Het tweede
// is zijn punt dat wij niet voor de klant moeten bepalen hoe vaak hij iets van
// ons hoort.

export default function DeadlineInstelling({
  eventId,
  trouwdag,
  deadline: deadlineIn,
  frequentie: frequentieIn,
  komen,
  stil,
}: {
  eventId: string
  trouwdag: string | null
  deadline: unknown
  frequentie: string
  komen: number
  stil: number
}) {
  const [deadline, setDeadline] = useState<Deadline>(() => leesDeadline(deadlineIn))
  const [frequentie, setFrequentie] = useState(frequentieIn)
  const [open, setOpen] = useState(false)
  const [naam, setNaam] = useState(() => leesDeadline(deadlineIn).naam ?? "")
  const [datum, setDatum] = useState(
    () => leesDeadline(deadlineIn).datum ?? voorstelDatum(trouwdag) ?? ""
  )
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)

  const over = dagenTotDeadline(deadline)

  async function stuur(body: Record<string, unknown>, sleutel: string) {
    setBezig(sleutel)
    setFout(null)
    try {
      const res = await fetch("/api/bruiloft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, ...body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFout(data.error ?? "Bijwerken mislukte, probeer het nog eens.")
        return false
      }
      if (data.deadline !== undefined) setDeadline(leesDeadline(data.deadline))
      if (typeof data.stand_frequentie === "string") setFrequentie(data.stand_frequentie)
      return true
    } catch {
      setFout("Bijwerken mislukte, probeer het nog eens.")
      return false
    } finally {
      setBezig(null)
    }
  }

  async function bewaar() {
    if (!datum) {
      setFout("Vul de datum in waarop je locatie de aantallen wil hebben.")
      return
    }
    const goed = await stuur({ deadline: { naam: naam.trim() || null, datum } }, "bewaar")
    if (goed) setOpen(false)
  }

  const chip =
    deadline.gedaan
      ? { tekst: "Doorgegeven", stijl: { backgroundColor: GREEN_BG, color: GREEN_TEXT } }
      : over == null
        ? { tekst: "Nog niet gezet", stijl: { backgroundColor: GOLD_BG, color: SOFT } }
        : over < 0
          ? {
              tekst: `${Math.abs(over)} ${Math.abs(over) === 1 ? "dag" : "dagen"} te laat`,
              stijl: { backgroundColor: "#FEF2F2", color: RED },
            }
          : over === 0
            ? { tekst: "Vandaag", stijl: { backgroundColor: "#FEF6E7", color: ATTN } }
            : {
                // Alarmkleur alleen als we ook echt gaan mailen. Een deadline
                // van over acht maanden is een afspraak, niet een probleem.
                tekst: `Over ${over} ${over === 1 ? "dag" : "dagen"}`,
                stijl:
                  over <= EERSTE_HERINNERING_DAGEN
                    ? { backgroundColor: "#FEF6E7", color: ATTN }
                    : { backgroundColor: GOLD_BG, color: BODY },
              }

  return (
    <section id="deadline" className="flex flex-col gap-4 scroll-mt-24">
      <div>
        <h2 className="text-2xl m-0" style={{ color: CHARCOAL, fontFamily: "var(--font-cormorant)" }}>
          Aantallen naar je locatie
        </h2>
        <p className="text-sm mt-0.5 max-w-[68ch]" style={{ color: SOFT }}>
          Wij sturen niets naar je locatie, dat blijft aan jou. We zorgen dat je het niet vergeet en
          dat de lijst klaarstaat.
        </p>
      </div>

      {fout && (
        <p className="text-sm font-semibold m-0" style={{ color: RED }}>
          {fout}
        </p>
      )}

      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium" style={{ color: CHARCOAL }}>
            {deadline.naam ? `${deadline.naam}` : "Je locatie of cateraar"}
            {deadline.datum && (
              <span className="ml-2 text-sm" style={{ color: SOFT }}>
                {new Date(deadline.datum).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </span>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
            style={{ letterSpacing: "0.03em", ...chip.stijl }}
          >
            {chip.tekst}
          </span>
        </div>

        {over == null && !open && (
          <p className="text-sm m-0 max-w-[68ch]" style={{ color: BODY }}>
            Vraag je locatie wanneer zij je definitieve aantallen willen hebben, en zet die datum
            hier. Wie te laat is betaalt voor gasten die niet komen, want de inkoop is dan al
            gedaan. Twee weken vooraf is gebruikelijk, maar sommige locaties willen het eerder.
          </p>
        )}

        {over != null && !deadline.gedaan && !open && (
          <div className="flex flex-wrap gap-x-7 gap-y-3 tabular-nums">
            <div>
              <p className="text-[11px] uppercase m-0" style={{ letterSpacing: "0.06em", color: SOFT }}>
                Komen
              </p>
              <p
                className="m-0"
                style={{ fontFamily: "var(--font-cormorant)", fontSize: 28, lineHeight: 1.1, color: CHARCOAL }}
              >
                {komen}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase m-0" style={{ letterSpacing: "0.06em", color: SOFT }}>
                Nog stil
              </p>
              <p
                className="m-0"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: 28,
                  lineHeight: 1.1,
                  color: stil > 0 ? ATTN : CHARCOAL,
                }}
              >
                {stil}
              </p>
            </div>
          </div>
        )}

        {open ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase font-semibold" style={{ letterSpacing: "0.08em", color: SOFT }}>
                Naam van je locatie of cateraar
              </span>
              <input
                id="deadline-naam"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                maxLength={MAX_LOCATIE_NAAM}
                placeholder="Kasteel Wijenburg"
                className="text-sm px-3 py-2.5 rounded-xl"
                style={{ border: `1px solid ${GOLD_LIGHT}`, color: CHARCOAL, maxWidth: 340 }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase font-semibold" style={{ letterSpacing: "0.08em", color: SOFT }}>
                Wanneer willen zij je aantallen hebben?
              </span>
              <input
                id="deadline-datum"
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="text-sm px-3 py-2.5 rounded-xl"
                style={{ border: `1px solid ${GOLD_LIGHT}`, color: CHARCOAL, maxWidth: 200 }}
              />
              {trouwdag && (
                <span className="text-xs" style={{ color: SOFT }}>
                  Twee weken voor je trouwdag is {" "}
                  {new Date(voorstelDatum(trouwdag) ?? "").toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "long",
                  })}
                  .
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void bewaar()}
                disabled={bezig === "bewaar"}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: CHARCOAL, color: "#fff", cursor: "pointer" }}
              >
                {bezig === "bewaar" ? "Bewaren…" : "Bewaren"}
              </button>
              <button
                onClick={() => { setOpen(false); setFout(null) }}
                className="text-sm underline"
                style={{ color: SOFT, cursor: "pointer" }}
              >
                Annuleren
              </button>
              {deadline.datum && (
                <button
                  onClick={() => void stuur({ deadline: null }, "weg").then((g) => g && setOpen(false))}
                  className="text-sm underline ml-auto"
                  style={{ color: SOFT, cursor: "pointer" }}
                >
                  Deadline weghalen
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setOpen(true); setFout(null) }}
              className="text-sm font-semibold px-4 py-2.5 rounded-xl"
              style={
                over == null
                  ? { backgroundColor: CHARCOAL, color: "#fff", cursor: "pointer" }
                  : { border: `1px solid ${GOLD_LIGHT}`, color: BODY, cursor: "pointer" }
              }
            >
              {over == null ? "Deadline instellen" : "Wijzigen"}
            </button>
            {over != null && !deadline.gedaan && (
              <button
                onClick={() => void stuur({ gedaan: true }, "gedaan")}
                disabled={bezig === "gedaan"}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD}`, color: CHARCOAL, cursor: "pointer" }}
              >
                {bezig === "gedaan" ? "Bezig…" : "Doorgegeven"}
              </button>
            )}
            {deadline.gedaan && (
              <button
                onClick={() => void stuur({ gedaan: false }, "gedaan")}
                className="text-sm underline"
                style={{ color: SOFT, cursor: "pointer" }}
              >
                Toch nog niet
              </button>
            )}
          </div>
        )}

        {deadline.gedaan && (
          <p className="text-sm m-0" style={{ color: GREEN_TEXT }}>
            Mooi. Hier houden we het bij, je hoort ons er niet meer over.
          </p>
        )}
      </div>

      {/* ── Hoe vaak wil je een tussenstand ──
          Michiels punt: dat moeten we vragen en niet voor de klant beslissen. */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}
      >
        <div>
          <p className="font-medium m-0" style={{ color: CHARCOAL }}>
            Hoe vaak wil je horen hoe het ervoor staat?
          </p>
          <p className="text-sm mt-0.5 m-0 max-w-[68ch]" style={{ color: SOFT }}>
            Eén mail met wie erbij komt en wie nog niets liet weten. We sturen niets als er niets
            veranderd is.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FREQUENTIES.map((f) => {
            const aan = frequentie === f.waarde
            return (
              <button
                key={f.waarde}
                onClick={() => void stuur({ stand_frequentie: f.waarde }, `f-${f.waarde}`)}
                disabled={bezig === `f-${f.waarde}`}
                title={f.uitleg}
                className="text-sm px-3.5 py-2 rounded-xl"
                style={
                  aan
                    ? { backgroundColor: GOLD_BG, border: `1px solid ${GOLD}`, color: CHARCOAL, fontWeight: 600, cursor: "pointer" }
                    : { border: `1px solid ${GOLD_LIGHT}`, color: BODY, cursor: "pointer" }
                }
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <p className="text-xs m-0" style={{ color: SOFT }}>
          {FREQUENTIES.find((f) => f.waarde === frequentie)?.uitleg}
        </p>
      </div>
    </section>
  )
}
