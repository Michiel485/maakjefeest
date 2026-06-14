"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

interface Stats {
  year: number
  revenue: number
  costs: number
  profit: number
  btwReceived: number
  btwPaid: number
  btwToPay: number
  monthlyRevenue: { label: string; amount: number }[]
  quarters: { quarter: string; omzet: number; btwReceived: number; btwPaid: number; btwToPay: number }[]
  transactions: { type: "income" | "expense"; date: string; description: string; name: string; amount: number }[]
}

function eur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n)
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9A8E82" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: color ?? CHARCOAL }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#9A8E82" }}>{sub}</p>}
    </div>
  )
}

export default function AdminPage() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied]   = useState(false)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => {
        if (r.status === 401) { setDenied(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => { if (d) { setStats(d); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [])

  const maxMonthly = Math.max(...(stats?.monthlyRevenue.map(m => m.amount) ?? [1]))

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: IVORY }}>
      <svg className="w-8 h-8 animate-spin" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  )

  if (denied) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: IVORY }}>
      <p className="text-sm" style={{ color: BODY }}>Geen toegang. Log in als beheerder.</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: IVORY, minHeight: "100vh" }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between" style={{ backgroundColor: IVORY, borderColor: "#E8DDD0" }}>
        <div className="flex items-center gap-6">
          <Link href="/" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem", fontWeight: 700, color: CHARCOAL, textDecoration: "none" }}>
            SayingYes
          </Link>
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: GOLD_BG, color: GOLD }}>Admin</span>
        </div>
        <nav className="flex items-center gap-5 text-sm font-medium" style={{ color: BODY }}>
          <Link href="/admin" style={{ color: GOLD, textDecoration: "none" }}>Dashboard</Link>
          <Link href="/admin/kosten" style={{ color: BODY, textDecoration: "none" }}>Kosten</Link>
          <a
            href={`/api/admin/export?year=${stats?.year ?? new Date().getFullYear()}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_LIGHT}` }}
          >
            CSV exporteren
          </a>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex items-baseline justify-between mb-8">
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2rem", fontWeight: 700, color: CHARCOAL }}>
            Boekhouding {stats?.year}
          </h1>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <KpiCard label="Omzet" value={eur(stats?.revenue ?? 0)} sub="incl. BTW" />
          <KpiCard label="Kosten" value={eur(stats?.costs ?? 0)} sub="incl. BTW" color="#B91C1C" />
          <KpiCard label="Winst" value={eur(stats?.profit ?? 0)} sub="voor belasting" color={((stats?.profit ?? 0) >= 0) ? "#15803D" : "#B91C1C"} />
          <KpiCard label="BTW af te dragen" value={eur(stats?.btwToPay ?? 0)} sub="ontvangen − betaald" color={GOLD} />
        </div>

        {/* Chart */}
        <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}>
          <p className="text-sm font-semibold mb-5" style={{ color: CHARCOAL }}>Omzet per maand</p>
          <div className="flex items-end gap-2" style={{ height: 140 }}>
            {stats?.monthlyRevenue.map(m => {
              const pct = maxMonthly > 0 ? (m.amount / maxMonthly) * 100 : 0
              return (
                <div key={m.label} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{ height: `${Math.max(pct, m.amount > 0 ? 4 : 0)}%`, backgroundColor: m.amount > 0 ? GOLD : GOLD_LIGHT, minHeight: m.amount > 0 ? 4 : 0 }}
                    title={eur(m.amount)}
                  />
                  <span className="text-xs" style={{ color: "#9A8E82" }}>{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quarterly BTW */}
        <div className="rounded-2xl overflow-hidden mb-8" style={{ border: `1px solid ${GOLD_LIGHT}` }}>
          <div className="px-6 py-4" style={{ backgroundColor: GOLD_BG }}>
            <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Kwartaaloverzicht BTW-aangifte</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#FFFDF9", borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                  {["Kwartaal", "Omzet", "BTW ontvangen", "BTW betaald", "Af te dragen"].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: "#9A8E82", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.quarters.map((q, i) => (
                  <tr key={q.quarter} style={{ backgroundColor: i % 2 === 0 ? "#FFFDF9" : IVORY, borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                    <td className="px-5 py-3 font-semibold" style={{ color: CHARCOAL }}>{q.quarter}</td>
                    <td className="px-5 py-3" style={{ color: BODY }}>{eur(q.omzet)}</td>
                    <td className="px-5 py-3" style={{ color: BODY }}>{eur(q.btwReceived)}</td>
                    <td className="px-5 py-3" style={{ color: BODY }}>{eur(q.btwPaid)}</td>
                    <td className="px-5 py-3 font-semibold" style={{ color: q.btwToPay > 0 ? "#B45309" : BODY }}>{eur(q.btwToPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${GOLD_LIGHT}` }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: GOLD_BG }}>
            <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Recente transacties</p>
            <Link href="/admin/kosten" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: GOLD }}>
              Kosten beheren →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#FFFDF9", borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                  {["Datum", "Omschrijving", "Relatie", "Bedrag"].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: "#9A8E82", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.transactions ?? []).map((t, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FFFDF9" : IVORY, borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                    <td className="px-5 py-3 text-xs" style={{ color: "#9A8E82", whiteSpace: "nowrap" }}>{new Date(t.date).toLocaleDateString("nl-NL")}</td>
                    <td className="px-5 py-3" style={{ color: CHARCOAL }}>{t.description}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: BODY }}>{t.name}</td>
                    <td className="px-5 py-3 font-semibold text-right whitespace-nowrap" style={{ color: t.type === "income" ? "#15803D" : "#B91C1C" }}>
                      {t.type === "income" ? "+" : "−"}{eur(t.amount)}
                    </td>
                  </tr>
                ))}
                {!stats?.transactions.length && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: "#9A8E82" }}>Nog geen transacties dit jaar</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
