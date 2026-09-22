"use client"

import { useEffect, useState } from "react"
import { KLEUR } from "@/lib/ontwerp"
import { afstandInWoorden } from "@/lib/fasen"
import { Aftellen } from "./Tegels"

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

/** Wat er in de browser staat, voor wie nog geen account heeft. */
function uitBrowser(): { naam: string; datum: string; locatie: string } {
  try {
    const o = JSON.parse(localStorage.getItem(LS_ONTWERP) ?? "{}") as Record<string, unknown>
    return {
      naam: typeof o.names === "string" ? o.names : "",
      datum: typeof o.datum === "string" ? o.datum : "",
      locatie: localStorage.getItem(LS_BRUILOFT_LOCATIE) ?? "",
    }
  } catch {
    return { naam: "", datum: "", locatie: "" }
  }
}

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

  // Zonder account staat je bruiloft in je browser en niet op de server, dus
  // die lezen we hier. Op de server weten we niet wat erin staat, vandaar dat
  // dit pas ná het eerste tekenen gebeurt.
  useEffect(() => {
    if (eventId) return
    const b = uitBrowser()
    if (!b.naam && !b.datum && !b.locatie) return
    setNaam(b.naam)
    setDatum(b.datum)
    setLocatie(b.locatie)
    setOpen(!b.naam.trim() || !b.datum)
  }, [eventId])

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
        // Dichtklappen, zodat je meteen ziet dat het gelukt is: de kop
        // hierboven toont dan je namen, je datum en het aftellen. Eerder
        // gebeurde er zichtbaar niets en leek de knop stuk.
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

  // Staat er al een bruiloft, dan is dit alleen een klein "wijzig" achter de
  // datum, en opent het formulier in een venster. Een balk over de volle
  // breedte onder je naam was lelijk en trok te veel aandacht voor iets dat
  // je één keer invult.
  const inKop = !!eventId

  if (inKop && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="underline underline-offset-2"
        style={{ color: KLEUR.zacht, background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}
      >
        wijzig
      </button>
    )
  }

  const formulier = (
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

  if (!inKop) {
    const heeftIets = !!naam.trim() || !!datum
    return (
      <div className="flex flex-col gap-4">
        {heeftIets && (
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1
                className="m-0"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 600,
                  fontSize: "clamp(1.7rem, 4vw, 2.5rem)",
                  lineHeight: 1.05,
                  color: KLEUR.inkt,
                  textWrap: "balance",
                }}
              >
                {naam.trim() ? `Bruiloft van ${naam.trim()}` : "Jullie bruiloft"}
              </h1>
              <div className="text-sm mt-1.5" style={{ color: KLEUR.zacht }}>
                {datum
                  ? new Date(datum).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
                  : "Nog geen trouwdatum"}
                {locatie ? ` · ${locatie}` : ""}
                {" · "}
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="underline underline-offset-2"
                  style={{ color: KLEUR.zacht, background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}
                >
                  {open ? "sluiten" : "wijzig"}
                </button>
              </div>
            </div>
            <Aftellen datum={datum || null} />
          </header>
        )}
        {open && formulier}
        {heeftIets && !open && (
          <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>
            Bewaard in deze browser. Zodra je je eerste ontwerp opslaat, verhuist het mee naar je
            eigen dashboard.
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(26,26,26,0.5)", backdropFilter: "blur(4px)" }}
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Jullie gegevens"
    >
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {formulier}
      </div>
    </div>
  )
}
