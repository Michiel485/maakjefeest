"use client"

import { useState } from "react"
import { laadXlsx } from "@/lib/xlsx-laden"
import { KLEUR } from "@/lib/ontwerp"
import { leesGeplakteLijst, MAX_KIND_LEEFTIJD } from "@/lib/gasten"

// Gasten aan de lijst zetten.
//
// Eén tabel met kolomnamen, en drie manieren om die te vullen: met de hand
// typen, een ingevuld bestand uploaden, of een lijst plakken. Alle drie komen
// in dezelfde tabel terecht, en die tabel is ook de controle: je ziet precies
// wat er wordt opgeslagen en kunt elk vakje nog aanpassen voordat je bewaart.
//
// Eerst was dit één groot tekstvak waar je alles in gooide. Dat las prima,
// maar je zag niet welke gegevens we eigenlijk willen hebben en je kon een
// verkeerde gok niet ter plekke herstellen.

export interface GastEvent {
  id: string
  title: string
}

interface Regel {
  voornaam: string
  achternaam: string
  /** Vrije tekst. Regels met dezelfde naam horen bij hetzelfde gezin. */
  huishouden: string
  email: string
  telefoon: string
  groep: string
  kind: boolean
  leeftijd: string
}

const leeg = (): Regel => ({
  voornaam: "", achternaam: "", huishouden: "", email: "", telefoon: "", groep: "daggast", kind: false, leeftijd: "",
})

const GROEPEN: { waarde: string; label: string }[] = [
  { waarde: "daggast", label: "Daggast" },
  { waarde: "avondgast", label: "Avondgast" },
  { waarde: "receptiegast", label: "Receptiegast" },
]

/** De kolomnamen van het sjabloon, ook gebruikt om een upload te herkennen. */
const KOLOMMEN = ["Voornaam", "Achternaam", "Huishouden", "E-mail", "Telefoon", "Gastengroep", "Kind (ja/nee)", "Leeftijd"]

/** Welke kolom is dit? Op een stukje van de naam, zodat kleine afwijkingen goed gaan. */
function kolomSoort(kop: string): keyof Regel | null {
  const k = kop.toLowerCase()
  if (k.includes("voornaam")) return "voornaam"
  if (k.includes("achternaam")) return "achternaam"
  if (k.includes("huishouden") || k.includes("gezin")) return "huishouden"
  if (k.includes("mail")) return "email"
  if (k.includes("tel")) return "telefoon"
  if (k.includes("groep")) return "groep"
  if (k.includes("kind")) return "kind"
  if (k.includes("leeftijd")) return "leeftijd"
  return null
}

function jaNee(waarde: unknown): boolean {
  const s = String(waarde ?? "").trim().toLowerCase()
  return s === "ja" || s === "j" || s === "yes" || s === "true" || s === "1" || s === "x"
}

