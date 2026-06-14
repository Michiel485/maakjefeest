import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin()
  if (response) return response

  const { id } = await params
  const supabase = createServiceClient()

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("invoice_number, file_path")
    .eq("id", id)
    .single()

  if (error || !invoice?.file_path) {
    return NextResponse.json({ error: "PDF niet gevonden" }, { status: 404 })
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("invoices")
    .download(invoice.file_path)

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "Download mislukt" }, { status: 500 })
  }

  const buffer = Buffer.from(await fileData.arrayBuffer())
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
