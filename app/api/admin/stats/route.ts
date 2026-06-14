import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]

export async function GET() {
  const { response } = await requireAdmin()
  if (response) return response

  const supabase = createServiceClient()
  const year = new Date().getFullYear()
  const yearStart = `${year}-01-01`
  const yearEnd   = `${year}-12-31`

  const [{ data: invoices }, { data: expenses }] = await Promise.all([
    supabase.from("invoices").select("amount_excl,btw_amount,amount_incl,date,invoice_number,customer_name,customer_email").gte("date", yearStart).lte("date", yearEnd).order("date", { ascending: false }),
    supabase.from("expenses").select("amount_excl,btw_amount,amount_incl,date,description,category,id,file_url").gte("date", yearStart).lte("date", yearEnd).order("date", { ascending: false }),
  ])

  const inv = invoices ?? []
  const exp = expenses ?? []

  const revenue = inv.reduce((s, r) => s + Number(r.amount_incl), 0)
  const costs   = exp.reduce((s, r) => s + Number(r.amount_incl), 0)
  const profit  = revenue - costs
  const btwReceived = inv.reduce((s, r) => s + Number(r.btw_amount), 0)
  const btwPaid     = exp.reduce((s, r) => s + Number(r.btw_amount), 0)
  const btwToPay    = btwReceived - btwPaid

  // Monthly revenue (12 buckets)
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
    label: MONTHS[i],
    amount: inv
      .filter(r => new Date(r.date).getMonth() === i)
      .reduce((s, r) => s + Number(r.amount_incl), 0),
  }))

  // Quarterly BTW
  const quarters = [1, 2, 3, 4].map(q => {
    const months = [q * 3 - 3, q * 3 - 2, q * 3 - 1]
    const qInv = inv.filter(r => months.includes(new Date(r.date).getMonth()))
    const qExp = exp.filter(r => months.includes(new Date(r.date).getMonth()))
    const received = qInv.reduce((s, r) => s + Number(r.btw_amount), 0)
    const paid     = qExp.reduce((s, r) => s + Number(r.btw_amount), 0)
    return { quarter: `Q${q}`, omzet: qInv.reduce((s, r) => s + Number(r.amount_incl), 0), btwReceived: received, btwPaid: paid, btwToPay: received - paid }
  })

  // Recent transactions (interleaved, most recent first)
  const transactions = [
    ...inv.map(r => ({ type: "income" as const, date: r.date, description: `Factuur ${r.invoice_number}`, name: r.customer_name || r.customer_email, amount: Number(r.amount_incl) })),
    ...exp.map(r => ({ type: "expense" as const, date: r.date, description: r.description, name: r.category, amount: Number(r.amount_incl) })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)

  return Response.json({ year, revenue, costs, profit, btwReceived, btwPaid, btwToPay, monthlyRevenue, quarters, transactions })
}
