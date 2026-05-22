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

export default function RsvpSection({
  rsvps,
  events,
}: {
  rsvps: RsvpRow[]
  events: EventRef[]
}) {
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

  function exportCsv() {
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
            </tr>
          </thead>
          <tbody>
            {sortedGroups.flatMap((group, gi) => {
              const rows = group.map((row) => {
                const isDeclined = row.attending === "no"
                return (
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
                          isDeclined ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {isDeclined ? "Afwezig" : "Aanwezig"}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      {isDeclined ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <GuestTypeBadge type={row.guest_type} />
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{row.email ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">
                      {row.dietary ? row.dietary : <span className="text-gray-300">—</span>}
                    </td>
                    {hasSong && (
                      <td className="px-5 py-3 text-gray-500 hidden xl:table-cell">
                        {row.song ? row.song : <span className="text-gray-300">—</span>}
                      </td>
                    )}
                    {hasOvernachting && (
                      <td className="px-5 py-3 hidden xl:table-cell">
                        <BoolBadge value={row.overnachting} />
                      </td>
                    )}
                    {hasCustomAnswer && (
                      <td className="px-5 py-3 hidden xl:table-cell">
                        <BoolBadge value={row.custom_answer} />
                      </td>
                    )}
                    {hasCustomAnswer2 && (
                      <td className="px-5 py-3 hidden xl:table-cell">
                        <BoolBadge value={row.custom_answer_2} />
                      </td>
                    )}
                    <td className="px-5 py-3 text-gray-400 italic text-xs hidden lg:table-cell">
                      {isDeclined && row.message ? `"${row.message}"` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(row.created_at).toLocaleDateString("nl-NL")}
                    </td>
                  </tr>
                )
              })
              const sep =
                gi < sortedGroups.length - 1 ? (
                  <tr key={`sep-${gi}`}>
                    <td colSpan={99} className="h-px p-0 bg-gray-200" />
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

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
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
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        value ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
      }`}
    >
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
