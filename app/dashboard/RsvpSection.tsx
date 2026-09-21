"use client"

import { useState } from "react"
import { laadXlsx } from "@/lib/xlsx-laden"
import { gastSleutel, komtGast, reis, REIS_LABEL, type Reis } from "@/lib/gasten"
import GastenToevoegen from "./GastenToevoegen"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"
const SOFT       = "#9A8E82"

export interface RsvpRow {
  id: string
  event_id: string
  submission_id: string | null
  name: string
  voornaam: string | null
  achternaam: string | null
  email: string | null
  guest_type: string
  dietary: string | null
  allergie: string | null
  telefoon: string | null
  is_kind: boolean | null
  leeftijd: number | null
  /** uitgenodigd, voorlopig of definitief. Zie lib/gasten.ts. */
  status: string | null
  /** Hoe ver de Save the Date en de uitnodiging staan. Zie Reis in lib/gasten.ts. */
  std_status: string | null
  inv_status: string | null
  /** Op welke kaartlink dit binnenkwam. */
  bron_token: string | null
  /** Welke kaart het bruidspaar zegt gestuurd te hebben (bij "verstuurd zetten").
   *  Optioneel: bestaat pas na migration_gekregen.sql. */
  std_kaart_id?: string | null
  inv_kaart_id?: string | null
  huishouden_naam: string | null
  is_primary: boolean
  attending: string | null
  message: string | null
  song: string | null
  overnachting: boolean | null
  custom_answer: boolean | null
  custom_answer_2: boolean | null
  created_at: string
}

interface EventRef { id: string; title: string }

/** Een kaart van deze bruiloft, om te kunnen zeggen welke een gast kreeg. */
export interface KaartRef { id: string; type: string; naam: string; share_token: string }

interface EditForm {
  name: string
  email: string
  attending: string
  guest_type: string
  dietary: string
  message: string
  song: string
  overnachting: boolean | null
  custom_answer: boolean | null
  custom_answer_2: boolean | null
}

function rowToForm(row: RsvpRow): EditForm {
  return {
    name: row.name,
    email: row.email ?? "",
    attending: row.attending ?? "yes",
    guest_type: row.guest_type,
    dietary: row.dietary ?? "",
    message: row.message ?? "",
    song: row.song ?? "",
    overnachting: row.overnachting,
    custom_answer: row.custom_answer,
    custom_answer_2: row.custom_answer_2,
  }
}

const inputCls = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none transition-all"
const inputStyle: React.CSSProperties = { color: CHARCOAL, borderColor: GOLD_LIGHT }

