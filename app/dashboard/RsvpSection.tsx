"use client"

export interface RsvpRow {
  id: string
  event_id: string
  submission_id: string | null
  name: string
  email: string | null
  guest_type: string
  dietary: string | null
  is_primary: boolean
  created_at: string
}

interface EventRef {
  id: string
  title: string
}

export default function RsvpSection({
  rsvps,
  events,
}: {
  rsvps: RsvpRow[]
  events: EventRef[]
}) {
  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.title]))

  const total = rsvps.length
  const daggasten = rsvps.filter((r) => r.guest_type === "daggast").length
  const avondgasten = rsvps.filter((r) => r.guest_type === "avondgast").length

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

  function exportCsv() {
    const headers = ["Naam", "E-mail", "Type", "Dieetwensen", "Event", "Datum"]
    const rows = rsvps.map((r) => [
      r.name,
      r.email ?? "",
      r.guest_type,
      r.dietary ?? "",
      eventMap[r.event_id] ?? r.event_id,
      new Date(r.created_at).toLocaleDateString("nl-NL"),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gasten.csv"
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Totaal gasten" value={total} />
        <KpiCard label="Daggasten" value={daggasten} />
        <KpiCard label="Avondgasten" value={avondgasten} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Gastenlijst</span>
        <button
          onClick={exportCsv}
          className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exporteren als CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400">Naam</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400">Type</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hidden sm:table-cell">E-mail</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">Dieetwensen</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">Aangemeld</th>
            </tr>
          </thead>
          <tbody>
            {sortedGroups.flatMap((group, gi) => {
              const rows = group.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-50 ${gi % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
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
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        row.guest_type === "daggast"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {row.guest_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{row.email ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{row.dietary ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">
                    {new Date(row.created_at).toLocaleDateString("nl-NL")}
                  </td>
                </tr>
              ))
              const sep =
                gi < sortedGroups.length - 1 ? (
                  <tr key={`sep-${gi}`}>
                    <td colSpan={5} className="h-px p-0 bg-gray-200" />
                  </tr>
                ) : null
              return sep ? [...rows, sep] : rows
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
      <p className="text-3xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}
