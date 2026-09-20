import { createServiceClient } from "@/lib/supabase"
import { bezoekerIp, teVeelPogingen } from "@/lib/rem"
import { fuzzyMatch } from "@/lib/wachtwoord"

export const dynamic = "force-dynamic"

// POST: controleert het wachtwoord of het antwoord op de geheime vraag van een
// klantsite.
//
// Dit gebeurde eerder volledig in de browser: het wachtwoord werd als prop aan
// een clientcomponent meegegeven en stond dus gewoon in de broncode van de
// pagina. Wie op "bron weergeven" drukte, zag het staan. Erger dan de inhoud
// zien, want mensen hergebruiken wachtwoorden.
//
// Nu blijft het wachtwoord op de server. De browser stuurt een poging en
// krijgt alleen ja of nee terug.
export async function POST(request: Request) {
  // Een controle op de server nodigt uit tot raden, dus hier hoort een rem.
  // Tien pogingen per minuut is ruim voor iemand die zich vertikt.
  if (teVeelPogingen("eventtoegang", bezoekerIp(request), 10)) {
    return Response.json(
      { ok: false, reden: "te-veel" },
      { status: 429 }
    )
  }

  const body = (await request.json().catch(() => null)) as
    | { slug?: unknown; antwoord?: unknown }
    | null

  if (!body || typeof body.slug !== "string" || typeof body.antwoord !== "string") {
    return Response.json({ ok: false }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: event } = await service
    .from("events")
    .select("pw_enabled, pw_type, pw_value, pw_answer")
    .eq("slug", body.slug.slice(0, 200))
    .eq("status", "published")
    .single()

  // Bestaat niet, of heeft geen slot: dan valt er niets te openen. Bewust geen
  // verschil in het antwoord tussen "bestaat niet" en "fout", zodat deze
  // route niet verklapt welke sites een slot hebben.
  if (!event || !event.pw_enabled) return Response.json({ ok: false })

  const poging = body.antwoord.trim().slice(0, 200)
  const goed =
    event.pw_type === "password"
      ? poging === ((event.pw_value as string | null) ?? "")
      : fuzzyMatch(poging, (event.pw_answer as string | null) ?? "")

  return Response.json({ ok: goed })
}
