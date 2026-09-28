import { meldFout } from "@/lib/foutmelding"
import { bezoekerIp, teVeelPogingen } from "@/lib/rem"

export const dynamic = "force-dynamic"

// POST: een pagina liep vast in de browser van een bezoeker (app/error.tsx,
// app/global-error.tsx en components/FoutVanger.tsx). Gaat als mail naar de
// beheerder, met de rem van lib/foutmelding.ts.
//
// Iedereen kan hierheen posten, dus: alleen van onze eigen sites, een paar per
// minuut per bezoeker, en korte teksten.
export async function POST(request: Request) {
  const herkomst = request.headers.get("origin") ?? ""
  let host = ""
  try {
    host = new URL(herkomst).hostname
  } catch {}
  const eigen = host === "localhost" || host === "sayingyes.nl" || host.endsWith(".sayingyes.nl") || host === "sayingyes.be" || host.endsWith(".sayingyes.be")
  if (!eigen) return Response.json({ ok: false }, { status: 403 })
  if (teVeelPogingen("fout", bezoekerIp(request), 5)) return Response.json({ ok: false }, { status: 429 })

  const body = (await request.json().catch(() => null)) as { bericht?: unknown; stapel?: unknown; pad?: unknown; waar?: unknown } | null
  if (!body || typeof body.bericht !== "string") return Response.json({ ok: false }, { status: 400 })

  const fout = new Error(body.bericht.slice(0, 500))
  fout.stack = typeof body.stapel === "string" ? body.stapel.slice(0, 2000) : undefined
  await meldFout({
    soort: "browser",
    waar: typeof body.waar === "string" ? body.waar.slice(0, 80) : "pagina",
    pad: typeof body.pad === "string" ? body.pad : null,
    fout,
    extra: `${host} · ${(request.headers.get("user-agent") ?? "").slice(0, 160)}`,
  })
  return Response.json({ ok: true })
}

// GET: een bewuste testfout, om te zien of de mail aankomt. Alleen met het
// geheim van de dagelijkse taak (CRON_SECRET).
export async function GET(request: Request) {
  const geheim = process.env.CRON_SECRET
  if (!geheim || request.headers.get("authorization") !== `Bearer ${geheim}`) {
    return Response.json({ error: "Niet toegestaan" }, { status: 401 })
  }
  throw new Error("Testfout: zo ziet een foutmelding eruit")
}
