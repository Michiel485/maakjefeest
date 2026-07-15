"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"

const CATEGORIES = [
  { value: "hosting_software", label: "Hosting & Software" },
  { value: "marketing",        label: "Marketing & Advertenties" },
  { value: "kantoor",          label: "Kantoor & Algemeen" },
  { value: "overig",           label: "Overig" },
]

function catLabel(v: string) {
  return CATEGORIES.find(c => c.value === v)?.label ?? v
}

interface Expense {
  id: string
  description: string
  supplier?: string
  category: string
  amount_excl: number
  btw_amount: number
  amount_incl: number
  btw_rate: number
  date: string
  file_url?: string
  notes?: string
}

function eur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n)
}

const inputCls = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none transition-all"
const inputSt: React.CSSProperties = { borderColor: GOLD_LIGHT, color: CHARCOAL }

export default function KostenPage() {
  const [expenses, setExpenses]   = useState<Expense[]>([])
  const [loading, setLoading]     = useState(true)
  const [denied, setDenied]       = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    description: "",
    supplier: "",
    category: "hosting_software",
    amount_incl: "",
    btw_rate: "21",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [file, setFile] = useState<File | null>(null)

  function load() {
    fetch("/api/admin/expenses")
      .then(r => {
        if (r.status === 401) { setDenied(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => { if (d) { setExpenses(d); setLoading(false) } })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  function calcAmounts() {
    const incl = parseFloat(form.amount_incl.replace(",", ".")) || 0
    const rate = parseFloat(form.btw_rate) || 0
    const excl = Math.round((incl / (1 + rate / 100)) * 100) / 100
    const btw  = Math.round((incl - excl) * 100) / 100
    return { amount_excl: excl, btw_amount: btw, amount_incl: incl }
  }

  function resetForm() {
    setForm({ description: "", supplier: "", category: "hosting_software", amount_incl: "", btw_rate: "21", date: new Date().toISOString().split("T")[0], notes: "" })
    setFile(null)
    if (fileRef.current) fileRef.current.value = ""
    setEditingId(null)
  }

  function startEdit(exp: Expense) {
    setEditingId(exp.id)
    setForm({
      description: exp.description,
      supplier:    exp.supplier ?? "",
      category:    exp.category,
      amount_incl: String(exp.amount_incl),
      btw_rate:    String(exp.btw_rate ?? "21"),
      date:        exp.date.split("T")[0],
      notes:       exp.notes ?? "",
    })
    setFile(null)
    if (fileRef.current) fileRef.current.value = ""
    setShowForm(true)
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)

    try {
      let file_path: string | undefined
      if (file) {
        const fd = new FormData()
        fd.append("file", file)
        const up = await fetch("/api/admin/upload", { method: "POST", body: fd })
        if (up.ok) {
          const j = await up.json()
          file_path = j.path
        }
      }

      const amounts = calcAmounts()

      if (editingId) {
        await fetch(`/api/admin/expenses/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: form.description,
            supplier:    form.supplier,
            category:    form.category,
            btw_rate:    parseFloat(form.btw_rate),
            date:        form.date,
            notes:       form.notes,
            // only overwrite the file when a new one was uploaded
            ...(file_path ? { file_path } : {}),
            ...amounts,
          }),
        })
      } else {
        const payload = {
          description: form.description,
          supplier:    form.supplier || undefined,
          category:    form.category,
          btw_rate:    parseFloat(form.btw_rate),
          date:        form.date,
          notes:       form.notes || undefined,
          file_path,
          ...amounts,
        }
        await fetch("/api/admin/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      resetForm()
      setShowForm(false)
      setLoading(true)
      load()
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Uitgave verwijderen?")) return
    setDeleting(id)
    await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" })
    setExpenses(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
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
      <p className="text-sm" style={{ color: BODY }}>Geen toegang. Log in als beheerder.</p>
    </div>
  )

  const amounts = calcAmounts()

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
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/admin" style={{ color: BODY, textDecoration: "none" }}>Dashboard</Link>
          <Link href="/admin/kosten" style={{ color: GOLD, textDecoration: "none" }}>Kosten</Link>
          <Link href="/admin/facturen" style={{ color: BODY, textDecoration: "none" }}>Facturen</Link>
          <Link href="/admin/kortingscodes" style={{ color: BODY, textDecoration: "none" }}>Kortingscodes</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2rem", fontWeight: 700, color: CHARCOAL }}>
            Kosten & Uitgaven
          </h1>
          <button
            onClick={() => { resetForm(); setShowForm(f => !f) }}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: CHARCOAL, color: IVORY, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Uitgave toevoegen
          </button>
        </div>

        {/* Add expense form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-6 mb-8"
            style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }}
          >
            <p className="text-sm font-semibold mb-5" style={{ color: CHARCOAL }}>{editingId ? "Uitgave bewerken" : "Nieuwe uitgave"}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Omschrijving *</label>
                <input required className={inputCls} style={inputSt} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="bijv. Vercel hosting" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Leverancier</label>
                <input className={inputCls} style={inputSt} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="bijv. Vercel Inc." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Categorie *</label>
                <select required className={inputCls} style={{ ...inputSt, cursor: "pointer" }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Datum *</label>
                <input required type="date" className={inputCls} style={inputSt} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Bedrag incl. BTW *</label>
                <input required className={inputCls} style={inputSt} value={form.amount_incl} onChange={e => setForm({ ...form, amount_incl: e.target.value })} placeholder="49.99" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>BTW tarief (%)</label>
                <select className={inputCls} style={{ ...inputSt, cursor: "pointer" }} value={form.btw_rate} onChange={e => setForm({ ...form, btw_rate: e.target.value })}>
                  <option value="21">21% (standaard)</option>
                  <option value="9">9% (verlaagd)</option>
                  <option value="0">0% (vrijgesteld)</option>
                </select>
              </div>
            </div>

            {form.amount_incl && (
              <div className="flex gap-6 text-xs mb-4 px-1" style={{ color: BODY }}>
                <span>Excl. BTW: <strong style={{ color: CHARCOAL }}>{eur(amounts.amount_excl)}</strong></span>
                <span>BTW {form.btw_rate}%: <strong style={{ color: CHARCOAL }}>{eur(amounts.btw_amount)}</strong></span>
                <span>Incl. BTW: <strong style={{ color: CHARCOAL }}>{eur(amounts.amount_incl)}</strong></span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Factuur uploaden (PDF/afbeelding){editingId ? " — leeg laten = huidige behouden" : ""}</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:cursor-pointer" style={{ color: BODY }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Notities</label>
                <input className={inputCls} style={inputSt} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optionele aantekening" />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
                style={{ backgroundColor: CHARCOAL, color: IVORY }}
              >
                {saving ? "Opslaan..." : editingId ? "Wijzigingen opslaan" : "Opslaan"}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false) }}
                className="text-sm px-5 py-2.5 rounded-xl transition-opacity hover:opacity-70"
                style={{ border: `1px solid ${GOLD_LIGHT}`, color: BODY, backgroundColor: "#fff" }}
              >
                Annuleren
              </button>
            </div>
          </form>
        )}

        {/* Expenses list */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${GOLD_LIGHT}` }}>
          <div className="px-6 py-4" style={{ backgroundColor: GOLD_BG }}>
            <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
              Alle uitgaven ({expenses.length})
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#FFFDF9", borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                  {["Datum", "Omschrijving", "Leverancier", "Categorie", "Incl. BTW", "BTW", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: "#9A8E82", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={e.id} style={{ backgroundColor: i % 2 === 0 ? "#FFFDF9" : IVORY, borderBottom: `1px solid ${GOLD_LIGHT}` }}>
                    <td className="px-5 py-3 text-xs" style={{ color: "#9A8E82", whiteSpace: "nowrap" }}>
                      {new Date(e.date).toLocaleDateString("nl-NL")}
                    </td>
                    <td className="px-5 py-3" style={{ color: CHARCOAL }}>
                      {e.description}
                      {e.notes && <p className="text-xs mt-0.5" style={{ color: "#9A8E82" }}>{e.notes}</p>}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: BODY }}>{e.supplier || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: GOLD_BG, color: GOLD }}>
                        {catLabel(e.category)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold" style={{ color: "#B91C1C", whiteSpace: "nowrap" }}>
                      {eur(Number(e.amount_incl))}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: BODY }}>
                      {eur(Number(e.btw_amount))} ({e.btw_rate}%)
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {e.file_url && (
                          <a href={e.file_url} target="_blank" rel="noopener noreferrer" className="text-xs transition-opacity hover:opacity-70" style={{ color: GOLD }}>
                            Factuur
                          </a>
                        )}
                        <button
                          onClick={() => startEdit(e)}
                          className="text-xs transition-opacity hover:opacity-70"
                          style={{ color: GOLD }}
                        >
                          Bewerk
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          disabled={deleting === e.id}
                          className="text-xs transition-opacity hover:opacity-70 disabled:opacity-40"
                          style={{ color: "#B91C1C" }}
                        >
                          {deleting === e.id ? "..." : "Verwijder"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!expenses.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: "#9A8E82" }}>
                      Nog geen uitgaven geregistreerd.
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
