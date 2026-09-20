import { createServiceClient } from "@/lib/supabase"
import { verwijderEventInhoud } from "@/lib/opruimen"
import { sendDraftReminderEmail, sendRenewalReminderEmail, sendExpiryWarningEmail } from "@/lib/mail"
import { verversEvent } from "@/lib/db"
import { sendVisitorDigest } from "@/lib/visitors"
import { PLAN_MAIL, bewaarschema, normalizePlan, renewalAllowed } from "@/lib/plans"

// Vercel Cron calls this endpoint daily at 09:00 AM Europe/Amsterdam.
// Security: Vercel sets Authorization: Bearer <CRON_SECRET> automatically.
export const dynamic = "force-dynamic"

const DAG_MS           = 24 * 60 * 60 * 1000
const SEVEN_DAYS_MS    = 7  * 24 * 60 * 60 * 1000
const ELEVEN_MONTHS_MS = 335 * 24 * 60 * 60 * 1000 // ~11 months

export async function GET(request: Request) {
  // ── Auth: only Vercel cron (or manual calls with the secret) ──────────────
  const authHeader = request.headers.get("authorization")
  const expectedToken = process.env.CRON_SECRET
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    console.warn("[cron/cleanup] Unauthorized request")
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()

  const results = {
    // Per concept welke herinnering eruit ging, bijvoorbeeld "abc123:2"
    reminders:        [] as string[],
    deleted:          [] as string[],
    fotosVerwijderd:  0,
    renewalReminders: [] as string[],
    expiryWarnings:   [] as string[],
    expired:          [] as string[],
    errors:           [] as string[],
    visitorDigest:    "" as string,
  }

  // ── Fetch all draft events ─────────────────────────────────────────────────
  // SAFETY: we explicitly filter status = 'draft'.
  // Published events are NEVER touched by this cron.
  const { data: drafts, error: fetchErr } = await service
    .from("events")
    .select("id, title, user_email, slug, status, plan, created_at, last_active_at, hero_image_url, draft_reminder_stap")
    .eq("status", "draft")

  if (fetchErr) {
    console.error("[cron/cleanup] Failed to fetch drafts:", fetchErr)
    return Response.json({ error: fetchErr.message }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sayingyes.nl"

  for (const draft of drafts ?? []) {
    // PARANOIA CHECK: skip anything that is not strictly 'draft'
    if (draft.status !== "draft") {
      console.error("[cron/cleanup] SAFETY SKIP — unexpected status:", draft.id, draft.status)
      results.errors.push(`safety-skip:${draft.id}`)
      continue
    }

    const createdAt     = new Date(draft.created_at)
    const lastActiveAt  = draft.last_active_at ? new Date(draft.last_active_at) : createdAt
    const inactiveDagen = (now.getTime() - lastActiveAt.getTime()) / DAG_MS
    const email         = draft.user_email as string
    const plan          = normalizePlan(draft.plan)
    const schema        = bewaarschema(plan)
    const builderUrl    = `${siteUrl}${PLAN_MAIL[plan].bouwerPad}?event_id=${draft.id}`

    // ── Verwijderen na de bewaartermijn ─────────────────────────────────────
    if (inactiveDagen >= schema.verwijderNa) {
      // Triple-check before deleting
      const { data: check } = await service
        .from("events")
        .select("id, status")
        .eq("id", draft.id)
        .single()

      if (!check || check.status !== "draft") {
        console.error("[cron/cleanup] ABORT DELETE — status is not draft:", draft.id, check?.status)
        results.errors.push(`abort-delete:${draft.id}`)
        continue
      }

      // Geüploade foto's van dit concept horen ook weg. Zonder dit blijven ze
      // voor altijd in de opslag staan, terwijl de kaart er niet meer is.
      const verwijderdeFotos = await verwijderEventInhoud(
        service,
        draft.id,
        draft.hero_image_url as string | null
      )
      if (verwijderdeFotos > 0) results.fotosVerwijderd += verwijderdeFotos

      const { error: delErr } = await service
        .from("events")
        .delete()
        .eq("id", draft.id)
        .eq("status", "draft") // belt-and-suspenders: status must still be 'draft'

      if (delErr) {
        console.error("[cron/cleanup] Delete failed:", draft.id, delErr)
        results.errors.push(`delete-fail:${draft.id}`)
      } else {
        console.log("[cron/cleanup] Deleted inactive draft:", draft.id, email, plan)
        results.deleted.push(draft.id)
      }
      continue
    }

    // ── Herinneringen ───────────────────────────────────────────────────────
    // draft_reminder_stap is het aantal herinneringen dat al verstuurd is. We
    // pakken de laatste waar de termijn voor verstreken is en slaan de eerdere
    // over: iemand die pas na drie maanden terugkomt hoeft niet eerst de
    // vriendelijke eerste nudge te krijgen en daarna de aankondiging.
    const alGehad = (draft.draft_reminder_stap as number | null) ?? 0
    let teVersturen = -1
    for (let i = schema.herinneringen.length - 1; i >= alGehad; i--) {
      if (inactiveDagen >= schema.herinneringen[i].naDagen) {
        teVersturen = i
        break
      }
    }
    if (teVersturen < 0) continue

    const variant = schema.herinneringen[teVersturen].variant
    const mailResult = await sendDraftReminderEmail({
      toEmail: email,
      eventTitle: (draft.title as string) || "jullie bruiloft",
      builderUrl,
      reminderNumber: teVersturen + 1,
      plan,
      variant,
      dagenTotVerwijderen: Math.max(1, Math.round(schema.verwijderNa - inactiveDagen)),
    })

    if (!mailResult.success) {
      results.errors.push(`reminder${teVersturen + 1}-fail:${draft.id}`)
      continue
    }

    // De overgeslagen herinneringen tellen als gehad
    await service
      .from("events")
      .update({ draft_reminder_stap: teVersturen + 1 })
      .eq("id", draft.id)
      .eq("status", "draft")
    results.reminders.push(`${draft.id}:${teVersturen + 1}:${variant}`)
  }

  // ── Published events: subscription expiry ─────────────────────────────────
  const { data: published } = await service
    .from("events")
    .select("id, title, user_email, slug, plan, expires_at, published_at, renewal_reminder_sent_at, expiry_warning_sent_at")
    .eq("status", "published")
    .not("expires_at", "is", null)

  const dashboardUrl = `${siteUrl}/dashboard`

  for (const event of published ?? []) {
    // Kaartpakketten hebben geen einddatum: de kaartlink blijft werken en er
    // gaat niets offline, dus geen verloopmails en geen status expired.
    if (!renewalAllowed(event.plan)) continue

    const expiresAt   = new Date(event.expires_at as string)
    const publishedAt = new Date(event.published_at as string)
    const email       = event.user_email as string
    const title       = (event.title as string) || "jullie website"
    const timeToExpiry = expiresAt.getTime() - now.getTime()
    const timeSincePublished = now.getTime() - publishedAt.getTime()

    // ── Offline zetten na verloopdatum ────────────────────────────────────
    if (timeToExpiry <= 0) {
      await service
        .from("events")
        .update({ status: "expired" })
        .eq("id", event.id)
        .eq("status", "published")
      await verversEvent(event.slug as string | null)
      results.expired.push(event.id as string)
      continue
    }

    // ── Verloopwaarschuwing: 7 dagen voor verloopdatum ───────────────────
    if (timeToExpiry <= SEVEN_DAYS_MS && !event.expiry_warning_sent_at) {
      const mailResult = await sendExpiryWarningEmail({ toEmail: email, eventTitle: title, expiresAt, dashboardUrl })
      if (mailResult.success) {
        await service.from("events").update({ expiry_warning_sent_at: now.toISOString() }).eq("id", event.id)
        results.expiryWarnings.push(event.id as string)
      } else {
        results.errors.push(`expiry-warning-fail:${event.id}`)
      }
      continue
    }

    // ── Verlengherinnering: na 11 maanden live ───────────────────────────
    if (timeSincePublished >= ELEVEN_MONTHS_MS && !event.renewal_reminder_sent_at) {
      const mailResult = await sendRenewalReminderEmail({ toEmail: email, eventTitle: title, expiresAt, dashboardUrl })
      if (mailResult.success) {
        await service.from("events").update({ renewal_reminder_sent_at: now.toISOString() }).eq("id", event.id)
        results.renewalReminders.push(event.id as string)
      } else {
        results.errors.push(`renewal-reminder-fail:${event.id}`)
      }
    }
  }

  // ── Bezoekersoverzicht van de afgelopen 24 uur naar de eigenaar (+ opruimen >90 dagen) ──
  results.visitorDigest = await sendVisitorDigest(service, now)

  console.log("[cron/cleanup] Done:", results)
  return Response.json({ ok: true, ...results })
}
