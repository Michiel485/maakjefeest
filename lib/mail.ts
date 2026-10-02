import { Resend } from "resend"
import { PLANS, RENEWAL_MONTHS, RENEWAL_PRICE, draftReminderTekst, isCardPlan, type DraftVariant, type Plan } from "./plans"
import { deadlineTekst, type DeadlineMoment } from "./deadline"
import { standAdvies, standKop, type StandCijfers } from "./stand"
import type { SC } from "./event-styles"
import {
  SAYINGYES,
  GOUD,
  alinea,
  bruiloftGezicht,
  cijfers,
  knop,
  knoppen,
  kopje,
  omlijsting,
  stappen,
  veilig,
  vinkjes,
  vlak,
  type Gezicht,
} from "./mail-sjabloon"

// Alle mails. De vorm staat in lib/mail-sjabloon.ts (één sjabloon, twee
// gezichten); hier staan alleen de woorden en de knoppen per mail.

const FROM = "SayingYes <info@sayingyes.nl>"

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set")
  return new Resend(process.env.RESEND_API_KEY)
}

type Bijlage = { filename: string; content: Buffer | string }

/** Versturen en loggen, voor elke mail hetzelfde. */
async function verstuur(
  wat: string,
  bericht: { to: string | string[]; subject: string; html: string; replyTo?: string | null; from?: string; attachments?: Bijlage[] }
) {
  try {
    const { data: result, error } = await getResend().emails.send({
      from: bericht.from ?? FROM,
      to: Array.isArray(bericht.to) ? bericht.to : [bericht.to],
      subject: bericht.subject,
      html: bericht.html,
      ...(bericht.replyTo ? { replyTo: bericht.replyTo } : {}),
      ...(bericht.attachments?.length ? { attachments: bericht.attachments } : {}),
    })
    if (error) {
      console.error(`[mail] ${wat} error:`, error)
      return { success: false as const, error }
    }
    console.log(`[mail] ${wat} sent →`, bericht.to, "| id:", result?.id)
    return { success: true as const, id: result?.id }
  } catch (err) {
    console.error(`[mail] Unexpected error sending ${wat}:`, err)
    return { success: false as const, error: err }
  }
}

/**
 * Wat een mail aan een gast nodig heeft om het gezicht van de bruiloft te
 * dragen: de kleuren van de site en de namen van het bruidspaar. Antwoorden
 * komt bij het bruidspaar terecht, niet bij ons.
 */
export interface BruiloftMail {
  namen: string
  sc: Pick<SC, "accent" | "navBg" | "headingColor" | "buttonBg" | "buttonText" | "bodyBg">
  /** Het mailadres van het bruidspaar, voor antwoorden */
  replyTo?: string | null
  datumTekst?: string | null
  locatie?: string | null
  /** De site, als die er is en live staat */
  siteUrl?: string | null
  /** De kaart waarop de gast antwoordde */
  kaartUrl?: string | null
  /** Een agendabestand (lib/agenda.ts), als bijlage */
  ics?: string | null
}

function routeLink(locatie: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locatie)}`
}

// ── Bevestiging aan de gast ───────────────────────────────────────────────────

export interface RSVPGuest {
  name: string
  attending: string
  guest_type?: string | null
  dietary?: string | null
  song?: string | null
  overnachting?: boolean | null
  message?: string | null
}

export interface RSVPConfirmationData {
  toEmail: string
  primaryName: string
  eventTitle: string
  guests: RSVPGuest[]
  /** Het gezicht van de bruiloft; zonder dit de huisstijl van SayingYes */
  bruiloft?: BruiloftMail | null
  /** Een voorlopig ja of nee op een Save the Date: kort en zonder tabel */
  voorlopig?: boolean
}

export async function sendRSVPConfirmation(data: RSVPConfirmationData) {
  const { toEmail, primaryName, eventTitle, guests, bruiloft, voorlopig = false } = data
  const g: Gezicht = bruiloft ? bruiloftGezicht(bruiloft.sc, bruiloft.namen) : SAYINGYES
  const naam = veilig(primaryName.split(" ")[0] || primaryName)
  const komen = guests.filter((x) => x.attending !== "no")
  const afmelding = komen.length === 0
  const wie = bruiloft?.namen ?? eventTitle

  const kop = afmelding
    ? `Bedankt, ${naam}`
    : bruiloft?.datumTekst
      ? `Tot ${bruiloft.datumTekst}, ${naam}!`
      : `Tot dan, ${naam}!`

  const regels = guests
    .map((x) => {
      const extra = [
        x.dietary ? `dieet: ${veilig(x.dietary)}` : null,
        x.overnachting === true ? "blijft slapen" : null,
        x.overnachting === false ? "blijft niet slapen" : null,
        x.song ? `liedje: ${veilig(x.song)}` : null,
      ].filter(Boolean)
      return `<tr>
        <td style="padding:9px 14px;border-bottom:1px solid #F0EDE8;font-weight:600;color:#1A1A1A;">${veilig(x.name)}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #F0EDE8;color:#5C5248;">${x.attending === "no" ? "komt niet" : "komt"}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #F0EDE8;color:#9A8E82;font-size:13px;">${extra.join(" &middot; ")}</td>
      </tr>`
    })
    .join("")

  const bericht = guests[0]?.message
    ? `<div style="margin:0 0 20px;padding:14px 18px;background:#FAF7F2;border-left:3px solid ${g.accent};border-radius:0 8px 8px 0;color:#5C5248;font-style:italic;font-size:14px;line-height:1.6;">&ldquo;${veilig(guests[0].message)}&rdquo;</div>`
    : ""

  const praktisch = bruiloft && (bruiloft.datumTekst || bruiloft.locatie)
    ? vlak(
        `${kopje("De dag", g)}
         ${bruiloft.datumTekst ? `<p style="margin:0 0 4px;font-size:15px;color:#1A1A1A;"><strong>${veilig(bruiloft.datumTekst)}</strong></p>` : ""}
         ${bruiloft.locatie ? `<p style="margin:0;font-size:14px;color:#5C5248;">${veilig(bruiloft.locatie)} &nbsp;<a href="${routeLink(bruiloft.locatie)}" style="color:${g.accent};font-weight:600;text-decoration:none;">Route &rarr;</a></p>` : ""}`
      )
    : ""

  const inhoud = afmelding
    ? `${alinea(`We hebben genoteerd dat je er niet bij kunt zijn. Jammer, maar fijn dat je het laat weten.`)}
       ${bericht}
       ${bruiloft?.kaartUrl || bruiloft?.siteUrl ? knoppen(knop(bruiloft.kaartUrl ?? bruiloft.siteUrl!, "Toch iets aanpassen", g, true)) : ""}`
    : voorlopig
      ? `${alinea(`Fijn dat je het alvast laat weten. De officiële uitnodiging volgt nog; dan vragen we ook naar de rest.`)}
         ${praktisch}
         ${knoppen(...[bruiloft?.ics ? knop(bruiloft.kaartUrl ?? bruiloft.siteUrl ?? "#", "Open de kaart", g, true) : null].filter(Boolean) as string[])}`
      : `${alinea(`We hebben jullie genoteerd${komen.length > 1 ? ` met ${komen.length} personen` : ""}. ${bruiloft ? "We kijken ernaar uit je te zien." : `Je aanmelding voor <strong>${veilig(eventTitle)}</strong> is bevestigd.`}`)}
         ${praktisch}
         <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #EDE9E3;margin:0 0 20px;"><tbody>${regels}</tbody></table>
         ${bericht}
         ${knoppen(...[
           bruiloft?.siteUrl ? knop(bruiloft.siteUrl, "Bekijk de website", g) : null,
           bruiloft?.kaartUrl ?? bruiloft?.siteUrl ? knop(bruiloft.kaartUrl ?? bruiloft.siteUrl!, "Mijn antwoord aanpassen", g, true) : null,
         ].filter(Boolean) as string[])}`

  const html = omlijsting({
    gezicht: g,
    kop,
    subkop: bruiloft ? undefined : veilig(eventTitle),
    inhoud,
    afzender: bruiloft ? `Liefs,<br><strong style="color:#1A1A1A;">${veilig(bruiloft.namen)}</strong>` : null,
    voetExtra: bruiloft?.ics ? "De trouwdag zit als agendabestand bij deze mail." : "Vragen? Antwoord op deze mail, dan komt het bij het bruidspaar terecht.",
  })

  return verstuur("RSVP confirmation", {
    to: toEmail,
    from: bruiloft ? `${bruiloft.namen.replace(/[<>"]/g, "")} via SayingYes <info@sayingyes.nl>` : FROM,
    replyTo: bruiloft?.replyTo ?? null,
    subject: afmelding
      ? `${wie}: je afmelding is ontvangen`
      : voorlopig
        ? `${wie}: fijn dat je het laat weten`
        : `${wie}: tot ${bruiloft?.datumTekst ?? "dan"}!`,
    html,
    attachments: bruiloft?.ics ? [{ filename: "bruiloft.ics", content: bruiloft.ics }] : undefined,
  })
}

