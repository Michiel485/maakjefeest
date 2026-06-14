import { Resend } from "resend"

const FROM = "SayingYes <info@sayingyes.nl>"

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set")
  return new Resend(process.env.RESEND_API_KEY)
}

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
}

export async function sendRSVPConfirmation(data: RSVPConfirmationData) {
  const { toEmail, primaryName, eventTitle, guests } = data

  const attendingGuests  = guests.filter((g) => g.attending !== "no")
  const decliningGuests  = guests.filter((g) => g.attending === "no")
  const isDecline        = attendingGuests.length === 0

  const guestRows = guests
    .map((g) => {
      const status = g.attending === "no" ? "Afgemeld" : g.guest_type ?? "Daggast"
      const extras = [
        g.dietary   ? `Dieet: ${g.dietary}`  : null,
        g.overnachting === true  ? "Overnachting: ja"   : null,
        g.overnachting === false ? "Overnachting: nee"  : null,
        g.song      ? `Liedje: ${g.song}`    : null,
      ].filter(Boolean)

      return `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;font-weight:600;color:#2d2926;">${g.name}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;color:#6b5e4e;">${status}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;color:#6b5e4e;font-size:13px;">${extras.join(" · ") || "—"}</td>
        </tr>`
    })
    .join("")

  const messageBlock =
    guests[0]?.message
      ? `<div style="margin:24px 0;padding:16px 20px;background:#faf8f5;border-left:3px solid #c9a96e;border-radius:0 8px 8px 0;color:#4a3f35;font-style:italic;font-size:14px;line-height:1.6;">
           "${guests[0].message}"
         </div>`
      : ""

  const headline = isDecline
    ? `Bedankt voor je bericht, ${primaryName}.`
    : `Gefeliciteerd, ${primaryName}! 🎉`

  const subline = isDecline
    ? `We hebben je afmelding voor <strong>${eventTitle}</strong> ontvangen. Jammer dat je er niet bij kunt zijn — we hopen je snel te zien!`
    : `Je aanmelding voor <strong>${eventTitle}</strong> is bevestigd. We kijken ernaar uit je te verwelkomen!`

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f5f1ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ec;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td bgcolor="#c9a96e" style="background-color:#c9a96e;padding:40px 40px 32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:0.01em;color:#f5ead6;font-family:'Cormorant Garamond','Georgia',serif;">SayingYes</p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#111827;line-height:1.2;">${headline}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px;font-size:15px;color:#4a3f35;line-height:1.65;">${subline}</p>

            ${messageBlock}

            <!-- Guest table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #ede9e3;">
              <thead>
                <tr style="background:#faf8f5;">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#9b8b6a;text-transform:uppercase;border-bottom:1px solid #ede9e3;">Naam</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#9b8b6a;text-transform:uppercase;border-bottom:1px solid #ede9e3;">Status</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#9b8b6a;text-transform:uppercase;border-bottom:1px solid #ede9e3;">Extra</th>
                </tr>
              </thead>
              <tbody>${guestRows}</tbody>
            </table>

            <p style="margin:28px 0 0;font-size:13px;color:#9b8b6a;line-height:1.6;">
              Heb je een vraag of wil je iets wijzigen? Neem dan contact op met de bruidspaar.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #f0ede8;">
            <p style="margin:0;font-size:12px;color:#bdb0a0;">
              Verstuurd via <strong>SayingYes</strong> &nbsp;·&nbsp; sayingyes.nl
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { data: result, error } = await getResend().emails.send({
      from: FROM,
      to:   [toEmail],
      subject: isDecline
        ? `Je afmelding voor ${eventTitle} is ontvangen`
        : `Bevestiging: je bent aangemeld voor ${eventTitle}! 🎉`,
      html,
    })

    if (error) {
      console.error("[mail] Resend API error:", error)
      return { success: false, error }
    }

    console.log("[mail] RSVP confirmation sent →", toEmail, "| id:", result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error("[mail] Unexpected error sending RSVP confirmation:", err)
    return { success: false, error: err }
  }
}

// ── First Save Welcome ────────────────────────────────────────────────────────

