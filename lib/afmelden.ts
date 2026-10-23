// Afmelden voor herinneringen (23 oktober 2026).
//
// De mails die niet over een betaling of een aanmelding gaan (concept-
// herinneringen, de week-voor- en dag-na-mail, de stand van de gastenlijst en
// het duwtje als niemand reageert) krijgen onderaan een afmeldlink. Die link
// werkt zonder inloggen, want de klant klikt hem vanuit zijn mail. Daarom zit
// er een handtekening aan vast, op dezelfde manier als bij de toegangscookie
// van een site met wachtwoord (lib/event-slot.ts): wie het event-id kent kan
// er zonder de handtekening niets mee.

import { MARKETING_URL } from "./site-url"

async function sleutel(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
}

/** De handtekening onder een afmeldlink voor dit event, als hex. */
export async function afmeldHandtekening(eventId: string): Promise<string> {
  const handtekening = await crypto.subtle.sign("HMAC", await sleutel(), new TextEncoder().encode(`afmelden|${eventId}`))
  return Array.from(new Uint8Array(handtekening), (b) => b.toString(16).padStart(2, "0")).join("")
}

/** De volledige afmeldlink, altijd op het echte domein omdat hij in een mail staat. */
export async function afmeldUrl(eventId: string): Promise<string> {
  const sig = await afmeldHandtekening(eventId)
  return `${MARKETING_URL}/api/mail/afmelden?event=${encodeURIComponent(eventId)}&sig=${sig}`
}

/** Klopt deze handtekening bij dit event? Vergelijkt zonder vroeg te stoppen. */
export async function afmeldHandtekeningKlopt(eventId: string, sig: string): Promise<boolean> {
  const goed = await afmeldHandtekening(eventId)
  if (goed.length !== sig.length) return false
  let verschil = 0
  for (let i = 0; i < goed.length; i++) verschil |= goed.charCodeAt(i) ^ sig.charCodeAt(i)
  return verschil === 0
}
