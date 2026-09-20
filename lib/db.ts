// ── Database en cache: de twee dingen die samen bepalen of een klantsite
//    blijft staan als Supabase er even uit ligt ───────────────────────────────

import { revalidatePath } from "next/cache"
import type { PostgrestSingleResponse } from "@supabase/supabase-js"
import { createServiceClient } from "./supabase"

// PostgREST-code voor "de query gaf geen rij terug". Dat is een normaal
// resultaat van .single(), geen storing.
const GEEN_RIJ = "PGRST116"

/**
 * Eén rij uit een .single(): null als hij niet bestaat, een fout als de
 * database niet antwoordde.
 *
 * Zonder dit onderscheid is `const { data } = await ...` gevolgd door
 * `if (!data) notFound()` gevaarlijk: bij een storing bij Supabase krijgt elke
 * bezoeker van een klantsite dan "deze pagina bestaat niet", precies op het
 * moment dat de gasten de uitnodiging openen. Een fout gooien is beter, want
 * dan houdt Next de vorige versie uit de cache in de lucht (stale-while-
 * revalidate) en zien bezoekers de site gewoon.
 */
export function rijOfNiets<T>(result: PostgrestSingleResponse<T>, wat: string): T | null {
  const { data, error } = result
  if (!error) return data ?? null
  if (error.code === GEEN_RIJ) return null
  throw new Error(`${wat} ophalen mislukt: ${error.message ?? "onbekende fout"}`)
}

/**
 * Alles opnieuw laten renderen wat van één event afhangt: de site zelf en elke
 * kaartlink die eraan hangt.
 *
 * De kaartpagina is gecached, dus zonder deze aanroep kan een gast na het
 * activeren nog een minuut "deze kaart is nog niet verstuurd" zien. Aan te
 * roepen na elke wijziging van status of pakket.
 */
export async function verversEvent(slug: string | null | undefined) {
  if (!slug) return
  revalidatePath(`/events/${slug}`, "layout")

  try {
    const service = createServiceClient()
    const { data: event } = await service.from("events").select("id").eq("slug", slug).single()
    if (!event) return
    const { data: cards } = await service.from("cards").select("share_token").eq("event_id", event.id)
    for (const card of cards ?? []) revalidatePath(`/kaart/${card.share_token}`)
  } catch (e) {
    // Een mislukte verversing mag een betaling of activering niet laten
    // klappen; de cache loopt dan maximaal een minuut achter.
    console.error("[verversEvent] kaarten verversen mislukt:", e)
  }
}

/** Eén kaartlink opnieuw laten renderen, na een wijziging in de bouwer. */
export async function verversKaart(shareToken: string | null | undefined) {
  if (!shareToken) return
  revalidatePath(`/kaart/${shareToken}`)
}