export async function sendFirstSaveWelcomeEmail(
  toEmail: string,
  name: string,
  continueUrl: string
) {
  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f5f1ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ec;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td bgcolor="#c9a96e" style="background-color:#c9a96e;padding:44px 40px 36px;text-align:center;">
            <p style="margin:0 0 10px;font-size:22px;font-weight:600;letter-spacing:0.01em;color:#f5ead6;font-family:'Cormorant Garamond','Georgia',serif;">SayingYes</p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#111827;line-height:1.25;">Ja, de basis staat! 💍</h1>
            <p style="margin:10px 0 0;font-size:14px;color:#2d1f0e;font-weight:500;">Welkom bij SayingYes</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 0;">
            <p style="margin:0 0 18px;font-size:15px;color:#111827;font-weight:600;line-height:1.7;">
              Hoi ${name},
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
              Gefeliciteerd! De allereerste (en misschien wel belangrijkste) stap is gezet: jullie hebben de basisgegevens van jullie bruiloft succesvol opgeslagen. Vanaf nu is het officieel: jullie trouwwebsite begint te leven!
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
              Wat ontzettend te gek dat jullie SayingYes gebruiken om jullie gasten straks in stijl te informeren. We gaan er samen iets prachtigs van maken.
            </p>

            <!-- Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background-color:#faf7f2;border:1px solid #e8dcc8;border-radius:12px;padding:24px 24px 20px;">

                  <!-- Steps -->
                  <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#111827;">Wat staat er klaar na je eerste login?</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:7px 0;border-bottom:1px solid #ede9e0;">
                        <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;"><strong style="color:#111827;">🎨 Kies een stijl</strong> — Selecteer een template dat matcht met jullie grote dag.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;border-bottom:1px solid #ede9e0;">
                        <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;"><strong style="color:#111827;">📍 Locaties &amp; Tijden</strong> — Voeg ceremonies en feesten toe aan de handige tijdlijn.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;">
                        <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;"><strong style="color:#111827;">💌 RSVP klaarzetten</strong> — Bepaal welke vragen gasten moeten beantwoorden.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
                    <tr>
                      <td style="border-top:1px solid #ddd3be;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- Pricing -->
                  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#111827;">Transparant &amp; scherp geprijsd 🥂</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.65;">
                    Bij SayingYes houden we van duidelijke taal. Omdat we ons platform slim en efficiënt hebben ingericht, bieden we een van de scherpste tarieven van Nederland aan: <strong style="color:#111827;">eenmalig &euro;&nbsp;49,99</strong> voor een heel jaar live.
                  </p>
                  <p style="margin:0 0 0;font-size:13px;color:#374151;line-height:1.65;">
                    Geen addertjes onder het gras: de site verloopt na een jaar volledig automatisch, dus jullie zitten nooit vast aan een ongewenst abonnement. Wel flexibel verlengen om de trouwfoto&rsquo;s nog te delen? Dat kan daarna simpel per 6 maanden voor &euro;&nbsp;22,-.
                  </p>

                  <!-- Divider -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
                    <tr>
                      <td style="border-top:1px solid #ddd3be;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- Feedback -->
                  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#111827;">Idee&euml;n of suggesties? 🛠️</p>
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.65;">
                    Ons platform staat als een huis en we verwelkomen dagelijks volop nieuwe bruidsparen. Achter de schermen zit ons sterke ontwikkelingsteam echter nooit stil. Mis je een specifieke functie of heb je idee&euml;n om SayingYes n&oacute;g beter te maken? Stuur een mailtje naar <a href="mailto:ideen@sayingyes.nl" style="color:#c9a96e;text-decoration:none;font-weight:600;">ideen@sayingyes.nl</a>. We horen het heel graag!
                  </p>

                </td>
              </tr>
            </table>

            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
              Alles wordt tussentijds automatisch opgeslagen. Klik op de knop hieronder om direct verder te bouwen:
            </p>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td bgcolor="#c9a96e" style="background-color:#c9a96e;border-radius:10px;">
                  <a
                    href="${continueUrl}"
                    style="display:inline-block;background-color:#c9a96e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;mso-padding-alt:14px 36px;"
                  >
                    Verder bouwen →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
              Heel veel plezier met het ontwerpen van jullie website,<br>
              <strong style="color:#111827;">Het team van SayingYes.nl</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid #f0ede8;">
            <p style="margin:0;font-size:12px;color:#bdb0a0;">
              Verstuurd via <strong style="color:#9b8b6a;">SayingYes</strong> &nbsp;·&nbsp; sayingyes.nl
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { data: result, error } = await getResend().emails.send({
      from:    FROM,
      to:      [toEmail],
      subject: "Ja, de basis staat! 💍 Welkom bij SayingYes",
      html,
    })

    if (error) {
      console.error("[mail] First save welcome email error:", error)
      return { success: false, error }
    }

    console.log("[mail] First save welcome email sent →", toEmail, "| id:", result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error("[mail] Unexpected error sending first save welcome email:", err)
    return { success: false, error: err }
  }
}