export default function GastenToevoegen({
  events,
  /** Zonder een bewaarde bruiloft is er niets om gasten aan te hangen. */
  bruikbaar,
}: {
  events: GastEvent[]
  bruikbaar: boolean
}) {
  const [open, setOpen] = useState(false)
  const [eventId, setEventId] = useState(events[0]?.id ?? "")
  const [regels, setRegels] = useState<Regel[]>([leeg(), leeg(), leeg()])
  const [plakOpen, setPlakOpen] = useState(false)
  const [plaktekst, setPlaktekst] = useState("")
  const [bezig, setBezig] = useState(false)
  const [uitslag, setUitslag] = useState<{ tekst: string; fout?: boolean } | null>(null)

  const gevuld = regels.filter((r) => r.voornaam.trim())

  function zet(i: number, veld: keyof Regel, waarde: string | boolean) {
    setRegels((v) => v.map((r, idx) => (idx === i ? { ...r, [veld]: waarde } : r)))
  }

  function voegRegelsToe(nieuwe: Regel[]) {
    setRegels((v) => {
      // Lege regels aan het eind laten we vallen, zodat er niets tussen valt
      const bestaand = v.filter((r) => r.voornaam.trim())
      return [...bestaand, ...nieuwe, leeg()]
    })
  }

  function neemPlaktekstOver() {
    const gelezen = leesGeplakteLijst(plaktekst)
    if (gelezen.length === 0) {
      setUitslag({ tekst: "Hier kon ik geen namen uit halen.", fout: true })
      return
    }
    voegRegelsToe(
      gelezen.map((g) => ({ ...leeg(), voornaam: g.voornaam, achternaam: g.achternaam, email: g.email, telefoon: g.telefoon }))
    )
    setPlaktekst("")
    setPlakOpen(false)
    setUitslag({ tekst: `${gelezen.length} regels overgenomen. Kijk ze na en bewaar.` })
  }

  async function downloadSjabloon() {
    const XLSX = await laadXlsx()
    const voorbeeld = ["Sanne", "de Vries", "Familie de Vries", "sanne@voorbeeld.nl", "0612345678", "Daggast", "nee", ""]
    const ws = XLSX.utils.aoa_to_sheet([KOLOMMEN, voorbeeld])
    ws["!cols"] = KOLOMMEN.map((k) => ({ wch: Math.max(k.length + 4, 14) }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Gasten")
    XLSX.writeFile(wb, "gastenlijst-sjabloon.xlsx")
  }

  async function leesBestand(file: File) {
    setUitslag(null)
    try {
      const XLSX = await laadXlsx()
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rijen = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" })
      if (rijen.length === 0) {
        setUitslag({ tekst: "Dat bestand is leeg.", fout: true })
        return
      }

      const nieuwe: Regel[] = []
      for (const rij of rijen) {
        const r = leeg()
        for (const [kop, waarde] of Object.entries(rij)) {
          const soort = kolomSoort(kop)
          if (!soort) continue
          if (soort === "kind") r.kind = jaNee(waarde)
          else if (soort === "groep") {
            const g = String(waarde).trim().toLowerCase()
            r.groep = GROEPEN.find((x) => x.label.toLowerCase() === g || x.waarde === g)?.waarde ?? "daggast"
          } else r[soort] = String(waarde ?? "").trim()
        }
        if (r.voornaam) nieuwe.push(r)
      }

      if (nieuwe.length === 0) {
        setUitslag({ tekst: "Geen bruikbare namen gevonden. Gebruik het sjabloon als het niet lukt.", fout: true })
        return
      }
      voegRegelsToe(nieuwe)
      setUitslag({ tekst: `${nieuwe.length} regels uit het bestand gelezen. Kijk ze na en bewaar.` })
    } catch {
      setUitslag({ tekst: "Dit bestand kon ik niet lezen. Werkt het sjabloon wel?", fout: true })
    }
  }

  async function bewaar() {
    if (gevuld.length === 0 || !eventId) return
    setBezig(true)
    setUitslag(null)
    try {
      const res = await fetch("/api/gasten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          gasten: gevuld.map((r) => ({
            voornaam: r.voornaam,
            achternaam: r.achternaam,
            email: r.email,
            telefoon: r.telefoon,
            guest_type: r.groep,
            huishouden_naam: r.huishouden,
            is_kind: r.kind,
            leeftijd: r.leeftijd ? Number(r.leeftijd) : null,
          })),
        }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; toegevoegd?: number }
      if (!res.ok) throw new Error(j.error || "Toevoegen mislukte")
      setUitslag({
        tekst: `${j.toegevoegd ?? 0} ${j.toegevoegd === 1 ? "gast" : "gasten"} toegevoegd. Ververs de pagina om ze in de lijst te zien.`,
      })
      setRegels([leeg(), leeg(), leeg()])
    } catch (e) {
      setUitslag({ tekst: e instanceof Error ? e.message : "Toevoegen mislukte", fout: true })
    } finally {
      setBezig(false)
    }
  }

  const veld = "w-full rounded-lg border bg-white px-2 py-1.5 text-sm focus:outline-none"
  const veldStijl: React.CSSProperties = { borderColor: KLEUR.goudLicht, color: KLEUR.inkt }

  return (
    <div className="rounded-2xl" style={{ backgroundColor: KLEUR.ivoorKaart, border: `1px solid ${KLEUR.goudLicht}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5"
        style={{ cursor: "pointer" }}
      >
        <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: KLEUR.goud }}>
          Gasten toevoegen
        </span>
        <span className="text-sm font-semibold" style={{ color: KLEUR.tekst }}>{open ? "Sluiten" : "Openen"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4">
          {!bruikbaar && (
            <p
              className="rounded-xl px-4 py-3 text-sm leading-relaxed"
              style={{ backgroundColor: KLEUR.goudVlak, border: `1px solid ${KLEUR.goudLicht}`, color: KLEUR.tekst }}
            >
              Zo gaat je gastenlijst eruitzien. Bewaar eerst een ontwerp, dan weten we bij welke
              bruiloft je gasten horen. Kijken en het sjabloon downloaden kan nu al.
            </p>
          )}

          {bruikbaar && events.length > 1 && (
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold self-start"
              style={{ borderColor: KLEUR.goudLicht, color: KLEUR.inkt, cursor: "pointer" }}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          )}

          {/* ── De tabel ── */}
          <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${KLEUR.goudLicht}` }}>
            <table className="w-full text-sm" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ backgroundColor: KLEUR.goudVlak }}>
                  {["Voornaam", "Achternaam", "Huishouden", "E-mail", "Telefoon", "Gastengroep", "Kind", "Leeftijd"].map((k) => (
                    <th
                      key={k}
                      className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: KLEUR.inkt }}
                    >
                      {k}
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {regels.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${KLEUR.goudLicht}55` }}>
                    <td className="px-2 py-1.5">
                      <input className={veld} style={veldStijl} value={r.voornaam} onChange={(e) => zet(i, "voornaam", e.target.value)} placeholder="Sanne" maxLength={80} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input className={veld} style={veldStijl} value={r.achternaam} onChange={(e) => zet(i, "achternaam", e.target.value)} placeholder="de Vries" maxLength={80} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input className={veld} style={veldStijl} value={r.huishouden} onChange={(e) => zet(i, "huishouden", e.target.value)} placeholder="Familie de Vries" maxLength={160} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="email" className={veld} style={veldStijl} value={r.email} onChange={(e) => zet(i, "email", e.target.value)} placeholder="sanne@voorbeeld.nl" maxLength={160} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="tel" className={veld} style={veldStijl} value={r.telefoon} onChange={(e) => zet(i, "telefoon", e.target.value)} placeholder="06 12345678" maxLength={32} />
                    </td>
                    <td className="px-2 py-1.5">
                      <select className={veld} style={{ ...veldStijl, cursor: "pointer" }} value={r.groep} onChange={(e) => zet(i, "groep", e.target.value)}>
                        {GROEPEN.map((g) => (
                          <option key={g.waarde} value={g.waarde}>{g.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        aria-label="Is een kind"
                        checked={r.kind}
                        onChange={(e) => zet(i, "kind", e.target.checked)}
                        style={{ accentColor: KLEUR.goud, cursor: "pointer" }}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min={0}
                        max={MAX_KIND_LEEFTIJD}
                        className={veld}
                        style={{ ...veldStijl, opacity: r.kind ? 1 : 0.45 }}
                        value={r.leeftijd}
                        onChange={(e) => zet(i, "leeftijd", e.target.value)}
                        disabled={!r.kind}
                        placeholder={r.kind ? "7" : ""}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      {regels.length > 1 && (
                        <button
                          onClick={() => setRegels((v) => v.filter((_, idx) => idx !== i))}
                          aria-label="Regel weghalen"
                          className="text-sm font-bold"
                          style={{ color: KLEUR.zacht, cursor: "pointer" }}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setRegels((v) => [...v, leeg()])}
              className="text-sm font-semibold px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, cursor: "pointer" }}
            >
              Nog een regel
            </button>
            <button
              onClick={downloadSjabloon}
              className="text-sm font-semibold px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, cursor: "pointer" }}
            >
              Download Excel-sjabloon
            </button>
            <label
              className="text-sm font-semibold px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, cursor: "pointer" }}
            >
              Bestand inlezen
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void leesBestand(f)
                  e.target.value = ""
                }}
              />
            </label>
            <button
              onClick={() => setPlakOpen((v) => !v)}
              className="text-sm font-semibold underline"
              style={{ color: KLEUR.tekst, cursor: "pointer" }}
            >
              {plakOpen ? "Plakken sluiten" : "Of plak een lijst"}
            </button>
          </div>

          {plakOpen && (
            <div className="flex flex-col gap-2">
              <textarea
                rows={5}
                value={plaktekst}
                onChange={(e) => setPlaktekst(e.target.value)}
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm resize-y focus:outline-none"
                style={{ borderColor: KLEUR.goudLicht, color: KLEUR.inkt }}
                placeholder={"Eén per regel, bijvoorbeeld:\nSanne de Vries, sanne@voorbeeld.nl\nTom de Vries"}
              />
              <button
                onClick={neemPlaktekstOver}
                disabled={!plaktekst.trim()}
                className="text-sm font-semibold px-3 py-2 rounded-xl self-start disabled:opacity-60"
                style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, cursor: "pointer" }}
              >
                Zet in de tabel
              </button>
            </div>
          )}

          <p className="text-xs leading-relaxed" style={{ color: KLEUR.tekst }}>
            Alleen een voornaam is verplicht. Wat je hier toevoegt staat op &quot;niet verstuurd&quot;
            tot je de kaart deelt; reageert de gast daarna, dan verandert de stand vanzelf. Een
            mailadres heb je nodig om een herinnering te kunnen sturen. Vul bij een gezin dezelfde
            huishoudnaam in, dan horen die regels bij elkaar.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={bewaar}
              disabled={!bruikbaar || bezig || gevuld.length === 0}
              className="text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60"
              style={{ backgroundColor: KLEUR.inkt, color: KLEUR.ivoor, border: "none", cursor: "pointer" }}
            >
              {bezig ? "Toevoegen..." : gevuld.length > 0 ? `Voeg ${gevuld.length} toe` : "Voeg toe"}
            </button>
            {uitslag && (
              <span
                className="text-sm font-semibold"
                style={{ color: uitslag.fout ? KLEUR.roodTekst : KLEUR.inkt }}
              >
                {uitslag.tekst}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
