// Het slot van een klantsite, op de server (28 september 2026).
//
// Eerst verstopte de browser de site achter het wachtwoordscherm, maar de
// inhoud zelf werd gewoon meegestuurd: wie de broncode bekeek, zag namen,
// adressen en het programma. Nu stuurt de server een beveiligde site pas als
// de bezoeker een geldige toegangscookie heeft. Zonder cookie krijgt hij
// alleen het slot te zien (app/toegang/[slug]).
//
// De cookie is een handtekening over de slug en het huidige wachtwoord of
// antwoord. Verandert het bruidspaar het wachtwoord, dan werkt een oude
// cookie dus niet meer. Namaken kan niet zonder de sleutel van de server.

import { createServiceClient } from "./supabase"

export const toegangCookie = (slug: string) => `sy_toegang_${slug}`

/** Een maand: een gast hoeft niet bij elk bezoek opnieuw het wachtwoord te typen */
export const TOEGANG_DUUR = 60 * 60 * 24 * 30

interface SlotRij {
  pw_enabled: boolean | null
  pw_type: string | null
  pw_value: string | null
  pw_answer: string | null
}

/** Waar de cookie aan vastzit: het soort slot en het wachtwoord of antwoord */
export function slotGeheim(rij: SlotRij): string | null {
  if (!rij.pw_enabled) return null
  return rij.pw_type === "password" ? `w|${rij.pw_value ?? ""}` : `v|${(rij.pw_answer ?? "").trim().toLowerCase()}`
}

export async function toegangSleutel(slug: string, geheim: string): Promise<string> {
  const sleutel = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const handtekening = await crypto.subtle.sign("HMAC", sleutel, new TextEncoder().encode(`toegang|${slug}|${geheim}`))
  return Array.from(new Uint8Array(handtekening), (b) => b.toString(16).padStart(2, "0")).join("")
}

// Welke sites een slot hebben, even onthouden: anders vraagt elke
// paginaweergave van elke klantsite het aan de database
const onthouden = new Map<string, { geheim: string | null; tot: number }>()
const ONTHOUD_MS = 30_000

/**
 * Het geheim van het slot van deze site, of null als hij geen slot heeft (of
 * niet bestaat). Gooit bij een databasefout: dan laten we niemand zomaar door.
 */
export async function slotVan(slug: string): Promise<string | null> {
  const nu = Date.now()
  const bekend = onthouden.get(slug)
  if (bekend && bekend.tot > nu) return bekend.geheim
  const { data, error } = await createServiceClient()
    .from("events")
    .select("pw_enabled, pw_type, pw_value, pw_answer")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()
  if (error) throw error
  const geheim = data ? slotGeheim(data as SlotRij) : null
  if (onthouden.size > 2000) onthouden.clear()
  onthouden.set(slug, { geheim, tot: nu + ONTHOUD_MS })
  return geheim
}

/** Vergelijkt zonder vroeg te stoppen, zodat de tijd niets verraadt */
export function gelijk(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let verschil = 0
  for (let i = 0; i < a.length; i++) verschil |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return verschil === 0
}