// ── Admin RSVP Notification ───────────────────────────────────────────────────

export interface AdminRSVPNotificationData {
  toEmail: string
  eventTitle: string
  primaryName: string
  guests: RSVPGuest[]
}

export async function sendAdminRSVPNotification(data: AdminRSVPNotificationData) {
  const { toEmail, eventTitle, primaryName, guests } = data

  const attendingCount = guests.filter((g) => g.attending !== "no").length
  const decliningCount = guests.filter((g) => g.attending === "no").length
  const isDecline      = attendingCount === 0

  const guestRows = guests
    .map((g) => {
      const status = g.attending === "no" ? "Afgemeld" : g.guest_type ?? "Daggast"
      const extras = [
        g.dietary            ? `Dieet: ${g.dietary}`   : null,
        g.overnachting === true  ? "Overnachting: ja"  : null,
        g.overnachting === false ? "Overnachting: nee" : null,
        g.song               ? `Liedje: ${g.song}`     : null,
      ].filter(Boolean)

      return `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;font-weight:600;color:#111827;">${g.name}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;color:#374151;">${status}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;color:#6b7280;font-size:13px;">${extras.join(" · ") || "—"}</td>
        </tr>`
    })
    .join("")

  const messageBlock =
    guests[0]?.message
      ? `<div style="margin:20px 0 0;padding:14px 18px;background:#faf8f5;border-left:3px solid #c9a96e;border-radius:0 8px 8px 0;color:#374151;font-style:italic;font-size:14px;line-height:1.6;">
           "${guests[0].message}"
         </div>`
      : ""

  const summaryLine = isDecline
    ? `<strong style="color:#111827;">${primaryName}</strong> heeft zich <span style="color:#dc2626;font-weight:700;">afgemeld</span>.`
    : `<strong style="color:#111827;">${primaryName}</strong> heeft zich <span style="color:#16a34a;font-weight:700;">aangemeld</span> — ${attendingCount} gast${attendingCount !== 1 ? "en" : ""} komen, ${decliningCount} afgemeld.`

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td bgcolor="#1f2937" style="background-color:#1f2937;padding:32px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:22px;font-weight:600;letter-spacing:0.01em;color:#d1d5db;font-family:'Cormorant Garamond','Georgia',serif;">SayingYes</p>
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#9ca3af;text-transform:uppercase;">Beheerdersbericht</p>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#f9fafb;line-height:1.3;">Nieuwe RSVP ontvangen 🍾</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#d1d5db;">${eventTitle}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 28px;">
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.65;">${summaryLine}</p>

            <!-- Guest table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
              <thead>
                <tr bgcolor="#f9fafb" style="background-color:#f9fafb;">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Naam</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Status</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Extra</th>
                </tr>
              </thead>
              <tbody>${guestRows}</tbody>
            </table>

            ${messageBlock}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Automatisch bericht van <strong style="color:#6b7280;">SayingYes</strong> &nbsp;·&nbsp; sayingyes.nl
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { data: result, error } = await getResend().emails.send({
      from:    FROM,
      to:      [toEmail],
      subject: `Nieuwe RSVP ontvangen voor ${eventTitle}! 🍾`,
      html,
    })

    if (error) {
      console.error("[mail] Admin RSVP notification error:", error)
      return { success: false, error }
    }

    console.log("[mail] Admin RSVP notification sent →", toEmail, "| id:", result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error("[mail] Unexpected error sending admin notification:", err)
    return { success: false, error: err }
  }
}

// ── Website Live ─────────────────────────────────────────────────────────────

