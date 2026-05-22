"use client"

import { useState } from "react"

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

interface EventRef {
  id: string
  title: string
}

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
            ? {
                ...r,
                name: editForm.name,
                email: editForm.email || null,
                attending: editForm.attending,
                guest_type: editForm.guest_type,
                dietary: editForm.dietary || null,
                message: editForm.message || null,
                song: editForm.song || null,
                overnachting: editForm.overnachting,
                custom_answer: editForm.custom_answer,
                custom_answer_2: editForm.custom_answer_2,
              }
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
      // silently fail — leave row in UI
    } finally {
      setDeletingId(null)
    }
  }

  function buildExportRows() {
    const headers = [
      "Naam", "E-mail", "Status", "Type",
      "Dieetwensen",
      ...(hasSong ? ["Song Request"] : []),
      ...(hasOvernachting ? ["Overnachting"] : []),
      ...(hasCustomAnswer ? ["Extra vraag 1"] : []),
      ...(hasCustomAnswer2 ? ["Extra vraag 2"] : []),
      "Berichtje", "Event", "Datum",
    ]
    const rows = rsvps.map((r) => [
      r.name,
      r.email ?? "",
      r.attending === "no" ? "Afwezig" : "Aanwezig",
      r.guest_type,
      r.dietary ?? "",
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

  function exportCsv() {
    const { headers, rows } = buildExportRows()
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    download(blob, "gasten.csv")
  }

  async function exportExcel() {
    const { headers, rows } = buildExportRows()
    const XLSX = (await import("xlsx")).default
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // Bold header row
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1")
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })]
      if (cell) cell.s = { font: { bold: true } }
    }

    // Auto column widths
    ws["!cols"] = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map((r) => String(r[i] ?? "").length)
      )
      return { wch: Math.min(Math.max(maxLen + 2, 10), 50) }
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Gasten")
    XLSX.writeFile(wb, "gasten.xlsx")
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (rsvps.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">
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
          <KpiCard label="Aanwezig" value={attending.length} color="emerald" />
          <KpiCard label="Afgemeld" value={declined.length} color="rose" />
          <KpiCard label="Daggasten" value={daggasten} color="blue" />
          <KpiCard label="Avondgasten" value={avondgasten} color="purple" />
          {hasReceptiegasten && <KpiCard label="Receptiegasten" value={receptiegasten} color="teal" />}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Gastenlijst</span>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCsv}
              className="text-sm font-semibold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button
              onClick={exportExcel}
              className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Excel (.xlsx)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <Th>Naam</Th>
                <Th>Status</Th>
                <Th className="hidden sm:table-cell">Type</Th>
                <Th className="hidden md:table-cell">E-mail</Th>
                <Th className="hidden lg:table-cell">Dieetwensen</Th>
                {hasSong && <Th className="hidden xl:table-cell">Song</Th>}
                {hasOvernachting && <Th className="hidden xl:table-cell">Overnachting</Th>}
                {hasCustomAnswer && <Th className="hidden xl:table-cell">Extra vraag 1</Th>}
                {hasCustomAnswer2 && <Th className="hidden xl:table-cell">Extra vraag 2</Th>}
                <Th className="hidden lg:table-cell">Berichtje</Th>
                <Th className="hidden lg:table-cell">Aangemeld</Th>
                <Th className="w-16"></Th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.flatMap((group, gi) => {
                const rows = group.map((row) => {
                  const isDeclined = row.attending === "no"
                  const isDeleting = deletingId === row.id
                  const confirmingDelete = deleteConfirmId === row.id
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-50 ${gi % 2 === 0 ? "bg-white" : "bg-gray-50/50"} ${isDeleting ? "opacity-40" : ""}`}
                    >
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {row.name}
                        {row.is_primary && (
                          <span className="ml-2 text-xs bg-rose-50 text-rose-500 font-semibold px-1.5 py-0.5 rounded-full">
                            hoofd
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDeclined ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {isDeclined ? "Afwezig" : "Aanwezig"}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        {isDeclined ? <span className="text-gray-300">—</span> : <GuestTypeBadge type={row.guest_type} />}
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{row.email ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">
                        {row.dietary || <span className="text-gray-300">—</span>}
                      </td>
                      {hasSong && (
                        <td className="px-5 py-3 text-gray-500 hidden xl:table-cell">
                          {row.song || <span className="text-gray-300">—</span>}
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
                      <td className="px-5 py-3 text-gray-400 italic text-xs hidden lg:table-cell">
                        {isDeclined && row.message ? `"${row.message}"` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(row.created_at).toLocaleDateString("nl-NL")}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {confirmingDelete ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Ja
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              Nee
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEdit(row)}
                              title="Bewerken"
                              className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(row.id)}
                              title="Verwijderen"
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                  <tr key={`sep-${gi}`}><td colSpan={99} className="h-px p-0 bg-gray-200" /></tr>
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
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { if (!saving) { setEditingRow(null); setEditForm(null) } }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Gast bewerken</h3>
              <button
                onClick={() => { setEditingRow(null); setEditForm(null) }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-7 py-6 flex flex-col gap-5">
              {/* Name */}
              <Field label="Naam">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                />
              </Field>

              {/* Email */}
              <Field label="E-mailadres">
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="(leeg)"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                />
              </Field>

              {/* Status */}
              <Field label="Status">
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, attending: val })}
                      className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        editForm.attending === val
                          ? val === "yes" ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700" : "bg-rose-50 border-2 border-rose-400 text-rose-700"
                          : "bg-gray-50 border-2 border-gray-200 text-gray-400"
                      }`}
                    >
                      {val === "yes" ? "Aanwezig" : "Afwezig"}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Guest type — only when attending */}
              {editForm.attending !== "no" && (
                <Field label="Type gast">
                  <div className="flex gap-2">
                    {["daggast", "avondgast", "receptiegast"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, guest_type: t })}
                        className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all capitalize ${
                          editForm.guest_type === t
                            ? "bg-rose-500 border-2 border-rose-500 text-white"
                            : "bg-transparent border-2 border-gray-200 text-gray-400"
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {/* Dietary */}
              {editForm.attending !== "no" && (
                <Field label="Dieetwensen / Allergieën">
                  <input
                    type="text"
                    value={editForm.dietary}
                    onChange={(e) => setEditForm({ ...editForm, dietary: e.target.value })}
                    placeholder="—"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                  />
                </Field>
              )}

              {/* Song */}
              {hasSong && editForm.attending !== "no" && (
                <Field label="Song request">
                  <input
                    type="text"
                    value={editForm.song}
                    onChange={(e) => setEditForm({ ...editForm, song: e.target.value })}
                    placeholder="—"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
                  />
                </Field>
              )}

              {/* Overnachting */}
              {hasOvernachting && editForm.attending !== "no" && (
                <Field label="Overnachting">
                  <TriStateButtons
                    value={editForm.overnachting}
                    onChange={(v) => setEditForm({ ...editForm, overnachting: v })}
                  />
                </Field>
              )}

              {/* Custom answer 1 */}
              {hasCustomAnswer && editForm.attending !== "no" && (
                <Field label="Extra vraag 1">
                  <TriStateButtons
                    value={editForm.custom_answer}
                    onChange={(v) => setEditForm({ ...editForm, custom_answer: v })}
                  />
                </Field>
              )}

              {/* Custom answer 2 */}
              {hasCustomAnswer2 && editForm.attending !== "no" && (
                <Field label="Extra vraag 2">
                  <TriStateButtons
                    value={editForm.custom_answer_2}
                    onChange={(v) => setEditForm({ ...editForm, custom_answer_2: v })}
                  />
                </Field>
              )}

              {/* Message — only when declined */}
              {editForm.attending === "no" && (
                <Field label="Berichtje">
                  <textarea
                    rows={3}
                    value={editForm.message}
                    onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                    placeholder="—"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all resize-none"
                  />
                </Field>
              )}

              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>

            <div className="px-7 py-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setEditingRow(null); setEditForm(null) }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}

function TriStateButtons({ value, onChange }: { value: boolean | null; onChange: (v: boolean | null) => void }) {
  return (
    <div className="flex gap-2">
      {([true, false, null] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
            value === v
              ? v === true ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700"
                : v === false ? "bg-rose-50 border-2 border-rose-400 text-rose-700"
                : "bg-gray-100 border-2 border-gray-300 text-gray-600"
              : "bg-transparent border-2 border-gray-200 text-gray-400"
          }`}
        >
          {v === true ? "Ja" : v === false ? "Nee" : "—"}
        </button>
      ))}
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 ${className ?? ""}`}>
      {children}
    </th>
  )
}

function GuestTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    daggast:      "bg-blue-50 text-blue-600",
    avondgast:    "bg-purple-50 text-purple-600",
    receptiegast: "bg-teal-50 text-teal-600",
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[type] ?? "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  )
}

function BoolBadge({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-gray-300">—</span>
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${value ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
      {value ? "Ja" : "Nee"}
    </span>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: "emerald" | "rose" | "blue" | "purple" | "teal" }) {
  const styles = {
    emerald: "text-emerald-600",
    rose:    "text-rose-500",
    blue:    "text-blue-600",
    purple:  "text-purple-600",
    teal:    "text-teal-600",
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
      <p className={`text-3xl font-extrabold ${styles[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}
