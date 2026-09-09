// Anonieme bezoekersstatistieken: helpers voor de track-route en het dagelijkse
// overzicht in de cron. Server-only (gebruikt node:crypto en Resend).

import { createHash } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { sendVisitorDigestEmail } from "./mail"

export const RETENTIE_DAGEN = 90

export function isBotUserAgent(ua: string): boolean {
  return /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|node-fetch|axios|monitor|uptime|semrush|ahrefs/i.test(ua)
}

export function deviceType(ua: string): "mobiel" | "tablet" | "desktop" {
  if (/ipad|tablet/i.test(ua)) return "tablet"
  if (/mobi|android|iphone/i.test(ua)) return "mobiel"
  return "desktop"
}

// Alleen de hostnaam van de verwijzer; eigen domeinen tellen als "intern"
export function referrerHost(ref: string | null): string {
  if (!ref) return "direct"
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "").toLowerCase()
    if (!h) return "direct"
    if (h.endsWith("sayingyes.nl") || h.endsWith("sayingyes.be")) return "intern"
    return h.slice(0, 120)
  } catch {
    return "direct"
  }
}

// Pad zonder query of hash, begrensd: voorkomt dat er tokens of namen uit de
// adresbalk in de statistiek belanden
export function cleanPath(p: string): string {
  const zonder = p.split(/[?#]/)[0].trim()
  const pad = zonder.startsWith("/") ? zonder : `/${zonder}`
  return pad.slice(0, 200)
}

// Dagelijks wisselende hash: unieke bezoekers per dag tellen zonder een IP op te
// slaan en zonder iemand over meerdere dagen te kunnen volgen
export function visitorHash(ip: string, ua: string, date = new Date()): string {
  const salt = process.env.TRACK_SALT ?? "sayingyes-bezoekers"
  const dag = date.toISOString().slice(0, 10)
  return createHash("sha256").update(`${salt}|${dag}|${ip}|${ua}`).digest("hex").slice(0, 32)
}

interface PageViewRow {
  path: string
  referrer_host: string | null
  country: string | null
  device: string | null
  visitor_hash: string
}

function tel(rows: PageViewRow[], key: keyof PageViewRow, max = 8): [string, number][] {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = (r[key] as string | null) ?? "onbekend"
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, max)
}

// Stuurt het overzicht van de afgelopen 24 uur naar de eigenaar en ruimt rijen
// ouder dan de retentietermijn op. Geeft een korte status terug voor de cron-log.
export async function sendVisitorDigest(service: SupabaseClient, now: Date): Promise<string> {
  const dag = 24 * 60 * 60 * 1000

  const { data, error } = await service
    .from("page_views")
    .select("path, referrer_host, country, device, visitor_hash")
    .gte("created_at", new Date(now.getTime() - dag).toISOString())

  // Tabel bestaat nog niet (migratie niet gedraaid) of ander probleem: stil
  // overslaan, de rest van de cron moet altijd blijven werken
  if (error) return `skipped:${error.message}`

  await service
    .from("page_views")
    .delete()
    .lt("created_at", new Date(now.getTime() - RETENTIE_DAGEN * dag).toISOString())

  const rows = (data ?? []) as PageViewRow[]
  if (rows.length === 0) return "none"

  const toEmail = process.env.ADMIN_EMAIL
  if (!toEmail) return "skipped:no-admin-email"

  const result = await sendVisitorDigestEmail({
    toEmail,
    pageviews: rows.length,
    visitors: new Set(rows.map((r) => r.visitor_hash)).size,
    topPages: tel(rows, "path"),
    referrers: tel(rows, "referrer_host"),
    countries: tel(rows, "country"),
    devices: tel(rows, "device"),
  })
  return result.success ? "sent" : "error"
}