export async function sendWebsiteLiveEmail(
  toEmail: string,
  names: string,
  websiteUrl: string
) {
  const whatsappText = `Lieve vrienden en familie, het plannen van onze bruiloft is in volle gang en onze officiële trouwwebsite staat live! Hier vinden jullie alle informatie over de locatie, de dagplanning en kunnen jullie je RSVP doorgeven. Neem snel een kijkje op: ${websiteUrl} Liefs!`

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f5f1ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ec;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td bgcolor="#c9a96e" style="background-color:#c9a96e;padding:44px 40px 36px;text-align:center;">
            <p style="margin:0 0 10px;font-size:22px;font-weight:600;letter-spacing:0.01em;color:#f5ead6;font-family:'Cormorant Garamond','Georgia',serif;">SayingYes</p>
            <h1 style="margin:0;font-size:27px;font-weight:800;color:#111827;line-height:1.25;">Knal de kurk er maar af! 🍾🚀</h1>
            <p style="margin:10px 0 0;font-size:15px;color:#2d1f0e;font-weight:500;">Jullie trouwwebsite staat LIVE!</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 0;">
            <p style="margin:0 0 18px;font-size:15px;color:#111827;line-height:1.7;">
              Lieve ${names},
            </p>
            <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
              Het is zover: jullie hebben op de grote knop gedrukt en jullie persoonlijke trouwwebsite staat officieel live! Wat een waanzinnige mijlpaal. De pagina ziet er prachtig uit en is vanaf nu helemaal klaar om jullie gasten in stijl te ontvangen.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
              Vanaf dit moment kunnen jullie gasten ook de RSVP invullen. De meldingen daarvan stromen automatisch jullie dashboard binnen.
            </p>

            <!-- CTA button -->
            <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;">🔗 Jullie officiële live link:</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td bgcolor="#c9a96e" style="background-color:#c9a96e;border-radius:10px;">
                  <a
                    href="${websiteUrl}"
                    style="display:inline-block;background-color:#c9a96e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;mso-padding-alt:14px 36px;"
                  >
                    Bekijk jullie trouwwebsite →
                  </a>
                </td>
              </tr>
            </table>

            <!-- WhatsApp tip -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background-color:#faf7f2;border:1px solid #e8dcc8;border-radius:12px;padding:20px 24px;">
                  <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#111827;letter-spacing:0.02em;">
                    💡 Tip: Deel de link direct via WhatsApp!
                  </p>
                  <p style="margin:0 0 12px;font-size:13px;color:#4b5563;line-height:1.6;">
                    Kopieer dit tekstje en stuur het naar jullie gasten:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color:#ffffff;border:1px solid #d6c9a8;border-radius:8px;padding:14px 16px;">
                        <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;font-style:italic;">
                          "${whatsappText}"
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 36px;font-size:15px;color:#374151;line-height:1.7;">
              Heel veel plezier met het delen van jullie website en het verzamelen van de allereerste RSVP's!
            </p>
          </td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
              Proost op deze mooie mijlpaal,<br>
              <strong style="color:#111827;">Het team van SayingYes.nl</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid #f0ede8;">
            <p style="margin:0;font-size:12px;color:#bdb0a0;">
              Verstuurd via <strong style="color:#9b8b6a;">SayingYes</strong> &nbsp;·&nbsp; sayingyes.nl
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { data: result, error } = await getResend().emails.send({
      from:    FROM,
      to:      [toEmail],
      subject: "Knal de kurk er maar af: jullie trouwwebsite staat LIVE! 🍾🚀",
      html,
    })

    if (error) {
      console.error("[mail] Website live email error:", error)
      return { success: false, error }
    }

    console.log("[mail] Website live email sent →", toEmail, "| id:", result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error("[mail] Unexpected error sending website live email:", err)
    return { success: false, error: err }
  }
}

// ── Signup Welcome + Magic Link (combined, one email for new users) ───────────

