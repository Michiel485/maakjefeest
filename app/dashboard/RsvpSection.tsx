"use client"

import { useState } from "react"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const IVORY_CARD = "#F5EFE4"
const BODY       = "#5C5248"

export interface RsvpRow {
  id: string
  event_id: string
  submission_id: string | null
  name: string
  email: string | null
  guest_type: string
  dietary: string | null
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
}: {
  rsvps: RsvpRow[]
  events: EventRef[]
}) {
  const [rsvps, setRsvps] = useState<RsvpRow[]>(initialRsvps)
  const [editingRow, setEditingRow] = useState<RsvpRow | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.title]))

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
      r.attending === "no" ? "Afwezig" : "Aanwezig",
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
    const XLSX = (await import("xlsx")).default
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

  if (rsvps.length === 0) {
    return (
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
          Aanmeldingen van jullie gasten verschijnen hier zodra de bruiloftswebsite live is.
        </p>
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
          <div className="flex items-center gap-4">
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

        {/* Table */}
        <div
          className="rounded-2xl overflow-x-auto"
          style={{ border: `1px solid ${GOLD_LIGHT}`, backgroundColor: IVORY_CARD }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                <Th>Naam</Th>
                <Th>Status</Th>
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
                      <td className="px-5 py-3 font-medium" style={{ color: CHARCOAL }}>
                        {row.name}
                        {row.is_primary && (
                          <span
                            className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_LIGHT}` }}
                          >
                            hoofd
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDeclined ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                          {isDeclined ? "Afwezig" : "Aanwezig"}
                        </span>
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
