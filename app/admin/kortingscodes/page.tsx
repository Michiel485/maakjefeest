"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

interface DiscountCode {
  id: string
  code: string
  type: "free" | "fixed" | "percentage"
  value: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  notes: string | null
  created_at: string
}

function typeLabel(type: string, value: number) {
  if (type === "free")       return "100% gratis"
  if (type === "fixed")      return `€${Number(value).toFixed(2).replace(".", ",")} korting`
  if (type === "percentage") return `${value}% korting`
  return type
}

function statusBadge(code: DiscountCode) {
  if (!code.is_active) return { label: "Inactief", color: "#9A8E82", bg: "#F5F0E8" }
  if (code.expires_at && new Date(code.expires_at) < new Date()) return { label: "Verlopen", color: "#B91C1C", bg: "#FEF2F2" }
  if (code.max_uses != null && code.used_count >= code.max_uses) return { label: "Uitgeput", color: "#B45309", bg: "#FFFBEB" }
  return { label: "Actief", color: "#15803D", bg: "#F0FDF4" }
}

const inputCls = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none"
const inputSt: React.CSSProperties  = { borderColor: GOLD_LIGHT, color: CHARCOAL }

export default function KortingscodesPage() {
  const [codes, setCodes]       = useState<DiscountCode[]>([])
  const [loading, setLoading]   = useState(true)
  const [denied, setDenied]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")

  const [form, setForm] = useState({
    code:       "",
    type:       "free" as "free" | "fixed" | "percentage",
    value:      "100",
    max_uses:   "1",
    unlimited:  false,
    expires_at: "",
    notes:      "",
  })

  function load() {
    fetch("/api/admin/discount-codes")
      .then(r => {
        if (r.status === 401) { setDenied(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => { if (d) { setCodes(d); setLoading(false) } })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    setForm(f => ({ ...f, code: rand }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError("")

    const body = {
      code:       form.code.trim().toUpperCase(),
      type:       form.type,
      value:      form.type === "free" ? 100 : parseFloat(form.value) || 0,
      max_uses:   form.unlimited ? null : (parseInt(form.max_uses) || 1),
      expires_at: form.expires_at || null,
      notes:      form.notes || null,
    }

    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Fout bij opslaan"); setSaving(false); return }
      setForm({ code: "", type: "free", value: "100", max_uses: "1", unlimited: false, expires_at: "", notes: "" })
      setShowForm(false)
      setLoading(true)
      load()
    } catch {
      setError("Netwerk fout")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/discount-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    })
    setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm("Code permanent verwijderen?")) return
    await fetch(`/api/admin/discount-codes/${id}`, { method: "DELETE" })
    setCodes(prev => prev.filter(c => c.id !== id))
  }

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
      <p className="text-sm" style={{ color: BODY }}>Geen toegang.</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: IVORY, minHeight: "100vh" }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between" style={{ backgroundColor: IVORY, borderColor: "#E8DDD0" }}>
        <div className="flex items-center gap-6">
          <Link href="/" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem", fontWeight: 700, color: CHARCOAL, textDecoration: "none" }}>SayingYes</Link>
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: GOLD_BG, color: GOLD }}>Admin</span>
        </div>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/admin" style={{ color: BODY, textDecoration: "none" }}>Dashboard</Link>
          <Link href="/admin/kosten" style={{ color: BODY, textDecoration: "none" }}>Kosten</Link>
          <Link href="/admin/facturen" style={{ color: BODY, textDecoration: "none" }}>Facturen</Link>
          <Link href="/admin/kortingscodes" style={{ color: GOLD, textDecoration: "none" }}>Kortingscodes</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2rem", fontWeight: 700, color: CHARCOAL }}>
            Kortingscodes
          </h1>
          <button
            onClick={() => setShowForm(f => !f)}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nieuwe code
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl p-6 mb-8" style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}>
            <p className="text-sm font-semibold mb-5" style={{ color: CHARCOAL }}>Nieuwe kortingscode aanmaken</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Code *</label>
                <div className="flex gap-2">
                  <input
                    required
                    className={inputCls}
                    style={{ ...inputSt, textTransform: "uppercase", letterSpacing: "0.08em" }}
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="bijv. VRIEND2025"
                  />
                  <button type="button" onClick={generateCode} className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70" style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_LIGHT}` }}>
                    Genereer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Type korting *</label>
                <select required className={inputCls} style={{ ...inputSt, cursor: "pointer" }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as "free" | "fixed" | "percentage" })}>
                  <option value="free">100% gratis (€0,00)</option>
                  <option value="fixed">Vast bedrag (bijv. €20 korting)</option>
                  <option value="percentage">Percentage (bijv. 50% korting)</option>
                </select>
              </div>

              {form.type !== "free" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>
                    {form.type === "fixed" ? "Kortingsbedrag (€)" : "Kortingspercentage (%)"}
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    max={form.type === "percentage" ? "100" : "49.99"}
                    step="0.01"
                    className={inputCls}
                    style={inputSt}
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === "fixed" ? "20.00" : "50"}
                  />
                  {form.value && (
                    <p className="text-xs mt-1" style={{ color: BODY }}>
                      Klant betaalt:{" "}
                      <strong style={{ color: CHARCOAL }}>
                        €{Math.max(0, form.type === "fixed"
                          ? 49.99 - parseFloat(form.value)
                          : 49.99 * (1 - parseFloat(form.value) / 100)
                        ).toFixed(2).replace(".", ",")}
                      </strong>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Max. gebruik</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    className={inputCls}
                    style={{ ...inputSt, opacity: form.unlimited ? 0.4 : 1 }}
                    value={form.max_uses}
                    onChange={e => setForm({ ...form, max_uses: e.target.value })}
                    disabled={form.unlimited}
                    placeholder="1"
                  />
                  <label className="flex items-center gap-1.5 text-xs whitespace-nowrap" style={{ color: BODY }}>
                    <input type="checkbox" checked={form.unlimited} onChange={e => setForm({ ...form, unlimited: e.target.checked })} />
                    Onbeperkt
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Vervaldatum (optioneel)</label>
                <input type="date" className={inputCls} style={inputSt} value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Notitie (intern)</label>
                <input className={inputCls} style={inputSt} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="bijv. voor Michiel Jansen" />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60" style={{ backgroundColor: CHARCOAL, color: IVORY }}>
                {saving ? "Aanmaken..." : "Code aanmaken"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm px-5 py-2.5 rounded-xl" style={{ border: `1px solid ${GOLD_LIGHT}`, color: BODY, backgroundColor: "#fff" }}>
                Annuleren
              </button>
            </div>
          </form>
        )}

        {/* Codes list */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${GOLD_LIGHT}` }}>
          <div className="px-6 py-4" style={{ backgroundColor: GOLD_BG }}>
            <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Alle codes ({codes.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#FFFDF9", borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                  {["Code", "Type", "Gebruik", "Vervaldatum", "Notitie", "Status", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: "#9A8E82", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((c, i) => {
                  const badge = statusBadge(c)
                  return (
                    <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? "#FFFDF9" : IVORY, borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                      <td className="px-5 py-3 font-mono font-bold tracking-wider" style={{ color: CHARCOAL }}>{c.code}</td>
                      <td className="px-5 py-3" style={{ color: BODY }}>{typeLabel(c.type, c.value)}</td>
                      <td className="px-5 py-3" style={{ color: BODY }}>
                        {c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : " / ∞"}
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: BODY }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString("nl-NL") : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "#9A8E82" }}>{c.notes || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ color: badge.color, backgroundColor: badge.bg }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleActive(c.id, c.is_active)} className="text-xs transition-opacity hover:opacity-70" style={{ color: GOLD }}>
                            {c.is_active ? "Deactiveer" : "Activeer"}
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="text-xs transition-opacity hover:opacity-70" style={{ color: "#B91C1C" }}>
                            Verwijder
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!codes.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: "#9A8E82" }}>
                      Nog geen kortingscodes aangemaakt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