export async function sendSignupWelcomeMagicLink({
  toEmail,
  magicLink,
}: {
  toEmail: string
  magicLink: string
}) {
  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f5f1ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ec;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td bgcolor="#c9a96e" style="background-color:#c9a96e;padding:44px 40px 36px;text-align:center;">
            <p style="margin:0 0 10px;font-size:22px;font-weight:600;letter-spacing:0.01em;color:#f5ead6;font-family:'Cormorant Garamond','Georgia',serif;">SayingYes</p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#111827;line-height:1.25;">Ja, de basis staat! 💍</h1>
            <p style="margin:10px 0 0;font-size:14px;color:#2d1f0e;font-weight:500;">Welkom bij SayingYes</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 0;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
              Gefeliciteerd! De allereerste stap is gezet: jullie hebben de basisgegevens van jullie bruiloft succesvol opgeslagen. Klik op de knop hieronder om je account te bevestigen en verder te gaan met bouwen.
            </p>

            <!-- Steps block -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background-color:#faf7f2;border:1px solid #e8dcc8;border-radius:12px;padding:20px 24px;">
                  <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#111827;">Wat staat er klaar na je eerste login?</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:7px 0;border-bottom:1px solid #ede9e0;">
                        <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;"><strong style="color:#111827;">🎨 Kies een stijl</strong> — Selecteer een template dat matcht met jullie grote dag.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;border-bottom:1px solid #ede9e0;">
                        <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;"><strong style="color:#111827;">📍 Locaties &amp; Tijden</strong> — Voeg de ceremonie en het feest toe aan de tijdlijn.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;">
                        <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;"><strong style="color:#111827;">💌 RSVP klaarzetten</strong> — Bepaal welke vragen jullie gasten moeten beantwoorden.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td bgcolor="#c9a96e" style="background-color:#c9a96e;border-radius:10px;">
                  <a
                    href="${magicLink}"
                    style="display:inline-block;background-color:#c9a96e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;mso-padding-alt:14px 36px;"
                  >
                    Account bevestigen &amp; verder bouwen →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Fallback link -->
            <p style="margin:0 0 36px;font-size:12px;color:#b0a494;line-height:1.6;">
              Werkt de knop niet? Kopieer dan deze link:<br>
              <a href="${magicLink}" style="color:#c9a96e;word-break:break-all;">${magicLink}</a>
            </p>
          </td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
              Heel veel plezier met het ontwerpen van jullie website,<br>
              <strong style="color:#111827;">Het team van SayingYes.nl</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid #f0ede8;">
            <p style="margin:0;font-size:12px;color:#bdb0a0;">
              Verstuurd via <strong style="color:#9b8b6a;">SayingYes</strong> &nbsp;·&nbsp; sayingyes.nl
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { data: result, error } = await getResend().emails.send({
      from:    FROM,
      to:      [toEmail],
      subject: "Ja, de basis staat! 💍 Welkom bij SayingYes",
      html,
    })

    if (error) {
      console.error("[mail] Signup welcome magic link error:", error)
      return { success: false, error }
    }

    console.log("[mail] Signup welcome magic link sent →", toEmail, "| id:", result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error("[mail] Unexpected error sending signup welcome magic link:", err)
    return { success: false, error: err }
  }
}

// ── Magic Link ────────────────────────────────────────────────────────────────

export async function sendMagicLink({
  toEmail,
  magicLink,
}: {
  toEmail: string
  magicLink: string
}) {
  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f5f1ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ec;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td bgcolor="#c9a96e" style="background-color:#c9a96e;padding:44px 40px 36px;text-align:center;">
            <p style="margin:0 0 10px;font-size:22px;font-weight:600;letter-spacing:0.01em;color:#f5ead6;font-family:'Cormorant Garamond','Georgia',serif;">SayingYes</p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#111827;line-height:1.25;">Welkom terug 👋</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 10px;font-size:15px;color:#4a3f35;line-height:1.7;">
              Klik op de knop hieronder om in te loggen op je SayingYes-account. De link is <strong>60 minuten geldig</strong>.
            </p>
            <p style="margin:0 0 32px;font-size:14px;color:#9b8b6a;line-height:1.6;">
              Heb je dit niet aangevraagd? Dan kun je deze e-mail gewoon negeren.
            </p>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td bgcolor="#c9a96e" style="background-color:#c9a96e;border-radius:10px;">
                  <a
                    href="${magicLink}"
                    style="display:inline-block;background-color:#c9a96e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 40px;border-radius:10px;letter-spacing:0.02em;mso-padding-alt:15px 40px;"
                  >
                    Inloggen bij SayingYes
                  </a>
                </td>
              </tr>
            </table>

            <!-- Fallback link -->
            <p style="margin:32px 0 0;font-size:12px;color:#b0a494;line-height:1.6;text-align:center;">
              Werkt de knop niet? Kopieer dan deze link:<br>
              <a href="${magicLink}" style="color:#c9a96e;word-break:break-all;">${magicLink}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #f0ede8;">
            <p style="margin:0;font-size:12px;color:#bdb0a0;">
              Verstuurd via <strong>SayingYes</strong> &nbsp;·&nbsp; sayingyes.nl
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { data: result, error } = await getResend().emails.send({
      from:    FROM,
      to:      [toEmail],
      subject: "Je inloglink voor SayingYes",
      html,
    })

    if (error) {
      console.error("[mail] Magic link send error:", error)
      return { success: false, error }
    }

    console.log("[mail] Magic link sent →", toEmail, "| id:", result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error("[mail] Unexpected error sending magic link:", err)
    return { success: false, error: err }
  }
}