// ── Nieuwe aanmelding, naar het bruidspaar ───────────────────────────────────

export interface AdminRSVPNotificationData {
  toEmail: string
  eventTitle: string
  primaryName: string
  guests: RSVPGuest[]
  dashboardUrl?: string
}

export async function sendAdminRSVPNotification(data: AdminRSVPNotificationData) {
  const { toEmail, eventTitle, primaryName, guests } = data
  const dashboardUrl = data.dashboardUrl ?? "https://www.sayingyes.nl/dashboard#gasten"
  const komen = guests.filter((x) => x.attending !== "no").length
  const nietKomen = guests.filter((x) => x.attending === "no").length
  const afmelding = komen === 0

  const regels = guests
    .map((x) => {
      const extra = [
        x.dietary ? `dieet: ${veilig(x.dietary)}` : null,
        x.overnachting === true ? "blijft slapen" : null,
        x.overnachting === false ? "blijft niet slapen" : null,
        x.song ? `liedje: ${veilig(x.song)}` : null,
      ].filter(Boolean)
      return `<tr>
        <td style="padding:9px 14px;border-bottom:1px solid #F0EDE8;font-weight:600;color:#1A1A1A;">${veilig(x.name)}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #F0EDE8;color:#5C5248;">${x.attending === "no" ? "komt niet" : veilig(x.guest_type ?? "daggast")}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #F0EDE8;color:#9A8E82;font-size:13px;">${extra.join(" &middot; ")}</td>
      </tr>`
    })
    .join("")

  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: afmelding ? `${veilig(primaryName)} komt niet` : `${veilig(primaryName)} komt!`,
    subkop: veilig(eventTitle),
    inhoud: `${alinea(afmelding ? `<strong>${veilig(primaryName)}</strong> heeft zich afgemeld.` : `<strong>${veilig(primaryName)}</strong> heeft zich aangemeld: ${komen} ${komen === 1 ? "persoon komt" : "personen komen"}${nietKomen ? `, ${nietKomen} niet` : ""}.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #EDE9E3;margin:0 0 20px;"><tbody>${regels}</tbody></table>
      ${guests[0]?.message ? `<div style="margin:0 0 20px;padding:14px 18px;background:#FAF7F2;border-left:3px solid ${GOUD};border-radius:0 8px 8px 0;color:#5C5248;font-style:italic;font-size:14px;line-height:1.6;">&ldquo;${veilig(guests[0].message)}&rdquo;</div>` : ""}
      ${knoppen(knop(dashboardUrl, "Naar je gastenlijst", SAYINGYES))}`,
    afzender: null,
    voetExtra: "Je krijgt dit bij elke aanmelding. Liever een stand per dag of per week? Dat kies je in je dashboard.",
  })

  return verstuur("Admin RSVP notification", {
    to: toEmail,
    subject: afmelding ? `${primaryName} komt niet (${eventTitle})` : `${primaryName} komt! (${eventTitle})`,
    html,
  })
}

// ── Website live ─────────────────────────────────────────────────────────────

export async function sendWebsiteLiveEmail(toEmail: string, names: string, websiteUrl: string) {
  const whatsappText = `Lieve vrienden en familie, onze trouwwebsite staat live! Daar vinden jullie alles over de dag: de locatie, het programma en hoe je laat weten of je erbij bent. Kijk op ${websiteUrl} Liefs!`

  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: "Jullie trouwwebsite staat live",
    inhoud: `${alinea(`Lieve ${veilig(names)},`)}
      ${alinea("Het is zover: jullie site staat online en is klaar om jullie gasten te ontvangen. Vanaf nu kunnen ze zich aanmelden, en elke aanmelding komt meteen in je gastenlijst.")}
      ${alinea("Aanpassen kan altijd, ook nu hij live staat: teksten, foto's, de stijl. Je gasten zien bij hun volgende bezoek de nieuwe versie.")}
      ${knoppen(knop(websiteUrl, "Bekijk jullie website", SAYINGYES), knop("https://www.sayingyes.nl/dashboard", "Naar je dashboard", SAYINGYES, true))}
      ${vlak(`${kopje("Delen via WhatsApp", SAYINGYES)}
        <p style="margin:0 0 10px;font-size:13px;color:#5C5248;line-height:1.6;">Kopieer dit tekstje en stuur het naar je gasten, of verstuur je trouwkaart met de knop naar de site erop.</p>
        <p style="margin:0;padding:12px 14px;background:#fff;border:1px solid #E8D5A3;border-radius:8px;font-size:13px;color:#5C5248;line-height:1.7;font-style:italic;">&ldquo;${whatsappText}&rdquo;</p>`)}`,
  })

  return verstuur("Website live", { to: toEmail, subject: "Jullie trouwwebsite staat live", html })
}

// ── Welkom plus inloglink, voor wie net begon ───────────────────────────────

export async function sendSignupWelcomeMagicLink({
  toEmail,
  magicLink,
  plan = "compleet",
}: {
  toEmail: string
  magicLink: string
  plan?: Plan
}) {
  // De tekst volgt het gekozen pakket: wie een kaart maakt hoort niets over
  // een website te lezen.
  const kaart = isCardPlan(plan)
  const kop = kaart ? "Jullie ontwerp staat klaar" : "De basis staat"
  const intro = kaart
    ? `Jullie gegevens zijn bewaard. Met de knop hieronder ga je verder met het ontwerp van jullie ${PLANS[plan].label.toLowerCase()}. Er is nog niets verstuurd en je betaalt nog niets: ontwerpen is gratis.`
    : "Jullie gegevens zijn bewaard. Met de knop hieronder ga je verder met bouwen. De site is nog niet live en je betaalt nog niets: bouwen is gratis."
  const lijst = kaart
    ? ["Kies een stijl en een ontwerp; dat bepaalt hoe de kaart eruitziet.", "Namen, datum en locatie staan erop zodra je ze invult.", "Klaar? Dan verstuur je de kaart als link via WhatsApp. Pas dan betaal je."]
    : ["Kies een stijl; die geldt voor de hele site.", "Vul het programma, de praktische informatie en jullie verhaal in.", "Klaar? Dan zet je de site live. Pas dan betaal je."]

  const html = omlijsting({
    gezicht: SAYINGYES,
    kop,
    subkop: "Welkom bij SayingYes",
    inhoud: `${alinea(intro)}
      ${vlak(`${kopje("Hoe het verder gaat", SAYINGYES)}${stappen(lijst)}`)}
      ${knoppen(knop(magicLink, kaart ? "Verder met je ontwerp" : "Verder bouwen", SAYINGYES))}
      <p style="margin:0 0 16px;font-size:12px;color:#9A8E82;line-height:1.6;">Werkt de knop niet? Kopieer dan deze link:<br><a href="${magicLink}" style="color:${GOUD};word-break:break-all;">${magicLink}</a></p>`,
  })

  return verstuur("Signup welcome magic link", { to: toEmail, subject: `${kop}: welkom bij SayingYes`, html })
}

// ── Inloglink ─────────────────────────────────────────────────────────────────

export async function sendMagicLink({ toEmail, magicLink }: { toEmail: string; magicLink: string }) {
  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: "Welkom terug",
    inhoud: `${alinea("Met de knop hieronder log je in. De link is <strong>60 minuten</strong> geldig.")}
      ${knoppen(knop(magicLink, "Inloggen bij SayingYes", SAYINGYES))}
      <p style="margin:0 0 16px;font-size:12px;color:#9A8E82;line-height:1.6;">Werkt de knop niet? Kopieer dan deze link:<br><a href="${magicLink}" style="color:${GOUD};word-break:break-all;">${magicLink}</a></p>`,
    afzender: null,
    voetExtra: "Heb je dit niet aangevraagd? Dan kun je deze mail negeren.",
  })

  return verstuur("Magic link", { to: toEmail, subject: "Je inloglink voor SayingYes", html })
}

// ── Factuur ───────────────────────────────────────────────────────────────────

export async function sendInvoiceEmail({
  toEmail,
  invoiceNumber,
  invoiceDate,
  customerName,
  amountExcl,
  btwAmount,
  amountIncl,
  molliePaymentId,
  pdfBuffer,
  omschrijving,
}: {
  toEmail: string
  invoiceNumber: string
  invoiceDate: string
  customerName: string
  amountExcl: string
  btwAmount: string
  amountIncl: string
  molliePaymentId: string
  pdfBuffer?: Buffer
  /** Wat er gekocht is, uit lib/plans.ts; eerst stond hier altijd "Bruiloftswebsite" */
  omschrijving?: string
}) {
  const wat = veilig(omschrijving ?? "Trouwwebsite compleet, 1 jaar live")
  const label = `padding:0 0 10px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9A8E82;border-bottom:1px solid #E8D5A3;`
  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F1EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1EC;padding:36px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <tr>
          <td style="padding:36px 40px 28px;border-bottom:1px solid #F0EDE8;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <p style="margin:0 0 2px;font-size:26px;font-weight:600;letter-spacing:0.04em;color:#1A1A1A;font-family:'Cormorant Garamond',Georgia,serif;">SayingYes</p>
                <p style="margin:0;font-size:12px;color:#9A8E82;">SayingYes &middot; KVK 42079472 &middot; BTW NL005478870B96</p>
                <p style="margin:2px 0 0;font-size:12px;color:#9A8E82;">Theo Uden Masmanstraat 43, 3813ZE Amersfoort</p>
              </td>
              <td align="right" style="vertical-align:top;">
                <p style="margin:0;font-size:22px;font-weight:800;color:${GOUD};letter-spacing:0.04em;">FACTUUR</p>
                <p style="margin:4px 0 0;font-size:13px;color:#5C5248;">${invoiceNumber}</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-bottom:1px solid #F0EDE8;background:#FAF7F2;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="width:50%;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9A8E82;">Factuurdatum</p>
                <p style="margin:0;font-size:14px;color:#1A1A1A;">${invoiceDate}</p>
              </td>
              <td style="width:50%;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9A8E82;">Factuur aan</p>
                <p style="margin:0;font-size:14px;color:#1A1A1A;">${veilig(customerName)}</p>
                <p style="margin:2px 0 0;font-size:12px;color:#5C5248;">${toEmail}</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead><tr><th style="${label}">Omschrijving</th><th style="${label}text-align:right;">Bedrag</th></tr></thead>
              <tbody><tr>
                <td style="padding:16px 0;border-bottom:1px solid #F0EDE8;color:#1A1A1A;font-size:14px;line-height:1.5;">${wat}<br><span style="font-size:12px;color:#9A8E82;">sayingyes.nl</span></td>
                <td style="padding:16px 0;border-bottom:1px solid #F0EDE8;text-align:right;font-size:14px;color:#1A1A1A;">&euro;&nbsp;${amountExcl}</td>
              </tr></tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;text-align:right;font-size:13px;color:#5C5248;">Subtotaal excl. BTW</td><td style="padding:6px 0 6px 24px;text-align:right;font-size:13px;color:#5C5248;white-space:nowrap;">&euro;&nbsp;${amountExcl}</td></tr>
              <tr><td style="padding:6px 0;text-align:right;font-size:13px;color:#5C5248;">BTW 21%</td><td style="padding:6px 0 6px 24px;text-align:right;font-size:13px;color:#5C5248;white-space:nowrap;">&euro;&nbsp;${btwAmount}</td></tr>
              <tr><td style="padding:10px 0 0;text-align:right;font-size:15px;font-weight:700;color:#1A1A1A;border-top:2px solid #1A1A1A;">Totaal incl. BTW</td><td style="padding:10px 0 0 24px;text-align:right;font-size:15px;font-weight:700;color:#1A1A1A;white-space:nowrap;border-top:2px solid #1A1A1A;">&euro;&nbsp;${amountIncl}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 24px;background:#FAF7F2;border-top:1px solid #F0EDE8;">
            <p style="margin:0 0 6px;font-size:12px;color:#9A8E82;">Betaling ontvangen via Mollie &middot; Referentie: <span style="font-family:monospace;color:#5C5248;">${molliePaymentId}</span></p>
            <p style="margin:0;font-size:12px;color:#9A8E82;">Bewaar deze factuur voor je eigen administratie. Vragen? Antwoord op deze mail.</p>
            <p style="margin:12px 0 0;font-size:12px;color:#9A8E82;">SayingYes &middot; sayingyes.nl &middot; info@sayingyes.nl</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return verstuur("Invoice", {
    to: toEmail,
    subject: `Factuur ${invoiceNumber} van SayingYes`,
    html,
    attachments: pdfBuffer ? [{ filename: `factuur-${invoiceNumber}.pdf`, content: pdfBuffer }] : undefined,
  })
}