export default function RsvpSection({
  rsvps: initialRsvps,
  events,
  kaarten = [],
}: {
  rsvps: RsvpRow[]
  events: EventRef[]
  kaarten?: KaartRef[]
}) {
  const [rsvps, setRsvps] = useState<RsvpRow[]>(initialRsvps)
  // Welke kaart je hebt gestuurd, als er van een soort meer dan één is
  // (daggasten, avondgasten, een andere taal). Standaard de eerste.
  const stdKaarten = kaarten.filter((k) => k.type === "save_the_date")
  const invKaarten = kaarten.filter((k) => k.type === "trouwkaart")
  const [stdKaart, setStdKaart] = useState<string>(stdKaarten[0]?.id ?? "")
  const [invKaart, setInvKaart] = useState<string>(invKaarten[0]?.id ?? "")

  /** Welke kaart een gast kreeg: wat het bruidspaar aangaf, anders de link
   *  waarop de gast antwoordde. */
  function gekregen(row: RsvpRow, product: "std" | "inv"): string | null {
    const id = product === "std" ? row.std_kaart_id : row.inv_kaart_id
    const viaId = id ? kaarten.find((k) => k.id === id) : null
    if (viaId) return viaId.naam
    const viaLink = row.bron_token ? kaarten.find((k) => k.share_token === row.bron_token) : null
    if (viaLink && (product === "std" ? viaLink.type === "save_the_date" : viaLink.type === "trouwkaart")) return viaLink.naam
    return null
  }
  const [editingRow, setEditingRow] = useState<RsvpRow | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  // Aangevinkte regels. Nodig om in één keer een herinnering te sturen, en om
  // meerdere regels tegelijk op te ruimen.
  const [gekozen, setGekozen] = useState<Set<string>>(new Set())
  const [berichtSoort, setBerichtSoort] = useState<"herinnering" | "wijziging" | null>(null)
  const [berichtTekst, setBerichtTekst] = useState("")
  const [berichtBezig, setBerichtBezig] = useState(false)
  const [berichtUitslag, setBerichtUitslag] = useState<string | null>(null)


  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.title]))

  // Bruiloften waar al aanmeldingen voor zijn: alleen daarvoor is een
  // cateraarsoverzicht zinvol. Bijna altijd precies een.
  const eventsMetGasten = events.filter((e) => rsvps.some((r) => r.event_id === e.id))

  const attending      = rsvps.filter((r) => r.attending !== "no")
  const declined       = rsvps.filter((r) => r.attending === "no")
  const daggasten      = attending.filter((r) => r.guest_type === "daggast").length
  const avondgasten    = attending.filter((r) => r.guest_type === "avondgast").length
  const receptiegasten = attending.filter((r) => r.guest_type === "receptiegast").length

  const hasReceptiegasten = attending.some((r) => r.guest_type === "receptiegast")
  const hasSong           = rsvps.some((r) => r.song)
  const hasOvernachting   = rsvps.some((r) => r.overnachting !== null)
  const hasCustomAnswer   = rsvps.some((r) => r.custom_answer !== null)
  const hasCustomAnswer2  = rsvps.some((r) => r.custom_answer_2 !== null)

  const submissionGroups = rsvps.reduce<Record<string, RsvpRow[]>>((acc, row) => {
    const key = row.submission_id ?? row.id
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  const sortedGroups = Object.values(submissionGroups).sort((a, b) => {
    const aTime = Math.min(...a.map((r) => new Date(r.created_at).getTime()))
    const bTime = Math.min(...b.map((r) => new Date(r.created_at).getTime()))
    return bTime - aTime
  })

  // Alle zichtbare regels, voor het vinkje in de kop
  const alleIds = sortedGroups.flat().map((r) => r.id)

  // Wie nog geen antwoord heeft gegeven, op geen van beide producten. Dat is
  // letterlijk de lijst "wie moet ik nog najagen", en met één druk te pakken:
  // in de praktijk is dat waar je de herinnering naartoe stuurt.
  const stilleIds = sortedGroups
    .flat()
    .filter((r) => komtGast(reis(r.std_status), reis(r.inv_status)) === null)
    .map((r) => r.id)

  // Namen die twee keer voorkomen binnen dezelfde bruiloft. Eén gedeelde
  // kaartlink gaat naar tachtig mensen, dus dubbele invoer komt voor. Wij
  // voegen niet automatisch samen; we wijzen het alleen aan, want alleen het
  // bruidspaar weet of het dezelfde persoon is.
  const dubbel = new Set<string>()
  {
    const gezien = new Map<string, string>()
    for (const r of rsvps) {
      const sleutel = `${r.event_id}:${gastSleutel(r.voornaam ?? r.name, r.achternaam)}`
      const eerder = gezien.get(sleutel)
      if (eerder) {
        dubbel.add(eerder)
        dubbel.add(r.id)
      } else {
        gezien.set(sleutel, r.id)
      }
    }
  }

  function openEdit(row: RsvpRow) {
    setEditingRow(row)
    setEditForm(rowToForm(row))
    setSaveError(null)
  }

  async function handleSave() {
    if (!editingRow || !editForm) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/rsvp/${editingRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      setRsvps((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? { ...r, name: editForm.name, email: editForm.email || null, attending: editForm.attending, guest_type: editForm.guest_type, dietary: editForm.dietary || null, message: editForm.message || null, song: editForm.song || null, overnachting: editForm.overnachting, custom_answer: editForm.custom_answer, custom_answer_2: editForm.custom_answer_2 }
            : r
        )
      )
      setEditingRow(null)
      setEditForm(null)
    } catch {
      setSaveError("Opslaan mislukt — probeer opnieuw.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/rsvp/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setRsvps((prev) => prev.filter((r) => r.id !== id))
      setDeleteConfirmId(null)
    } catch {
      // silently leave row
    } finally {
      setDeletingId(null)
    }
  }

  function wissel(id: string) {
    setGekozen((v) => {
      const n = new Set(v)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function kiesAlle(ids: string[], aan: boolean) {
    setGekozen((v) => {
      const n = new Set(v)
      for (const id of ids) {
        if (aan) n.add(id)
        else n.delete(id)
      }
      return n
    })
  }

  // Verstuurd-zetten doet het bruidspaar zelf, want delen gaat via WhatsApp en
  // dat kunnen wij niet zien. Meestal voor tientallen mensen tegelijk.
  async function zetReis(product: "std" | "inv", waarde: Reis) {
    setBerichtBezig(true)
    setBerichtUitslag(null)
    // Bij "verstuurd" onthouden we ook welke kaart je stuurde, zodat de lijst
    // kan zeggen wie de avondgastenkaart kreeg en wie de Engelse.
    const kaartId = waarde === "verstuurd" ? (product === "std" ? stdKaart : invKaart) || null : null
    try {
      const res = await fetch("/api/gasten", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...gekozen], product, waarde, kaart_id: kaartId }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; bijgewerkt?: number }
      if (!res.ok) throw new Error(j.error || "Bijwerken mislukte")
      const kolom = product === "inv" ? "inv_status" : "std_status"
      const kaartKolom = product === "inv" ? "inv_kaart_id" : "std_kaart_id"
      setRsvps((vorig) =>
        vorig.map((r) =>
          gekozen.has(r.id)
            ? {
                ...r,
                [kolom]: waarde,
                ...(kaartId ? { [kaartKolom]: kaartId } : {}),
                ...(waarde === "ja" || waarde === "nee" ? { attending: waarde === "ja" ? "yes" : "no" } : {}),
              }
            : r
        )
      )
      setBerichtUitslag(`${j.bijgewerkt ?? 0} bijgewerkt.`)
    } catch (e) {
      setBerichtUitslag(e instanceof Error ? e.message : "Bijwerken mislukte")
    } finally {
      setBerichtBezig(false)
    }
  }

  async function verwijderGekozen() {
    const ids = [...gekozen]
    for (const id of ids) {
      try {
        const res = await fetch(`/api/rsvp/${id}`, { method: "DELETE" })
        if (res.ok) setRsvps((prev) => prev.filter((r) => r.id !== id))
      } catch {}
    }
    setGekozen(new Set())
  }

  // Het bruidspaar schrijft zelf, wij versturen alleen wat het aanvinkt.
  async function stuurBericht() {
    if (!berichtSoort) return
    setBerichtBezig(true)
    setBerichtUitslag(null)
    try {
      const res = await fetch("/api/gasten/bericht", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...gekozen], soort: berichtSoort, bericht: berichtTekst }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; verstuurd?: number; zonderMail?: string[] }
      if (!res.ok) throw new Error(j.error || "Versturen mislukte")
      const zonder = j.zonderMail ?? []
      setBerichtUitslag(
        `${j.verstuurd ?? 0} bericht${(j.verstuurd ?? 0) === 1 ? "" : "en"} verstuurd.` +
          (zonder.length > 0
            ? ` Geen mailadres van: ${zonder.join(", ")}. Die kun je zelf een appje sturen.`
            : "")
      )
      setBerichtTekst("")
    } catch (e) {
      setBerichtUitslag(e instanceof Error ? e.message : "Versturen mislukte")
    } finally {
      setBerichtBezig(false)
    }
  }

  function buildExportRows() {
    const headers = [
      "Naam", "E-mail", "Status", "Type", "Dieetwensen",
      ...(hasSong ? ["Song Request"] : []),
      ...(hasOvernachting ? ["Overnachting"] : []),
      ...(hasCustomAnswer ? ["Extra vraag 1"] : []),
      ...(hasCustomAnswer2 ? ["Extra vraag 2"] : []),
      "Berichtje", "Event", "Datum",
    ]
    const rows = rsvps.map((r) => [
      r.name, r.email ?? "",
      // De reis is de waarheid, niet de oude attending-kolom: zonder antwoord
      // is het geen aanwezig.
      (() => {
        const k = komtGast(reis(r.std_status), reis(r.inv_status))
        return k === true ? "Aanwezig" : k === false ? "Afwezig" : "Nog niets gehoord"
      })(),
      r.guest_type, r.dietary ?? "",
      ...(hasSong ? [r.song ?? ""] : []),
      ...(hasOvernachting ? [r.overnachting === true ? "Ja" : r.overnachting === false ? "Nee" : ""] : []),
      ...(hasCustomAnswer ? [r.custom_answer === true ? "Ja" : r.custom_answer === false ? "Nee" : ""] : []),
      ...(hasCustomAnswer2 ? [r.custom_answer_2 === true ? "Ja" : r.custom_answer_2 === false ? "Nee" : ""] : []),
      r.message ?? "",
      eventMap[r.event_id] ?? r.event_id,
      new Date(r.created_at).toLocaleDateString("nl-NL"),
    ])
    return { headers, rows }
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function exportCsv() {
    const { headers, rows } = buildExportRows()
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    download(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), "gasten.csv")
  }

  async function exportExcel() {
    const { headers, rows } = buildExportRows()
    const XLSX = await laadXlsx()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1")
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })]
      if (cell) cell.s = { font: { bold: true } }
    }
    ws["!cols"] = headers.map((h, i) => ({
      wch: Math.min(Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)) + 2, 50),
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Gasten")
    XLSX.writeFile(wb, "gasten.xlsx")
  }

  // Staat in beide toestanden, ook als de lijst nog leeg is: een gastenlijst
  // begint bij wie je uitnodigt, niet bij wie zich meldt.
  if (rsvps.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <GastenToevoegen events={events} bruikbaar={events.length > 0} />
        <div
        className="rounded-2xl p-10 text-center"
        style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
        >
          <svg className="w-5 h-5" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <p className="text-sm" style={{ color: BODY }}>
          Nog geen gasten. Zet ze hierboven zelf in de lijst, of laat ze zichzelf invullen: wie
          jullie kaart opent kan daar meteen laten weten of hij erbij is.
        </p>
      </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* KPI cards */}
        <div className={`grid gap-4 ${hasReceptiegasten ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
          <KpiCard label="Aanwezig"      value={attending.length}      accent="#10b981" />
          <KpiCard label="Afgemeld"      value={declined.length}       accent="#ef4444" />
          <KpiCard label="Daggasten"     value={daggasten}             accent={GOLD}    />
          <KpiCard label="Avondgasten"   value={avondgasten}           accent={CHARCOAL} />
          {hasReceptiegasten && <KpiCard label="Receptiegasten" value={receptiegasten} accent="#0d9488" />}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: GOLD }}>
            Gastenlijst
          </span>
          <div className="flex flex-wrap items-center gap-4">
            {/* Het lijstje dat elke locatie vraagt: aantallen, dieetwensen en
                wie er blijft slapen, op een pagina die je kunt printen. */}
            {eventsMetGasten.map((e) => (
              <a
                key={e.id}
                href={`/print/gasten/${e.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: CHARCOAL, textDecoration: "none" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Voor de cateraar{eventsMetGasten.length > 1 ? `: ${e.title}` : ""}
              </a>
            ))}
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: BODY }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: GOLD }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Excel (.xlsx)
            </button>
          </div>
        </div>

        <GastenToevoegen events={events} bruikbaar={events.length > 0} />

        {/* ── Wat je met de aangevinkte regels kunt ──
            Verschijnt alleen als er iets gekozen is, zodat de lijst rustig
            blijft zolang je alleen kijkt. */}
        {gekozen.size > 0 && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: GOLD_BG, border: `1px solid ${GOLD_LIGHT}` }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                {gekozen.size} {gekozen.size === 1 ? "gast" : "gasten"} geselecteerd
              </span>
              <button
                onClick={() => { setBerichtSoort("herinnering"); setBerichtTekst("We zijn benieuwd of je erbij bent. Laat je het ons even weten?"); setBerichtUitslag(null) }}
                className="text-sm font-semibold px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
              >
                Stuur een herinnering
              </button>
              <button
                onClick={() => { setBerichtSoort("wijziging"); setBerichtTekst("Er is iets veranderd aan onze trouwdag. Kijk je even?"); setBerichtUitslag(null) }}
                className="text-sm font-semibold px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
              >
                Laat weten dat er iets is veranderd
              </button>
              <button
                onClick={() => zetReis("std", "verstuurd")}
                disabled={berichtBezig}
                className="text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-60"
                style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                title="Zet de Save the Date op verstuurd voor de aangevinkte gasten"
              >
                Save the Date verstuurd
              </button>
              {/* Meer dan één Save the Date (daggasten, avondgasten, een andere
                  taal)? Dan zeg je welke je stuurde; de lijst onthoudt het. */}
              {stdKaarten.length > 1 && (
                <select
                  value={stdKaart}
                  onChange={(e) => setStdKaart(e.target.value)}
                  aria-label="Welke Save the Date heb je gestuurd"
                  className="text-sm px-2 py-2 rounded-xl"
                  style={{ border: `1px solid ${GOLD_LIGHT}`, color: CHARCOAL, backgroundColor: "#fff" }}
                >
                  {stdKaarten.map((k) => <option key={k.id} value={k.id}>{k.naam}</option>)}
                </select>
              )}
              <button
                onClick={() => zetReis("inv", "verstuurd")}
                disabled={berichtBezig}
                className="text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-60"
                style={{ backgroundColor: "#fff", color: CHARCOAL, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
                title="Zet de uitnodiging op verstuurd voor de aangevinkte gasten"
              >
                Uitnodiging verstuurd
              </button>
              {invKaarten.length > 1 && (
                <select
                  value={invKaart}
                  onChange={(e) => setInvKaart(e.target.value)}
                  aria-label="Welke trouwkaart heb je gestuurd"
                  className="text-sm px-2 py-2 rounded-xl"
                  style={{ border: `1px solid ${GOLD_LIGHT}`, color: CHARCOAL, backgroundColor: "#fff" }}
                >
                  {invKaarten.map((k) => <option key={k.id} value={k.id}>{k.naam}</option>)}
                </select>
              )}
              <button
                onClick={verwijderGekozen}
                className="text-sm font-semibold px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#fff", color: "#DC2626", border: "1px solid #fca5a5", cursor: "pointer" }}
              >
                Verwijderen
              </button>
              <button
                onClick={() => { setGekozen(new Set()); setBerichtSoort(null); setBerichtUitslag(null) }}
                className="text-sm font-semibold underline ml-auto"
                style={{ color: BODY, cursor: "pointer" }}
              >
                Selectie wissen
              </button>
            </div>

            {berichtSoort && (
              <div className="flex flex-col gap-2">
                <textarea
                  rows={3}
                  value={berichtTekst}
                  onChange={(e) => setBerichtTekst(e.target.value)}
                  maxLength={1000}
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{ borderColor: GOLD_LIGHT, color: CHARCOAL }}
                  placeholder="Wat wil je ze laten weten?"
                />
                <p className="text-xs" style={{ color: BODY }}>
                  {berichtSoort === "herinnering"
                    ? "In de mail staat de link die ze eerder kregen, zodat ze alsnog kunnen reageren."
                    : "In de mail staat erbij dat hun aanmelding gewoon blijft staan en dat ze niets opnieuw hoeven in te vullen."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={stuurBericht}
                    disabled={berichtBezig || !berichtTekst.trim()}
                    className="text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60"
                    style={{ backgroundColor: CHARCOAL, color: IVORY_CARD, border: "none", cursor: "pointer" }}
                  >
                    {berichtBezig ? "Versturen..." : `Versturen naar ${gekozen.size}`}
                  </button>
                  <button
                    onClick={() => setBerichtSoort(null)}
                    className="text-sm font-semibold underline"
                    style={{ color: BODY, cursor: "pointer" }}
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}

            {berichtUitslag && (
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{berichtUitslag}</p>
            )}
          </div>
        )}

        {/* ── Snel selecteren ──
            De herinnering gaat bijna altijd naar dezelfde groep: iedereen die
            nog niets heeft laten weten. Dat hoort één druk te zijn en niet
            veertig vinkjes. */}
        {alleIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: SOFT }}>
              Selecteer
            </span>
            <button
              onClick={() => { setGekozen(new Set(stilleIds)); setBerichtUitslag(null) }}
              disabled={stilleIds.length === 0}
              className="text-sm font-semibold px-3 py-1.5 rounded-xl"
              style={{
                backgroundColor: stilleIds.length ? GOLD_BG : "transparent",
                color: stilleIds.length ? CHARCOAL : SOFT,
                border: `1px solid ${GOLD_LIGHT}`,
                cursor: stilleIds.length ? "pointer" : "default",
              }}
            >
              Wie nog niet reageerde ({stilleIds.length})
            </button>
            <button
              onClick={() => { setGekozen(new Set(alleIds)); setBerichtUitslag(null) }}
              className="text-sm font-semibold px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: "transparent", color: BODY, border: `1px solid ${GOLD_LIGHT}`, cursor: "pointer" }}
            >
              Iedereen ({alleIds.length})
            </button>
            {gekozen.size > 0 && (
              <button
                onClick={() => { setGekozen(new Set()); setBerichtSoort(null); setBerichtUitslag(null) }}
                className="text-sm underline"
                style={{ color: SOFT, cursor: "pointer" }}
              >
                Selectie wissen
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-2xl overflow-x-auto"
          style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: IVORY_CARD }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                <Th className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Alles selecteren"
                    checked={alleIds.length > 0 && alleIds.every((id) => gekozen.has(id))}
                    onChange={(e) => kiesAlle(alleIds, e.target.checked)}
                    style={{ accentColor: GOLD, cursor: "pointer" }}
                  />
                </Th>
                <Th>Naam</Th>
                <Th>Save the Date</Th>
                <Th>Uitnodiging</Th>
                <Th className="hidden sm:table-cell">Type</Th>
                <Th className="hidden md:table-cell">E-mail</Th>
                <Th className="hidden lg:table-cell">Dieetwensen</Th>
                {hasSong       && <Th className="hidden xl:table-cell">Song</Th>}
                {hasOvernachting && <Th className="hidden xl:table-cell">Overnachting</Th>}
                {hasCustomAnswer && <Th className="hidden xl:table-cell">Extra vraag 1</Th>}
                {hasCustomAnswer2 && <Th className="hidden xl:table-cell">Extra vraag 2</Th>}
                <Th className="hidden lg:table-cell">Berichtje</Th>
                <Th className="hidden lg:table-cell">Aangemeld</Th>
                <Th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {sortedGroups.flatMap((group, gi) => {
                const rows = group.map((row) => {
                  const isDeclined   = row.attending === "no"
                  const isDeleting   = deletingId === row.id
                  const confirmingDel = deleteConfirmId === row.id
                  return (
                    <tr
                      key={row.id}
                      className={isDeleting ? "opacity-40" : ""}
                      style={{
                        borderBottom: `1px solid ${GOLD_LIGHT}20`,
                        backgroundColor: gi % 2 === 0 ? IVORY_CARD : "#F0E8D8",
                      }}
                    >
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          aria-label={`${row.name} selecteren`}
                          checked={gekozen.has(row.id)}
                          onChange={() => wissel(row.id)}
                          style={{ accentColor: GOLD, cursor: "pointer" }}
                        />
                      </td>
                      <td className="px-5 py-3 font-medium" style={{ color: CHARCOAL }}>
                        {row.name}
                        {row.is_kind && (
                          <span className="ml-2 text-xs" style={{ color: BODY }}>
                            ({row.leeftijd != null ? `${row.leeftijd} jaar` : "kind"})
                          </span>
                        )}
                        {dubbel.has(row.id) && (
                          <span
                            className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
                            title="Deze naam staat er twee keer in. Kijk even of het dezelfde persoon is."
                          >
                            dubbel?
                          </span>
                        )}
                        {row.is_primary && (
                          <span
                            className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_LIGHT}` }}
                          >
                            hoofd
                          </span>
                        )}
                      </td>
                      {/* Onder de stand: welke kaart deze gast kreeg, als we
                          dat weten. Uit wat je zelf aangaf bij verstuurd
                          zetten, of uit de link waarop hij antwoordde. */}
                      <td className="px-5 py-3">
                        <ReisBadge waarde={reis(row.std_status)} />
                        {gekregen(row, "std") && (
                          <span className="block text-[11px] mt-1" style={{ color: SOFT }}>{gekregen(row, "std")}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <ReisBadge waarde={reis(row.inv_status)} />
                        {gekregen(row, "inv") && (
                          <span className="block text-[11px] mt-1" style={{ color: SOFT }}>{gekregen(row, "inv")}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        {isDeclined ? <span style={{ color: GOLD_LIGHT }}>—</span> : <GuestTypeBadge type={row.guest_type} />}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-sm" style={{ color: BODY }}>
                        {row.email ?? <span style={{ color: GOLD_LIGHT }}>—</span>}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-sm" style={{ color: BODY }}>
                        {row.dietary || <span style={{ color: GOLD_LIGHT }}>—</span>}
                      </td>
                      {hasSong && (
                        <td className="px-5 py-3 hidden xl:table-cell text-sm" style={{ color: BODY }}>
                          {row.song || <span style={{ color: GOLD_LIGHT }}>—</span>}
                        </td>
                      )}
                      {hasOvernachting && (
                        <td className="px-5 py-3 hidden xl:table-cell"><BoolBadge value={row.overnachting} /></td>
                      )}
                      {hasCustomAnswer && (
                        <td className="px-5 py-3 hidden xl:table-cell"><BoolBadge value={row.custom_answer} /></td>
                      )}
                      {hasCustomAnswer2 && (
                        <td className="px-5 py-3 hidden xl:table-cell"><BoolBadge value={row.custom_answer_2} /></td>
                      )}
                      <td className="px-5 py-3 hidden lg:table-cell text-xs italic" style={{ color: BODY }}>
                        {isDeclined && row.message ? `"${row.message}"` : <span style={{ color: GOLD_LIGHT }}>—</span>}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-xs" style={{ color: BODY }}>
                        {new Date(row.created_at).toLocaleDateString("nl-NL")}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {confirmingDel ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => handleDelete(row.id)} className="text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Ja</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors" style={{ color: BODY }}>Nee</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEdit(row)}
                              title="Bewerken"
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: GOLD_LIGHT }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = GOLD_LIGHT)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(row.id)}
                              title="Verwijderen"
                              className="p-1.5 rounded-lg transition-colors text-red-300 hover:text-red-500"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
                const sep = gi < sortedGroups.length - 1 ? (
                  <tr key={`sep-${gi}`}><td colSpan={99} className="h-px p-0" style={{ backgroundColor: GOLD_LIGHT }} /></tr>
                ) : null
                return sep ? [...rows, sep] : rows
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit modal ── */}
      {editingRow && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(14,12,9,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!saving) { setEditingRow(null); setEditForm(null) } }}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            style={{ backgroundColor: IVORY, border: `1px solid ${GOLD_LIGHT}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${GOLD_LIGHT}` }}>
              <h3
                className="text-xl"
                style={{ fontFamily: "var(--font-cormorant)", fontWeight: 700, color: CHARCOAL }}
              >
                Gast bewerken
              </h3>
              <button
                onClick={() => { setEditingRow(null); setEditForm(null) }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: BODY }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-7 py-6 flex flex-col gap-5">

              <Field label="Naam">
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} style={inputStyle} />
              </Field>

              <Field label="E-mailadres">
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="(leeg)" className={inputCls} style={inputStyle} />
              </Field>

              <Field label="Status">
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((val) => (
                    <button
                      key={val} type="button"
                      onClick={() => setEditForm({ ...editForm, attending: val })}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        border: `2px solid ${editForm.attending === val ? (val === "yes" ? "#10b981" : "#ef4444") : GOLD_LIGHT}`,
                        backgroundColor: editForm.attending === val ? (val === "yes" ? "#ecfdf5" : "#fef2f2") : "white",
                        color: editForm.attending === val ? (val === "yes" ? "#065f46" : "#991b1b") : BODY,
                      }}
                    >
                      {val === "yes" ? "Aanwezig" : "Afwezig"}
                    </button>
                  ))}
                </div>
              </Field>

              {editForm.attending !== "no" && (
                <Field label="Type gast">
                  <div className="flex gap-2">
                    {["daggast", "avondgast", "receptiegast"].map((t) => (
                      <button
                        key={t} type="button"
                        onClick={() => setEditForm({ ...editForm, guest_type: t })}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          border: `2px solid ${editForm.guest_type === t ? GOLD : GOLD_LIGHT}`,
                          backgroundColor: editForm.guest_type === t ? GOLD_BG : "white",
                          color: editForm.guest_type === t ? CHARCOAL : BODY,
                        }}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {editForm.attending !== "no" && (
                <Field label="Dieetwensen / Allergieën">
                  <input type="text" value={editForm.dietary} onChange={(e) => setEditForm({ ...editForm, dietary: e.target.value })} placeholder="—" className={inputCls} style={inputStyle} />
                </Field>
              )}

              {hasSong && editForm.attending !== "no" && (
                <Field label="Song request">
                  <input type="text" value={editForm.song} onChange={(e) => setEditForm({ ...editForm, song: e.target.value })} placeholder="—" className={inputCls} style={inputStyle} />
                </Field>
              )}

              {hasOvernachting && editForm.attending !== "no" && (
                <Field label="Overnachting">
                  <TriStateButtons value={editForm.overnachting} onChange={(v) => setEditForm({ ...editForm, overnachting: v })} />
                </Field>
              )}

              {hasCustomAnswer && editForm.attending !== "no" && (
                <Field label="Extra vraag 1">
                  <TriStateButtons value={editForm.custom_answer} onChange={(v) => setEditForm({ ...editForm, custom_answer: v })} />
                </Field>
              )}

              {hasCustomAnswer2 && editForm.attending !== "no" && (
                <Field label="Extra vraag 2">
                  <TriStateButtons value={editForm.custom_answer_2} onChange={(v) => setEditForm({ ...editForm, custom_answer_2: v })} />
                </Field>
              )}

              {editForm.attending === "no" && (
                <Field label="Berichtje">
                  <textarea rows={3} value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} placeholder="—" className={`${inputCls} resize-none`} style={inputStyle} />
                </Field>
              )}

              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>

            <div className="px-7 py-5 flex gap-3" style={{ borderTop: `1px solid ${GOLD_LIGHT}` }}>
              <button
                onClick={() => { setEditingRow(null); setEditForm(null) }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{ border: `1px solid ${GOLD_LIGHT}`, color: BODY, backgroundColor: "white" }}
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 hover:-translate-y-0.5"
                style={{ backgroundColor: CHARCOAL, color: IVORY }}
              >
                {saving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Sub-components ───────────────────────────────────────────────── */

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`text-left px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] ${className ?? ""}`}
      style={{ color: GOLD }}
    >
      {children}
    </th>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>{label}</span>
      {children}
    </label>
  )
}

function TriStateButtons({ value, onChange }: { value: boolean | null; onChange: (v: boolean | null) => void }) {
  return (
    <div className="flex gap-2">
      {([true, false, null] as const).map((v) => (
        <button
          key={String(v)} type="button"
          onClick={() => onChange(v)}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            border: `2px solid ${value === v ? (v === true ? "#10b981" : v === false ? "#ef4444" : GOLD_LIGHT) : GOLD_LIGHT}`,
            backgroundColor: value === v ? (v === true ? "#ecfdf5" : v === false ? "#fef2f2" : GOLD_BG) : "white",
            color: value === v ? (v === true ? "#065f46" : v === false ? "#991b1b" : BODY) : BODY,
          }}
        >
          {v === true ? "Ja" : v === false ? "Nee" : "—"}
        </button>
      ))}
    </div>
  )
}

/**
 * Hoe ver een product staat bij deze gast. Vier standen: niet verstuurd,
 * verstuurd, komt, komt niet. Zie Reis in lib/gasten.ts.
 */
function ReisBadge({ waarde }: { waarde: Reis }) {
  const stijl = {
    niet_verstuurd: { bg: "#F3F4F6", tekst: "#6B7280" },
    verstuurd:      { bg: "#FEF3C7", tekst: "#92400E" },
    ja:             { bg: "#D1FAE5", tekst: "#065F46" },
    nee:            { bg: "#FEE2E2", tekst: "#991B1B" },
  }[waarde]
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: stijl.bg, color: stijl.tekst }}
    >
      {REIS_LABEL[waarde]}
    </span>
  )
}

function GuestTypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    daggast:      { bg: "#eff6ff", color: "#1d4ed8" },
    avondgast:    { bg: "#f5f3ff", color: "#6d28d9" },
    receptiegast: { bg: GOLD_BG,   color: GOLD       },
  }
  const s = map[type] ?? { bg: GOLD_BG, color: BODY }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
      {type}
    </span>
  )
}

function BoolBadge({ value }: { value: boolean | null }) {
  if (value === null) return <span style={{ color: GOLD_LIGHT }}>—</span>
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${value ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
      {value ? "Ja" : "Nee"}
    </span>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="rounded-2xl p-5 text-center"
      style={{ backgroundColor: IVORY_CARD, border: `1px solid ${GOLD_LIGHT}` }}
    >
      <p className="text-3xl font-extrabold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: accent }}>
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: BODY }}>{label}</p>
    </div>
  )
}
