import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { MAX_LOCATIE_NAAM, leesDeadline } from "@/lib/deadline"

export const dynamic = "force-dynamic"

// De instellingen van één bruiloft: de deadline voor de aantallen bij de
// locatie, en hoe vaak de klant een tussenstand wil horen.
//
// Eén endpoint voor beide, want het zijn allebei antwoorden op de vraag "hoe
// wil je dat wij je helpen". Twee endpoints voor twee velden is werk zonder
// opbrengst.

const FREQUENTIES = ["nooit", "dagelijks", "wekelijks", "maandelijks"]

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as
    | {
        event_id?: unknown
        /** De deadline zetten of wijzigen. */
        deadline?: { naam?: unknown; datum?: unknown } | null
        /** De klant zegt dat de aantallen doorgegeven zijn. */
        gedaan?: unknown
        /** Hoe vaak een tussenstand. */
        stand_frequentie?: unknown
      }
    | null

  const event_id = typeof body?.event_id === "string" ? body.event_id.slice(0, 64) : null
  if (!event_id) return Response.json({ error: "event_id is verplicht" }, { status: 400 })

  const service = createServiceClient()
  const { data: event } = await service
    .from("events")
    .select("id, user_email, deadline")
    .eq("id", event_id)
    .single()

  if (!event) return Response.json({ error: "Bruiloft niet gevonden" }, { status: 404 })
  if (event.user_email !== user.email) return Response.json({ error: "Geen toegang" }, { status: 403 })

  const update: Record<string, unknown> = {}

  // ── De deadline ───────────────────────────────────────────────────────────
  if (body?.deadline !== undefined) {
    if (body.deadline === null) {
      update.deadline = null
    } else {
      const naam =
        typeof body.deadline.naam === "string" && body.deadline.naam.trim()
          ? body.deadline.naam.trim().slice(0, MAX_LOCATIE_NAAM)
          : null
      const datum = typeof body.deadline.datum === "string" ? body.deadline.datum.slice(0, 10) : null
      if (!datum || Number.isNaN(new Date(datum).getTime())) {
        return Response.json({ error: "Vul een geldige datum in." }, { status: 400 })
      }

      // Een nieuwe datum betekent nieuwe berichten. Verzet iemand zijn deadline
      // naar later, dan hoort de herinnering opnieuw af te gaan; anders zou een
      // eenmaal verstuurd bericht hem voorgoed het zwijgen opleggen.
      const oud = leesDeadline(event.deadline)
      const verzet = oud.datum !== datum
      update.deadline = {
        naam,
        datum,
        gedaan: verzet ? false : oud.gedaan,
        gemaild: verzet ? {} : oud.gemaild,
      }
    }
  }

  // ── Doorgegeven ───────────────────────────────────────────────────────────
  // Hierna zwijgen we voorgoed over deze deadline. Dat is de hele afspraak:
  // wij herinneren, de klant doet het, en dan houden we erover op.
  if (body?.gedaan !== undefined) {
    const oud = leesDeadline(update.deadline ?? event.deadline)
    if (!oud.datum) {
      return Response.json({ error: "Er staat nog geen deadline." }, { status: 400 })
    }
    update.deadline = { ...oud, gedaan: body.gedaan === true }
  }

  // ── Hoe vaak een tussenstand ──────────────────────────────────────────────
  if (body?.stand_frequentie !== undefined) {
    if (typeof body.stand_frequentie !== "string" || !FREQUENTIES.includes(body.stand_frequentie)) {
      return Response.json({ error: "Onbekende keuze" }, { status: 400 })
    }
    update.stand_frequentie = body.stand_frequentie
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Niets om bij te werken" }, { status: 400 })
  }

  const { error } = await service.from("events").update(update).eq("id", event_id)
  if (error) {
    console.error("[bruiloft] update:", error)
    return Response.json({ error: "Bijwerken mislukt" }, { status: 500 })
  }

  return Response.json({ success: true, ...update })
}