// ── Conceptherinnering ───────────────────────────────────────────────────────

export async function sendDraftReminderEmail({
  toEmail,
  eventTitle,
  builderUrl,
  reminderNumber,
  plan,
  variant,
  dagenTotVerwijderen,
  kaartAfbeeldingUrl,
}: {
  toEmail: string
  eventTitle: string
  builderUrl: string
  // Welke herinnering dit is, alleen voor de logregel
  reminderNumber: number
  plan: Plan
  // Welke herinnering dit is; bepaalt de toon van de tekst
  variant: DraftVariant
  dagenTotVerwijderen: number
  /** De kaart van deze klant als plaatje, als die er is: "dit is jullie kaart, hij wacht" */
  kaartAfbeeldingUrl?: string | null
}) {
  const { w, subject, headline, bodyText, dagen, laatste } = draftReminderTekst({ eventTitle, plan, variant, dagenTotVerwijderen })

  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: headline,
    inhoud: `${alinea(bodyText)}
      ${kaartAfbeeldingUrl ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td align="center" style="background-color:#FAF7F2;border:1px solid #E8D5A3;border-radius:12px;padding:18px;"><img src="${kaartAfbeeldingUrl}" alt="Jullie kaart" width="320" style="display:block;width:100%;max-width:320px;height:auto;border-radius:8px;" /></td></tr></table>` : ""}
      ${laatste ? vlak(`<p style="margin:0;font-size:13px;color:#9a3412;line-height:1.65;"><strong>Let op:</strong> als jullie niets doen, wordt ${w.kwijt} ${dagen} verwijderd. Openen is genoeg om dat te voorkomen.</p>`, "let-op") : ""}
      ${knoppen(knop(builderUrl, laatste ? "Ontwerp openen" : `Verder met ${w.ding}`, SAYINGYES))}`,
  })

  const r = await verstuur(`Draft reminder #${reminderNumber}`, { to: toEmail, subject, html })
  return r
}

