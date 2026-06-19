import { createServiceClient } from "@/lib/supabase"
import { sendDraftReminderEmail, sendRenewalReminderEmail, sendExpiryWarningEmail } from "@/lib/mail"
import { revalidatePath } from "next/cache"

// Vercel Cron calls this endpoint daily at 09:00 AM Europe/Amsterdam.
// Security: Vercel sets Authorization: Bearer <CRON_SECRET> automatically.
export const dynamic = "force-dynamic"

const SEVEN_DAYS_MS    = 7  * 24 * 60 * 60 * 1000
const SEVEN_WEEKS_MS   = 49 * 24 * 60 * 60 * 1000
const EIGHT_WEEKS_MS   = 56 * 24 * 60 * 60 * 1000
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
    reminder1Sent:    [] as string[],
    reminder2Sent:    [] as string[],
    deleted:          [] as string[],
    renewalReminders: [] as string[],
    expiryWarnings:   [] as string[],
    expired:          [] as string[],
    errors:           [] as string[],
  }

  // ── Fetch all draft events ─────────────────────────────────────────────────
  // SAFETY: we explicitly filter status = 'draft'.
  // Published events are NEVER touched by this cron.
  const { data: drafts, error: fetchErr } = await service
    .from("events")
    .select("id, title, user_email, slug, status, created_at, last_active_at, draft_reminder_1_sent_at, draft_reminder_2_sent_at")
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
    const ageMs         = now.getTime() - createdAt.getTime()
    const inactiveMs    = now.getTime() - lastActiveAt.getTime()
    const email         = draft.user_email as string
    const builderUrl    = `${siteUrl}/bouwen?event_id=${draft.id}`

    // ── Delete after 8 weeks of inactivity ──────────────────────────────────
    if (inactiveMs >= EIGHT_WEEKS_MS) {
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

      // Delete pages first (FK safety, even if cascade is set)
      await service.from("pages").delete().eq("event_id", draft.id)

      const { error: delErr } = await service
        .from("events")
        .delete()
        .eq("id", draft.id)
        .eq("status", "draft") // belt-and-suspenders: status must still be 'draft'

      if (delErr) {
        console.error("[cron/cleanup] Delete failed:", draft.id, delErr)
        results.errors.push(`delete-fail:${draft.id}`)
      } else {
        console.log("[cron/cleanup] Deleted inactive draft:", draft.id, email)
        results.deleted.push(draft.id)
      }
      continue
    }

    // ── 2nd reminder: 7 weeks old, not yet sent ──────────────────────────────
    if (ageMs >= SEVEN_WEEKS_MS && !draft.draft_reminder_2_sent_at) {
      const mailResult = await sendDraftReminderEmail({
        toEmail: email,
        eventTitle: (draft.title as string) || "jullie evenement",
        builderUrl,
        reminderNumber: 2,
      })
      if (mailResult.success) {
        await service
          .from("events")
          .update({ draft_reminder_2_sent_at: now.toISOString() })
          .eq("id", draft.id)
          .eq("status", "draft")
        results.reminder2Sent.push(draft.id)
      } else {
        results.errors.push(`reminder2-fail:${draft.id}`)
      }
      continue
    }

    // ── 1st reminder: 7 days old, not yet sent ───────────────────────────────
    if (ageMs >= SEVEN_DAYS_MS && !draft.draft_reminder_1_sent_at) {
      const mailResult = await sendDraftReminderEmail({
        toEmail: email,
        eventTitle: (draft.title as string) || "jullie evenement",
        builderUrl,
        reminderNumber: 1,
      })
      if (mailResult.success) {
        await service
          .from("events")
          .update({ draft_reminder_1_sent_at: now.toISOString() })
          .eq("id", draft.id)
          .eq("status", "draft")
        results.reminder1Sent.push(draft.id)
      } else {
        results.errors.push(`reminder1-fail:${draft.id}`)
      }
    }
  }

  // ── Published events: subscription expiry ─────────────────────────────────
  const { data: published } = await service
    .from("events")
    .select("id, title, user_email, slug, expires_at, published_at, renewal_reminder_sent_at, expiry_warning_sent_at")
    .eq("status", "published")
    .not("expires_at", "is", null)

  const dashboardUrl = `${siteUrl}/dashboard`

  for (const event of published ?? []) {
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
      revalidatePath(`/events/${event.slug}`, "layout")
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

  console.log("[cron/cleanup] Done:", results)
  return Response.json({ ok: true, ...results })
}
