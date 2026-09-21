import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import {
  CHECKLIST,
  MAX_EIGEN_PUNTEN,
  MAX_PUNT_TEKST,
  leesStand,
  type ChecklistFase,
  type ChecklistStand,
  type EigenPunt,
} from "@/lib/checklist"

export const dynamic = "force-dynamic"

// De checklist bijwerken: een punt aan- of uitvinken, of een eigen punt
// toevoegen of weghalen.
//
// Punten die wij zelf weten staan hier niet in. Een Save the Date die
// verstuurd is, is verstuurd, en dat vinkje kan de klant dus niet uitzetten.
// Dat is geen beperking maar de bedoeling: de lijst liegt liever niet.

const FASEN: ChecklistFase[] = [
  "voorbereiden",
  "save_the_date",
  "uitnodigen",
  "najagen",
  "aftellen",
  "na_de_dag",
]

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as
    | {
        event_id?: unknown
        /** Een van onze punten aan- of uitvinken. */
        punt?: unknown
        af?: unknown
        /** Een eigen punt toevoegen. */
        nieuw?: { wat?: unknown; fase?: unknown }
        /** Een eigen punt weghalen. */
        weg?: unknown
      }
    | null

  const event_id = typeof body?.event_id === "string" ? body.event_id.slice(0, 64) : null
  if (!event_id) return Response.json({ error: "event_id is verplicht" }, { status: 400 })

  const service = createServiceClient()
  const { data: event } = await service
    .from("events")
    .select("id, user_email, checklist")
    .eq("id", event_id)
    .single()

  if (!event) return Response.json({ error: "Bruiloft niet gevonden" }, { status: 404 })
  if (event.user_email !== user.email) return Response.json({ error: "Geen toegang" }, { status: 403 })

  const stand = leesStand(event.checklist)
  const af = new Set(stand.af ?? [])
  let eigen: EigenPunt[] = stand.eigen ?? []

  // ── Een van onze punten ───────────────────────────────────────────────────
  if (typeof body?.punt === "string") {
    const bestaat = CHECKLIST.some((p) => p.id === body.punt)
    const eigenPunt = eigen.find((p) => p.id === body.punt)

    if (bestaat) {
      if (body.af === true) af.add(body.punt)
      else af.delete(body.punt)
    } else if (eigenPunt) {
      eigen = eigen.map((p) => (p.id === body.punt ? { ...p, af: body.af === true } : p))
    } else {
      return Response.json({ error: "Dit punt bestaat niet" }, { status: 400 })
    }
  }

  // ── Een eigen punt erbij ──────────────────────────────────────────────────
  if (body?.nieuw) {
    const wat = typeof body.nieuw.wat === "string" ? body.nieuw.wat.trim().slice(0, MAX_PUNT_TEKST) : ""
    if (!wat) return Response.json({ error: "Schrijf op wat je wilt onthouden." }, { status: 400 })
    if (eigen.length >= MAX_EIGEN_PUNTEN) {
      return Response.json(
        { error: `Je kunt maximaal ${MAX_EIGEN_PUNTEN} eigen punten toevoegen.` },
        { status: 400 }
      )
    }
    const fase = FASEN.includes(body.nieuw.fase as ChecklistFase)
      ? (body.nieuw.fase as ChecklistFase)
      : "voorbereiden"
    eigen = [...eigen, { id: crypto.randomUUID(), wat, fase, af: false }]
  }

  // ── Een eigen punt eruit ──────────────────────────────────────────────────
  // Alleen eigen punten, want onze punten zijn de lijst zelf. Wie er een niet
  // nodig heeft, vinkt hem af.
  if (typeof body?.weg === "string") {
    eigen = eigen.filter((p) => p.id !== body.weg)
  }

  const nieuweStand: ChecklistStand = { af: [...af], eigen }
  const { error } = await service
    .from("events")
    .update({ checklist: nieuweStand })
    .eq("id", event_id)

  if (error) {
    console.error("[checklist] update:", error)
    return Response.json({ error: "Bijwerken mislukt" }, { status: 500 })
  }

  return Response.json({ success: true, checklist: nieuweStand })
}