// ── Verlengen: na 11 maanden ─────────────────────────────────────────────────

export async function sendRenewalReminderEmail({
  toEmail,
  eventTitle,
  expiresAt,
  dashboardUrl,
}: {
  toEmail: string
  eventTitle: string
  expiresAt: Date
  dashboardUrl: string
}) {
  const expireStr = expiresAt.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: "Jullie site staat bijna een jaar online",
    inhoud: `${alinea(`<strong>${veilig(eventTitle)}</strong> gaat op <strong>${expireStr}</strong> offline. Willen jullie de site, de foto's en de gastenlijst langer bewaren? Verlengen kost &euro;&nbsp;${RENEWAL_PRICE} voor ${RENEWAL_MONTHS} maanden, in één keer, geen abonnement.`)}
      ${knoppen(knop(dashboardUrl, `Verlengen voor ${RENEWAL_PRICE} euro`, SAYINGYES))}
      ${alinea(`Verleng je niet, dan gaat de site op ${expireStr} vanzelf offline. Jullie gegevens bewaren we, dus later opnieuw aanzetten kan altijd.`, "font-size:13px;color:#9A8E82;")}`,
  })
  return verstuur("Renewal reminder", { to: toEmail, subject: `Jullie trouwwebsite gaat op ${expireStr} offline, verlengen kan voor ${RENEWAL_PRICE} euro`, html })
}

// ── Nog 7 dagen ──────────────────────────────────────────────────────────────

export async function sendExpiryWarningEmail({
  toEmail,
  eventTitle,
  expiresAt,
  dashboardUrl,
  fotos = 0,
  fotosUrl,
}: {
  toEmail: string
  eventTitle: string
  expiresAt: Date
  dashboardUrl: string
  /** Hoeveel foto's gasten hebben geüpload. */
  fotos?: number
  fotosUrl?: string
}) {
  const expireStr = expiresAt.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: `Nog 7 dagen, dan gaat de site offline`,
    inhoud: `${vlak(`<p style="margin:0;font-size:14px;color:#9a3412;line-height:1.65;"><strong>${veilig(eventTitle)}</strong> gaat op <strong>${expireStr}</strong> offline. Verleng vandaag nog voor &euro;&nbsp;${RENEWAL_PRICE} om hem online te houden.</p>`, "let-op")}
      ${knoppen(knop(dashboardUrl, `Verlengen voor ${RENEWAL_PRICE} euro`, SAYINGYES))}
      ${
        // Uit het klantreisgesprek van 21 september 2026: de foto's van je
        // gasten blijven bij ons staan, maar de deur gaat dicht, en dit is
        // het laatste moment waarop het nog kan.
        fotos > 0
          ? vlak(`<p style="margin:0 0 6px;font-size:15px;color:#1A1A1A;"><strong>Er staan ${fotos} foto's van je gasten klaar.</strong></p><p style="margin:0;font-size:14px;color:#5C5248;line-height:1.65;">Haal ze binnen voordat de site offline gaat. ${fotosUrl ? `<a href="${fotosUrl}" style="color:${GOUD};font-weight:600;">Naar je fotomuur</a>` : ""}</p>`)
          : ""
      }
      ${alinea(`Verleng je niet voor ${expireStr}? Dan gaat de site vanzelf offline. Later opnieuw aanzetten kan altijd via je dashboard.`, "font-size:13px;color:#9A8E82;")}`,
  })
  return verstuur("Expiry warning", { to: toEmail, subject: `Nog 7 dagen: jullie trouwwebsite gaat offline op ${expireStr}`, html })
}

// ── Offline ──────────────────────────────────────────────────────────────────
// Eerst ging een site stil offline. Nu een laatste mail, met de foto's en de
// knop om weer aan te zetten (ontwerpronde, ronde 6).

export async function sendOfflineEmail({
  toEmail,
  eventTitle,
  dashboardUrl,
  fotos = 0,
}: {
  toEmail: string
  eventTitle: string
  dashboardUrl: string
  fotos?: number
}) {
  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: "Jullie site is offline",
    inhoud: `${alinea(`<strong>${veilig(eventTitle)}</strong> staat vanaf vandaag niet meer online. Jullie gegevens, de gastenlijst${fotos > 0 ? ` en de ${fotos} foto's van je gasten` : ""} bewaren we gewoon.`)}
      ${alinea("Wil je de site toch nog een tijdje laten staan, bijvoorbeeld voor de foto's? Dan zet je hem in je dashboard weer aan voor ${RENEWAL_PRICE} euro per ${RENEWAL_MONTHS} maanden.")}
      ${knoppen(knop(dashboardUrl, "Naar je dashboard", SAYINGYES))}`,
  })
  return verstuur("Offline", { to: toEmail, subject: `${eventTitle}: jullie site is offline`, html })
}

// ── Pakket geactiveerd (Save the Date / trouwkaart) ─────────────────────────
// Voor het pakket Compleet is er de mail "website live".

export async function sendPlanActivatedEmail({
  toEmail,
  names,
  plan,
  isUpgrade,
}: {
  toEmail: string
  names: string
  plan: "save_the_date" | "uitnodiging"
  /** Wordt nog meegegeven door de aanroepers; de mail verwijst naar het dashboard. */
  slug?: string
  isUpgrade: boolean
}) {
  const dashboardUrl = "https://www.sayingyes.nl/dashboard"
  const isStd = plan === "save_the_date"
  const soort = isStd ? "Save the Date" : "trouwkaart"
  const eur = (n: number) => `${n.toFixed(2).replace(".", ",").replace(",00", "")} euro`
  const bijInv = PLANS.uitnodiging.price - PLANS.save_the_date.price
  const bijSite = PLANS.compleet.price - PLANS[plan].price
  const kop = isUpgrade ? `Jullie ${soort} is erbij` : `Jullie ${soort} is geactiveerd`

  const html = omlijsting({
    gezicht: SAYINGYES,
    kop,
    inhoud: `${alinea(`Lieve ${veilig(names)},`)}
      ${alinea(`Gelukt. Jullie ${soort} werkt nu voor je gasten: de envelop gaat bij hen open in jullie stijl, en ze laten met een tik weten of ze erbij zijn.`)}
      ${kopje("Zo verstuur je hem", SAYINGYES)}
      ${stappen([
        `Open je dashboard. Je kaart staat in de tegel ${isStd ? "Save the Date" : "Trouwkaart"}.`,
        "Kies de kaart en druk op <strong>Link voor je gasten</strong>.",
        "Kopieer de link of stuur hem meteen via WhatsApp. Een QR-code voor op papier staat er ook.",
      ])}
      ${knoppen(knop(dashboardUrl, "Naar je dashboard", SAYINGYES))}
      ${vinkjes([
        ["Aanpassen kan altijd.", "Ook na het versturen. Wijzig je iets, dan zien je gasten de nieuwe kaart zodra ze de link opnieuw openen."],
        ["Je gastenlijst vult zichzelf.", "Wie antwoordt staat meteen in je dashboard, en je ziet wie nog stil is."],
        ["Meerdere kaarten zitten in de prijs.", "Een voor je daggasten en een voor je avondgasten, of dezelfde kaart in een andere taal."],
        ...(isStd
          ? [[`De trouwkaart komt erbij voor ${eur(bijInv)}.`, `Wat je nu betaalde telt mee; de complete website kost ${eur(bijSite)} extra.`] as [string, string]]
          : [["De Save the Date zit erbij.", `Die verstuur je zonder bij te betalen. Wil je later de complete website, dan betaal je ${eur(bijSite)} bij.`] as [string, string]]),
      ])}`,
    voetExtra: "Vragen? Antwoord gewoon op deze mail, dan lezen we mee.",
  })

  return verstuur(`Plan activated (${plan})`, { to: toEmail, subject: kop, html })
}

// ── Proefkaart naar het bruidspaar zelf ─────────────────────────────────────
// De grootste twijfel bij een digitale kaart is "hoe komt dit aan bij mijn
// gasten". Deze mail zet de kaart in hun eigen inbox, met de link erbij.

export async function sendProefkaartEmail({
  toEmail,
  namen,
  kaartUrl,
  afbeeldingUrl,
  isTrouwkaart,
}: {
  toEmail: string
  namen: string
  /** De voorbeeldweergave van de kaart, niet de publieke link. */
  kaartUrl: string
  /** Plaatje van de kaart, voor in de mail zelf. */
  afbeeldingUrl: string
  isTrouwkaart: boolean
}) {
  const soort = isTrouwkaart ? "trouwkaart" : "Save the Date"
  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: "Jullie proefkaart",
    inhoud: `${alinea(`Hier is de ${soort} van <strong>${veilig(namen)}</strong> zoals hij er nu uitziet. Open de link op je telefoon: zo openen je gasten hem straks ook, met de envelop en het zegel.`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td align="center" style="background-color:#FAF7F2;border:1px solid #E8D5A3;border-radius:12px;padding:20px;"><img src="${afbeeldingUrl}" alt="Jullie kaart" width="360" style="display:block;width:100%;max-width:360px;height:auto;border-radius:8px;" /></td></tr></table>
      ${knoppen(knop(kaartUrl, "Open de envelop", SAYINGYES))}
      ${kopje("Waar je op kunt letten", SAYINGYES)}
      ${alinea("Kloppen de namen, de datum en de locatie? Leest de tekst prettig op een klein scherm? En doet de envelop wat je ervan verwacht? Pas het gerust nog aan, je ontwerp blijft gewoon staan.", "font-size:14px;")}`,
    afzender: null,
    voetExtra: "Dit is een proefkaart voor jullie zelf. Je gasten krijgen hem pas als je hem verstuurt.",
  })
  return verstuur("Proefkaart", { to: toEmail, subject: "Jullie proefkaart: zo ontvangen je gasten hem", html })
}

// ── Bericht aan gasten: een herinnering of een wijziging ────────────────────
// Het bruidspaar stuurt dit zelf; wij versturen nooit uit onszelf iets naar
// een gast. De knop zet het klaar, zij drukken erop.

export async function sendGastBerichtEmail({
  toEmail,
  gastNaam,
  eventTitle,
  soort,
  bericht,
  link,
  bruiloft,
}: {
  toEmail: string
  gastNaam: string
  eventTitle: string
  soort: "herinnering" | "wijziging"
  /** Wat het bruidspaar zelf schreef. */
  bericht: string
  /** De kaart of de trouwsite, precies de link die deze gast eerder kreeg. */
  link: string
  bruiloft?: BruiloftMail | null
}) {
  const g: Gezicht = bruiloft ? bruiloftGezicht(bruiloft.sc, bruiloft.namen) : { ...SAYINGYES, woordmerk: veilig(eventTitle), woordmerkFont: "Georgia, serif" }
  const isHerinnering = soort === "herinnering"
  const kop = isHerinnering ? "Laat je nog even weten of je erbij bent?" : "Er is iets veranderd"
  const slot = isHerinnering
    ? "Het duurt een halve minuut en het scheelt het bruidspaar een hoop uitzoekwerk."
    : "Je aanmelding blijft gewoon staan, je hoeft niets opnieuw in te vullen."

  const html = omlijsting({
    gezicht: g,
    kop,
    inhoud: `${alinea(`Hoi ${veilig(gastNaam)},`)}
      ${alinea(veilig(bericht), "white-space:pre-line;")}
      ${knoppen(knop(link, isHerinnering ? "Laat het weten" : "Bekijk wat er veranderd is", g))}
      ${alinea(slot, "font-size:13px;color:#9A8E82;")}`,
    afzender: bruiloft ? `Liefs,<br><strong style="color:#1A1A1A;">${veilig(bruiloft.namen)}</strong>` : null,
  })

  const wie = bruiloft?.namen ?? eventTitle
  return verstuur("Gastbericht", {
    to: toEmail,
    from: bruiloft ? `${bruiloft.namen.replace(/[<>"]/g, "")} via SayingYes <info@sayingyes.nl>` : FROM,
    replyTo: bruiloft?.replyTo ?? null,
    subject: isHerinnering ? `${wie}: laat je nog even weten of je erbij bent?` : `${wie}: er is iets veranderd`,
    html,
  })
}

// ── Aantallen naar de locatie ────────────────────────────────────────────────
// Drie momenten, één mail. De woorden staan in lib/deadline.ts.

export async function sendDeadlineEmail({
  toEmail,
  eventTitle,
  moment,
  locatie,
  over,
  deadlineStr,
  komen,
  kinderen,
  stil,
  dashboardUrl,
  cateraarUrl,
}: {
  toEmail: string
  eventTitle: string
  moment: DeadlineMoment
  locatie: string | null
  over: number
  deadlineStr: string
  komen: number
  kinderen: number
  stil: number
  dashboardUrl: string
  cateraarUrl: string | null
}) {
  const t = deadlineTekst(moment, locatie, over)
  const dringend = moment !== "navraag"
  const knopUrl: string = moment === "navraag" || !cateraarUrl ? dashboardUrl : cateraarUrl

  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: t.kop,
    inhoud: `${alinea(`Voor <strong>${veilig(eventTitle)}</strong>${dringend ? ` staat de datum op <strong>${deadlineStr}</strong>` : ""}. ${t.eerste}`)}
      ${cijfers([
        { label: "Komen", waarde: komen, kleur: "#065F46" },
        { label: "Waarvan kind", waarde: kinderen },
        { label: "Nog stil", waarde: stil, kleur: stil > 0 ? "#B45309" : undefined },
      ])}
      ${stil > 0 && dringend ? alinea(`Van ${stil} ${stil === 1 ? "gast" : "gasten"} heb je nog niets gehoord. In je gastenlijst selecteer je ze met één druk, zodat je ze nog even kunt najagen voordat je de aantallen doorgeeft.`, "font-size:13px;color:#9A8E82;") : ""}
      ${alinea(`Wij sturen niets naar ${veilig(locatie ?? "je locatie")}. Dat blijft aan jou, net als alle berichten aan je gasten. Wij zorgen dat je het niet vergeet en dat de lijst klaarstaat.`, "font-size:14px;")}
      ${knoppen(knop(knopUrl, t.knop ?? "Naar je dashboard", SAYINGYES), knop(dashboardUrl, "Naar je dashboard", SAYINGYES, true))}`,
    afzender: null,
    voetExtra: "Je krijgt dit omdat je een datum hebt gezet voor je definitieve aantallen. Zeg in je dashboard dat het gelukt is, dan houden we er voorgoed over op.",
  })

  return verstuur(`Deadline (${moment})`, { to: toEmail, subject: t.onderwerp, html })
}

// ── De stand van je gastenlijst ──────────────────────────────────────────────
// Eén mail, met een frequentie die de klant zelf kiest. De regels staan in
// lib/stand.ts, waaronder de belangrijkste: niets sturen als er niets nieuws is.

export async function sendStandEmail({
  toEmail,
  eventTitle,
  cijfers: c,
  dashboardUrl,
}: {
  toEmail: string
  eventTitle: string
  cijfers: StandCijfers
  dashboardUrl: string
}) {
  const kop = standKop(c)
  const advies = standAdvies(c)
  const totaal = Math.max(c.gasten, 1)
  const breedteJa = Math.round((c.komen / totaal) * 100)
  const breedteNee = Math.round((c.nietKomen / totaal) * 100)

  const html = omlijsting({
    gezicht: SAYINGYES,
    kop,
    inhoud: `${alinea(`De gastenlijst van <strong>${veilig(eventTitle)}</strong> staat er zo voor:`)}
      ${cijfers([
        { label: "Komen", waarde: c.komen, kleur: "#065F46" },
        { label: "Komen niet", waarde: c.nietKomen },
        { label: "Nog stil", waarde: c.stil, kleur: c.stil > 0 ? "#B45309" : undefined },
      ])}
      ${
        c.gasten > 0
          ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:999px;overflow:hidden;background:#EDE6D8;margin-bottom:8px;"><tr style="height:8px;"><td width="${breedteJa}%" style="background-color:#059669;height:8px;"></td><td width="${breedteNee}%" style="background-color:#E8D5A3;height:8px;"></td><td style="height:8px;"></td></tr></table>
             <p style="margin:0 0 20px;font-size:12px;color:#9A8E82;">${c.komen} van ${c.gasten} gasten komen.</p>`
          : ""
      }
      ${alinea(advies, "font-size:14px;")}
      ${knoppen(knop(dashboardUrl, "Naar je gastenlijst", SAYINGYES))}`,
    afzender: null,
    voetExtra: "Je hebt zelf gekozen hoe vaak je dit hoort. In je dashboard zet je het op dagelijks, wekelijks, maandelijks of nooit. We sturen niets als er niets nieuws is.",
  })

  return verstuur("Stand", { to: toEmail, subject: `${kop} voor ${eventTitle}`, html })
}

// ── Een week voor de bruiloft ────────────────────────────────────────────────
// De stand, wie nog stil is, de lijst voor de cateraar en de tip om de
// QR-kaart voor de fotomuur te printen (ontwerpronde, ronde 6).

export async function sendWeekVoorEmail({
  toEmail,
  eventTitle,
  datumTekst,
  komen,
  stil,
  dashboardUrl,
  cateraarUrl,
  fotomuurAan,
}: {
  toEmail: string
  eventTitle: string
  datumTekst: string
  komen: number
  stil: number
  dashboardUrl: string
  cateraarUrl: string
  fotomuurAan: boolean
}) {
  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: "Nog een week!",
    subkop: datumTekst,
    inhoud: `${alinea(`Over een week is het zover. Even de stand van <strong>${veilig(eventTitle)}</strong>, en drie dingen die je nu nog kunt doen.`)}
      ${cijfers([
        { label: "Komen", waarde: komen, kleur: "#065F46" },
        { label: "Nog stil", waarde: stil, kleur: stil > 0 ? "#B45309" : undefined },
      ])}
      ${stappen([
        stil > 0 ? `Van ${stil} ${stil === 1 ? "gast" : "gasten"} heb je nog niets gehoord. Selecteer ze in je gastenlijst en stuur ze een laatste berichtje.` : "Iedereen heeft gereageerd. Dat is zeldzaam, geniet ervan.",
        `Print het <a href="${cateraarUrl}" style="color:${GOUD};font-weight:600;">overzicht voor de cateraar</a>, met de dieetwensen en allergieën erbij.`,
        fotomuurAan
          ? "Print de QR-kaart van de fotomuur en zet hem op de tafels. Zo verzamel je de foto's van je gasten zonder er iets voor te hoeven doen."
          : "Zet de fotomuur aan in je dashboard en print de QR-kaart voor op de tafels. Zo verzamel je de foto's van je gasten zonder er iets voor te hoeven doen.",
      ])}
      ${knoppen(knop(dashboardUrl, "Naar je dashboard", SAYINGYES))}
      ${alinea("Heel veel plezier volgende week. Na de dag hoor je nog één keer van ons, met de foto's.", "font-size:14px;")}`,
  })
  return verstuur("Week voor", { to: toEmail, subject: `Nog een week tot ${eventTitle}`, html })
}

// ── De dag erna ──────────────────────────────────────────────────────────────

export async function sendDagNaEmail({
  toEmail,
  names,
  fotos,
  fotomuurUrl,
  siteUrl,
}: {
  toEmail: string
  names: string
  fotos: number
  fotomuurUrl: string | null
  siteUrl: string | null
}) {
  const html = omlijsting({
    gezicht: SAYINGYES,
    kop: "Gefeliciteerd!",
    inhoud: `${alinea(`Lieve ${veilig(names)},`)}
      ${alinea("Jullie zijn getrouwd. Van harte gefeliciteerd, en wat fijn dat SayingYes een klein stukje van jullie dag mocht zijn.")}
      ${
        fotos > 0
          ? alinea(`Er staan al <strong>${fotos} foto's</strong> van jullie gasten op de fotomuur. De site zegt vanaf vandaag "Wij zijn getrouwd" en zet de foto's bovenaan, zodat iedereen ze kan terugkijken en zijn eigen foto's nog kan delen.`)
          : alinea(`Jullie site zegt vanaf vandaag "Wij zijn getrouwd". ${fotomuurUrl ? "Vraag je gasten om hun foto's te delen; die komen vanzelf op de fotomuur." : "Zet de fotomuur aan in je dashboard, dan kunnen je gasten hun foto's nog delen."}`)
      }
      ${knoppen(...[fotomuurUrl ? knop(fotomuurUrl, "Naar de fotomuur", SAYINGYES) : null, siteUrl ? knop(siteUrl, "Bekijk de site", SAYINGYES, true) : null].filter(Boolean) as string[])}
      ${vlak(`${kopje("Mogen we iets vragen?", SAYINGYES)}<p style="margin:0;font-size:14px;color:#5C5248;line-height:1.65;">Hoe was het, met de kaart en de site? Antwoord op deze mail met twee zinnen. Mogen we die als ervaring op onze site zetten, zeg dat er dan bij. Het helpt het volgende bruidspaar kiezen.</p>`)}`,
    afzender: "Veel geluk samen,<br><strong style=\"color:#1A1A1A;\">Michiel van SayingYes</strong>",
  })
  return verstuur("Dag na", { to: toEmail, subject: "Gefeliciteerd, jullie zijn getrouwd!", html })
}

// ── Bezoekersoverzicht (dagelijks, naar de eigenaar) ─────────────────────────

export interface VisitorDigestData {
  toEmail: string
  pageviews: number
  visitors: number
  topPages: [string, number][]
  referrers: [string, number][]
  countries: [string, number][]
  devices: [string, number][]
}

function digestTabel(titel: string, rijen: [string, number][]) {
  if (rijen.length === 0) return ""
  const body = rijen
    .map(
      ([naam, n]) => `
        <tr>
          <td style="padding:8px 14px;border-bottom:1px solid #f0ede8;color:#374151;">${naam}</td>
          <td style="padding:8px 14px;border-bottom:1px solid #f0ede8;color:#111827;font-weight:600;text-align:right;">${n}</td>
        </tr>`
    )
    .join("")
  return `
    <p style="margin:22px 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#C5A059;font-weight:600;">${titel}</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E8D5A3;border-radius:10px;overflow:hidden;font-size:14px;">
      ${body}
    </table>`
}

export async function sendVisitorDigestEmail(data: VisitorDigestData) {
  const { toEmail, pageviews, visitors, topPages, referrers, countries, devices } = data
  const datum = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })

  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FAF7F2;color:#1A1A1A;">
      <p style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#C5A059;font-weight:600;margin:0 0 8px;">SayingYes · bezoekers</p>
      <h1 style="font-size:26px;font-weight:700;margin:0 0 4px;">Er was bezoek op je site</h1>
      <p style="margin:0 0 24px;color:#5C5248;font-size:14px;">Afgelopen 24 uur, tot ${datum}.</p>

      <table style="width:100%;border-collapse:separate;border-spacing:12px 0;margin:0 -12px;">
        <tr>
          <td style="background:#fff;border:1px solid #E8D5A3;border-radius:12px;padding:18px;text-align:center;">
            <div style="font-size:34px;font-weight:700;color:#C5A059;">${visitors}</div>
            <div style="font-size:12px;color:#5C5248;">${visitors === 1 ? "bezoeker" : "bezoekers"}</div>
          </td>
          <td style="background:#fff;border:1px solid #E8D5A3;border-radius:12px;padding:18px;text-align:center;">
            <div style="font-size:34px;font-weight:700;color:#1A1A1A;">${pageviews}</div>
            <div style="font-size:12px;color:#5C5248;">${pageviews === 1 ? "paginaweergave" : "paginaweergaves"}</div>
          </td>
        </tr>
      </table>

      ${digestTabel("Bekeken pagina's", topPages)}
      ${digestTabel("Kwamen via", referrers)}
      ${digestTabel("Land", countries)}
      ${digestTabel("Apparaat", devices)}

      <p style="margin:28px 0 0;font-size:12px;color:#9A8E82;line-height:1.6;">
        Anonieme telling zonder cookies; je eigen bezoeken tellen niet mee op apparaten waar je het adminpaneel hebt geopend.
        Geen bezoekers? Dan krijg je geen mail.
      </p>
    </div>`

  return verstuur("Visitor digest", { to: toEmail, subject: `👀 ${visitors} ${visitors === 1 ? "bezoeker" : "bezoekers"} op sayingyes.nl`, html })
}

// ── Foutmelding voor de beheerder (28 september 2026) ─────────────────────
// Zie lib/foutmelding.ts: daar zit de rem, dit is alleen de mail.

export interface FoutmeldingData {
  toEmail: string
  soort: "server" | "browser" | "stil"
  waar: string
  pad: string
  bericht: string
  stapel: string | null
  extra: string | null
  tijd: Date
}

const FOUT_SOORT_TEKST: Record<FoutmeldingData["soort"], string> = {
  server: "De server liep vast",
  browser: "Een pagina liep vast bij een bezoeker",
  stil: "Iets werd niet opgeslagen of verwerkt",
}

export async function sendFoutmeldingEmail(data: FoutmeldingData) {
  const tijd = data.tijd.toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
  const regel = (label: string, waarde: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#9A8E82;font-size:13px;vertical-align:top;white-space:nowrap;">${label}</td><td style="padding:6px 0;font-size:14px;color:#1A1A1A;">${veilig(waarde)}</td></tr>`

  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FAF7F2;color:#1A1A1A;">
      <p style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#B4533A;font-weight:600;margin:0 0 8px;">SayingYes · foutmelding</p>
      <h1 style="font-size:24px;font-weight:700;margin:0 0 16px;">${FOUT_SOORT_TEKST[data.soort]}</h1>
      <table style="border-collapse:collapse;margin:0 0 16px;">
        ${regel("Wanneer", tijd)}
        ${regel("Waar", data.waar)}
        ${regel("Pagina", data.pad)}
        ${regel("Melding", data.bericht)}
        ${data.extra ? regel("Meer", data.extra) : ""}
      </table>
      ${data.stapel ? `<pre style="background:#fff;border:1px solid #E8D5A3;border-radius:8px;padding:12px;font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-word;color:#5C5248;">${veilig(data.stapel)}</pre>` : ""}
      <p style="margin:20px 0 0;font-size:12px;color:#9A8E82;line-height:1.6;">
        Dezelfde fout mailt hoogstens één keer per uur, en er komen hoogstens tien foutmails per uur.
        Plak deze mail bij Claude, dan zoeken we het samen uit.
      </p>
    </div>`

  const r = await verstuur("Foutmelding", { to: data.toEmail, subject: `⚠️ ${FOUT_SOORT_TEKST[data.soort]}: ${data.waar}`.slice(0, 150), html })
  return r.success ? { success: true } : { success: false, error: r.error }
}
