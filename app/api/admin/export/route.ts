import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

function esc(v: string | number | null | undefined) {
  const s = String(v ?? "")
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function row(cells: (string | number | null | undefined)[]) {
  return cells.map(esc).join(",")
}

export async function GET(request: Request) {
  const { response } = await requireAdmin()
  if (response) return response

  const url  = new URL(request.url)
  const year = url.searchParams.get("year") ?? String(new Date().getFullYear())

  const supabase = createServiceClient()
  const [{ data: invoices }, { data: expenses }] = await Promise.all([
    supabase.from("invoices").select("*").gte("date", `${year}-01-01`).lte("date", `${year}-12-31`).order("date"),
    supabase.from("expenses").select("*").gte("date", `${year}-01-01`).lte("date", `${year}-12-31`).order("date"),
  ])

  const lines: string[] = [
    "Type,Datum,Omschrijving,Relatie,Categorie,Excl BTW,BTW,Incl BTW,BTW%,Referentie",
    ...(invoices ?? []).map(r =>
      row(["Inkomst", r.date, r.description, r.customer_name || r.customer_email, "Omzet", r.amount_excl, r.btw_amount, r.amount_incl, r.btw_rate, r.invoice_number])
    ),
    ...(expenses ?? []).map(r =>
      row(["Uitgave", r.date, r.description, r.supplier || "", r.category, r.amount_excl, r.btw_amount, r.amount_incl, r.btw_rate, r.id])
    ),
  ]

  const csv = lines.join("\r\n")
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sayingyes-boekhouding-${year}.csv"`,
    },
  })
}