// ── Invoice ───────────────────────────────────────────────────────────────────

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
}) {
  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f5f1ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ec;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="padding:36px 40px 28px;border-bottom:1px solid #f0ede8;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 2px;font-size:22px;font-weight:600;letter-spacing:0.01em;color:#1a1a1a;font-family:'Cormorant Garamond','Georgia',serif;">SayingYes</p>
                  <p style="margin:0;font-size:12px;color:#9b8b6a;">MvB Commerce · KVK 42079472 · BTW NL005478870B96</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#9b8b6a;">Theo Uden Masmanstraat 43, 3813ZE Amersfoort</p>
                </td>
                <td align="right" style="vertical-align:top;">
                  <p style="margin:0;font-size:22px;font-weight:800;color:#c9a96e;letter-spacing:0.04em;">FACTUUR</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#5c5248;">${invoiceNumber}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Meta row -->
        <tr>
          <td style="padding:20px 40px;border-bottom:1px solid #f0ede8;background:#faf7f2;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9b8b6a;">Factuurdatum</p>
                  <p style="margin:0;font-size:14px;color:#1a1a1a;">${invoiceDate}</p>
                </td>
                <td style="width:50%;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9b8b6a;">Factuur aan</p>
                  <p style="margin:0;font-size:14px;color:#1a1a1a;">${customerName}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#5c5248;">${toEmail}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Line items -->
        <tr>
          <td style="padding:24px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr>
                  <th style="padding:0 0 10px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9b8b6a;border-bottom:1px solid #e8ddd0;">Omschrijving</th>
                  <th style="padding:0 0 10px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9b8b6a;border-bottom:1px solid #e8ddd0;">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:16px 0;border-bottom:1px solid #f0ede8;color:#1a1a1a;font-size:14px;line-height:1.5;">
                    Bruiloftswebsite — 1 jaar live<br>
                    <span style="font-size:12px;color:#9b8b6a;">sayingyes.nl · publicatie voor 12 maanden</span>
                  </td>
                  <td style="padding:16px 0;border-bottom:1px solid #f0ede8;text-align:right;font-size:14px;color:#1a1a1a;">&euro;&nbsp;${amountExcl}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="padding:16px 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;text-align:right;font-size:13px;color:#5c5248;">Subtotaal excl. BTW</td>
                <td style="padding:6px 0 6px 24px;text-align:right;font-size:13px;color:#5c5248;white-space:nowrap;">&euro;&nbsp;${amountExcl}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;text-align:right;font-size:13px;color:#5c5248;">BTW 21%</td>
                <td style="padding:6px 0 6px 24px;text-align:right;font-size:13px;color:#5c5248;white-space:nowrap;">&euro;&nbsp;${btwAmount}</td>
              </tr>
              <tr>
                <td style="padding:10px 0 0;text-align:right;font-size:15px;font-weight:700;color:#1a1a1a;border-top:2px solid #1a1a1a;">Totaal incl. BTW</td>
                <td style="padding:10px 0 0 24px;text-align:right;font-size:15px;font-weight:700;color:#1a1a1a;white-space:nowrap;border-top:2px solid #1a1a1a;">&euro;&nbsp;${amountIncl}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Payment ref + note -->
        <tr>
          <td style="padding:20px 40px 32px;background:#faf7f2;border-top:1px solid #f0ede8;">
            <p style="margin:0 0 6px;font-size:12px;color:#9b8b6a;">
              Betaling ontvangen via Mollie · Referentie: <span style="font-family:monospace;color:#5c5248;">${molliePaymentId}</span>
            </p>
            <p style="margin:0;font-size:12px;color:#9b8b6a;">
              Bewaar deze factuur voor je eigen administratie. Vragen? <a href="mailto:info@sayingyes.nl" style="color:#c9a96e;text-decoration:none;">info@sayingyes.nl</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid #f0ede8;">
            <p style="margin:0;font-size:12px;color:#bdb0a0;">
              <strong style="color:#9b8b6a;">SayingYes</strong> &nbsp;·&nbsp; sayingyes.nl &nbsp;·&nbsp; info@sayingyes.nl
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { data: result, error } = await getResend().emails.send({
      from:    FROM,
      to:      [toEmail],
      subject: `Factuur ${invoiceNumber} — SayingYes`,
      html,
      ...(pdfBuffer ? {
        attachments: [{
          filename: `factuur-${invoiceNumber}.pdf`,
          content:  pdfBuffer,
        }],
      } : {}),
    })

    if (error) {
      console.error("[mail] Invoice email error:", error)
      return { success: false, error }
    }

    console.log("[mail] Invoice sent →", toEmail, "| invoice:", invoiceNumber, "| id:", result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error("[mail] Unexpected error sending invoice:", err)
    return { success: false, error: err }
  }
}

