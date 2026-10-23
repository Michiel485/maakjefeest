// Factuurnummers komen uit één teller in de database (sequence
// factuurnummer_seq, zie supabase/2026-10-23-factuurnummer-sequence.sql).
//
// Voorheen telde elke route zelf de facturen van dit jaar en deed er één bij.
// Twee betalingen in dezelfde seconde kregen zo hetzelfde nummer, en na het
// verwijderen van een factuur werd een nummer opnieuw uitgegeven. Een teller in
// de database geeft elk nummer precies één keer uit, ook als twee webhooks
// tegelijk binnenkomen.

import type { SupabaseClient } from "@supabase/supabase-js"
import { meldFout } from "./foutmelding"

/**
 * Het volgende factuurnummer, in de vorm SY-2026-007.
 *
 * Is de migratie nog niet gedraaid, dan valt dit terug op de oude telling,
 * zodat een betaling nooit zonder factuur blijft. Dat staat dan in het log en
 * in een stille foutmelding.
 */
export async function volgendFactuurnummer(service: SupabaseClient, now: Date = new Date()): Promise<string> {
  const { data, error } = await service.rpc("volgend_factuurnummer")
  if (!error && typeof data === "string" && data) return data

  console.warn("[factuur] volgend_factuurnummer mislukt, terugval op telling - migratie nog niet gedraaid?", error)
  await meldFout({ soort: "stil", waar: "factuur: nummer uit de database", fout: error ?? "leeg antwoord" })

  const year = now.getFullYear()
  const { count } = await service
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
  return `SY-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`
}
