"use client"

import { useState } from "react"
import { KLEUR } from "@/lib/ontwerp"
import { afstandInWoorden } from "@/lib/fasen"

// Jullie namen, de trouwdatum en de locatie, op één plek gevraagd.
//
// Michiels voorstel van 22 september 2026, nadat "Algemene info" in beide
// bouwers niet lekker werkte: vraag het hier, aan het begin, dan staat het
// standaard op je kaarten en op je website, en kun je het in elke bouwer nog
// aanpassen. En dan kan het dashboard er meteen iets mee: de naam van je
// bruiloft en een teller tot de grote dag.
//
// Heb je nog geen account, dan bewaren we het in je browser en neemt de
// bouwer het over zodra je begint. Zo hoef je niets twee keer te typen.

const LS_ONTWERP = "sayingyes_kaart"
const LS_BRUILOFT_LOCATIE = "sayingyes_bruiloft_locatie"

export default function BruiloftInfo({
  eventId,
  naam: naamIn,
  datum: datumIn,
  locatie: locatieIn,
}: {
  /** Leeg als er nog geen bruiloft is: dan bewaren we in de browser. */
  eventId: string | null
  naam: string
  datum: string | null
  locatie: string | null
}) {
  const [naam, setNaam] = useState(naamIn)
  const [datum, setDatum] = useState(datumIn ?? "")
  const [locatie, setLocatie] = useState(locatieIn ?? "")
  const [open, setOpen] = useState(!naamIn.trim() || !datumIn)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function bewaar() {
    setBezig(true)
    setFout(null)
    try {
      // Zonder account: in de browser, zodat de bouwer het overneemt.
      if (!eventId) {
        try {
          const vorig = JSON.parse(localStorage.getItem(LS_ONTWERP) ?? "{}") as Record<string, unknown>
          localStorage.setItem(LS_ONTWERP, JSON.stringify({ ...vorig, names: naam, datum }))
          localStorage.setItem(LS_BRUILOFT_LOCATIE, locatie)
        } catch {}
        setOpen(false)
        return
      }

      const res = await fetch("/api/bruiloft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, naam, datum: datum || null, locatie }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setFout(data.error ?? "Bewaren mislukte, probeer het nog eens.")
        return
      }
      setOpen(false)
      // Opnieuw laden, zodat de naam en de teller bovenaan meteen kloppen.
      window.location.reload()
    } catch {
      setFout("Bewaren mislukte, probeer het nog eens.")
    } finally {
      setBezig(false)
    }
  }

  const veld = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none"
  const veldStijl = { color: KLEUR.inkt, borderColor: KLEUR.goudLicht }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ color: KLEUR.zacht, border: `1px solid ${KLEUR.zand}`, background: "transparent", cursor: "pointer" }}
      >
        wijzig
      </button>
    )
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 w-full"
      style={{ backgroundColor: "#fff", border: `1px solid ${KLEUR.goudLicht}` }}
    >
      <div>
        <p className="m-0 font-semibold" style={{ color: KLEUR.inkt }}>
          {naamIn.trim() ? "Jullie gegevens" : "Om wie en wanneer gaat het?"}
        </p>
        <p className="m-0 text-sm mt-0.5 max-w-[62ch]" style={{ color: KLEUR.zacht }}>
          Deze drie komen standaard op je kaarten en op je website. In elke bouwer kun je ze nog
          aanpassen.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ color: KLEUR.inkt }}>Jullie namen</span>
          <input
            id="bruiloft-naam"
            className={veld}
            style={veldStijl}
            placeholder="Sophie &amp; Daan"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            maxLength={80}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ color: KLEUR.inkt }}>Trouwdatum</span>
          <input
            id="bruiloft-datum"
            type="date"
            className={veld}
            style={veldStijl}
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ color: KLEUR.inkt }}>
            Locatie <span style={{ color: KLEUR.zacht, fontWeight: 400 }}>(als je die weet)</span>
          </span>
          <input
            id="bruiloft-locatie"
            className={veld}
            style={veldStijl}
            placeholder="Kasteel Wijenburg, Echteld"
            value={locatie}
            onChange={(e) => setLocatie(e.target.value)}
            maxLength={120}
          />
        </label>
      </div>

      {datum && (
        <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>
          Dan is het nog <b style={{ color: KLEUR.inkt }}>{afstandInWoorden(datum).replace(/^over /, "")}</b>.
        </p>
      )}

      {fout && (
        <p className="m-0 text-sm font-semibold" style={{ color: "#991B1B" }}>{fout}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void bewaar()}
          disabled={bezig || !naam.trim()}
          className="text-sm font-semibold px-4 py-2.5 rounded-xl"
          style={{
            backgroundColor: naam.trim() ? KLEUR.inkt : "#fff",
            color: naam.trim() ? KLEUR.ivoor : KLEUR.zacht,
            border: `1px solid ${naam.trim() ? KLEUR.inkt : KLEUR.goudLicht}`,
            cursor: naam.trim() && !bezig ? "pointer" : "default",
          }}
        >
          {bezig ? "Bewaren…" : "Bewaren"}
        </button>
        {naamIn.trim() && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm underline"
            style={{ color: KLEUR.zacht, background: "none", border: 0, cursor: "pointer" }}
          >
            Laat maar
          </button>
        )}
      </div>
    </div>
  )
}