// ── Draft Reminder ────────────────────────────────────────────────────────────

export async function sendDraftReminderEmail({
  toEmail,
  eventTitle,
  builderUrl,
  reminderNumber,
}: {
  toEmail: string
  eventTitle: string
  builderUrl: string
  reminderNumber: 1 | 2
}) {
  const isSecond = reminderNumber === 2

  const subject = isSecond
    ? `Laatste herinnering: jullie trouwwebsite wacht nog op publicatie 💍`
    : `Jullie trouwwebsite staat nog niet live — publiceer hem vandaag! 🚀`

  const headline = isSecond
    ? `Laatste herinnering: jullie website wacht nog`
    : `Jullie website staat klaar om live te gaan!`

  const bodyText = isSecond
    ? `Dit is een laatste herinnering. Jullie concept voor <strong>${eventTitle}</strong> staat al een tijdje klaar maar is nog niet gepubliceerd. Als jullie de website niet publiceren, wordt het concept over een week automatisch verwijderd om onze servers schoon te houden.`
    : `Goed nieuws: jullie concept voor <strong>${eventTitle}</strong> staat al klaar in de builder! Maar jullie gasten kunnen de website nog niet zien — hij is namelijk nog niet gepubliceerd. Een publicatie kost slechts &euro;&nbsp;49,99 voor een volledig jaar live.`

  const urgencyBlock = isSecond
    ? `<tr>
        <td style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.65;">
            ⚠️ <strong>Let op:</strong> als jullie binnen 7 dagen niet inloggen of het concept publiceren, wordt het automatisch verwijderd.
          </p>
        </td>
      </tr>`
    : ``

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f5f1ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ec;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td bgcolor="#c9a96e" style="background-color:#c9a96e;padding:44px 40px 36px;text-align:center;">
            <p style="margin:0 0 10px;font-size:22px;font-weight:600;letter-spacing:0.01em;color:#f5ead6;font-family:'Cormorant Garamond','Georgia',serif;">SayingYes</p>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;line-height:1.25;">${headline}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 0;">
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
              ${bodyText}
            </p>

            ${urgencyBlock ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${urgencyBlock}</table>` : ""}

            <!-- Pricing block (only for first reminder) -->
            ${!isSecond ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background-color:#faf7f2;border:1px solid #e8dcc8;border-radius:12px;padding:20px 24px;">
                  <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#111827;">Wat kost het?</p>
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.65;">
                    <strong style="color:#111827;">Eenmalig &euro;&nbsp;49,99</strong> voor een volledig jaar live — daarna optioneel verlengen voor &euro;&nbsp;22,- per 6 maanden. Geen verborgen kosten.
                  </p>
                </td>
              </tr>
            </table>` : ""}

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td bgcolor="#c9a96e" style="background-color:#c9a96e;border-radius:10px;">
                  <a
                    href="${builderUrl}"
                    style="display:inline-block;background-color:#c9a96e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;mso-padding-alt:14px 36px;"
                  >
                    ${isSecond ? "Nu publiceren →" : "Verder bouwen &amp; publiceren →"}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
              Veel succes met de voorbereidingen,<br>
              <strong style="color:#111827;">Het team van SayingYes.nl</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid #f0ede8;">
            <p style="margin:0;font-size:12px;color:#bdb0a0;">
              Verstuurd via <strong style="color:#9b8b6a;">SayingYes</strong> &nbsp;·&nbsp; sayingyes.nl
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { data: result, error } = await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject,
      html,
    })
    if (error) {
      console.error("[mail] Draft reminder error:", error)
      return { success: false, error }
    }
    console.log(`[mail] Draft reminder #${reminderNumber} sent →`, toEmail, "| id:", result?.id)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error("[mail] Unexpected error sending draft reminder:", err)
    return { success: false, error: err }
  }
}
