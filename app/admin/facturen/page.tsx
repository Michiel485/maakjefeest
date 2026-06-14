"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const IVORY      = "#FAF7F2"
const BODY       = "#5C5248"
const LIGHT      = "#9A8E82"

interface Invoice {
  id: string
  invoice_number: string
  date: string
  customer_name: string
  customer_email: string
  description: string
  amount_excl: number
  btw_amount: number
  amount_incl: number
  mollie_payment_id: string | null
  file_path: string | null
  created_at: string
}

function formatEur(n: number) {
  return "€ " + n.toFixed(2).replace(".", ",")
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
}

export default function AdminFacturenPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/invoices")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setInvoices(d.invoices ?? [])
      })
      .catch(() => setError("Kon facturen niet laden"))
      .finally(() => setLoading(false))
  }, [])

  async function downloadPDF(invoice: Invoice) {
    const res = await fetch(`/api/admin/invoices/${invoice.id}/pdf`)
    if (!res.ok) { alert("PDF niet gevonden"); return }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `${invoice.invoice_number}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: IVORY, fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>

        {/* Nav */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {[
            { href: "/admin",              label: "Dashboard" },
            { href: "/admin/kosten",       label: "Kosten" },
            { href: "/admin/facturen",     label: "Facturen" },
            { href: "/admin/kortingscodes",label: "Kortingscodes" },
          ].map(n => (
            <Link key={n.href} href={n.href} style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 13, textDecoration: "none",
              backgroundColor: n.href === "/admin/facturen" ? GOLD : "transparent",
              color: n.href === "/admin/facturen" ? "#fff" : BODY,
              border: `1px solid ${n.href === "/admin/facturen" ? GOLD : GOLD_LIGHT}`,
            }}>{n.label}</Link>
          ))}
        </div>

        <h1 style={{ fontSize: 26, color: CHARCOAL, marginBottom: 6 }}>Facturen</h1>
        <p style={{ color: LIGHT, fontSize: 14, marginBottom: 32 }}>
          Alle verzonden facturen. PDFs worden automatisch aangemaakt bij betaling.
        </p>

        {loading && <p style={{ color: BODY }}>Laden…</p>}
        {error   && <p style={{ color: "#e53e3e" }}>{error}</p>}

        {!loading && !error && invoices.length === 0 && (
          <p style={{ color: LIGHT }}>Nog geen facturen.</p>
        )}

        {invoices.length > 0 && (
          <div style={{ backgroundColor: "#fff", borderRadius: 10, border: `1px solid ${GOLD_LIGHT}`, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px 80px", gap: 0,
              backgroundColor: GOLD_BG, padding: "10px 16px", borderBottom: `1px solid ${GOLD_LIGHT}` }}>
              {["Factuurnummer", "Klant", "Datum", "Bedrag", ""].map(h => (
                <span key={h} style={{ fontSize: 11, fontFamily: "sans-serif", fontWeight: 700,
                  color: LIGHT, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>

            {invoices.map((inv, i) => (
              <div key={inv.id} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px 80px", gap: 0,
                padding: "14px 16px", alignItems: "center",
                borderBottom: i < invoices.length - 1 ? `1px solid ${GOLD_LIGHT}` : "none",
                backgroundColor: i % 2 === 0 ? "#fff" : "#fffdf9",
              }}>
                <span style={{ fontSize: 13, color: CHARCOAL, fontFamily: "monospace" }}>{inv.invoice_number}</span>
                <div>
                  <div style={{ fontSize: 13, color: CHARCOAL }}>{inv.customer_name || "—"}</div>
                  <div style={{ fontSize: 11, color: LIGHT, fontFamily: "sans-serif" }}>{inv.customer_email}</div>
                </div>
                <span style={{ fontSize: 13, color: BODY, fontFamily: "sans-serif" }}>{formatDate(inv.date)}</span>
                <span style={{ fontSize: 13, color: CHARCOAL, fontFamily: "sans-serif" }}>{formatEur(inv.amount_incl)}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {inv.file_path ? (
                    <button onClick={() => downloadPDF(inv)} style={{
                      padding: "4px 10px", borderRadius: 5, fontSize: 11, cursor: "pointer",
                      backgroundColor: GOLD, color: "#fff", border: "none", fontFamily: "sans-serif",
                    }}>PDF</button>
                  ) : (
                    <span style={{ fontSize: 11, color: LIGHT, fontFamily: "sans-serif" }}>geen PDF</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {invoices.length > 0 && (
          <div style={{ marginTop: 16, textAlign: "right", color: LIGHT, fontSize: 12, fontFamily: "sans-serif" }}>
            {invoices.length} facturen · totaal{" "}
            <strong style={{ color: CHARCOAL }}>{formatEur(invoices.reduce((s, i) => s + i.amount_incl, 0))}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
