import { afmeldHandtekeningKlopt } from "@/lib/afmelden"
import { createServiceClient } from "@/lib/supabase"
import { MARKETING_URL } from "@/lib/site-url"

export const dynamic = "force-dynamic"

// GET /api/mail/afmelden?event=<id>&sig=<handtekening>
//
// De afmeldlink onderaan de herinneringsmails (lib/afmelden.ts). Zet
// herinneringen_uit op true voor dit event, zodat de dagelijkse taak er geen
// conceptherinneringen, standmails, week-voor- en dag-na-mails en duwtjes meer
// voor stuurt. Mails over een betaling, een aanmelding of het verlopen van de
// site gaan gewoon door; die zijn geen herinnering.
//
// Mailprogramma's roepen deze link ook aan via List-Unsubscribe, met een POST
// (één-klik-afmelden). Daarom doet POST hetzelfde als GET.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function pagina(kop: string, tekst: string, status = 200): Response {
  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${kop}</title></head>
<body style="margin:0;padding:48px 16px;background:#F5F1EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1A1A1A;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:36px 32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <p style="margin:0 0 14px;font-size:22px;font-weight:600;letter-spacing:0.04em;font-family:'Cormorant Garamond',Georgia,serif;">SayingYes</p>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.3;">${kop}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#5C5248;">${tekst}</p>
    <a href="${MARKETING_URL}/dashboard" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700;">Naar je dashboard</a>
  </div>
</body>
</html>`
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } })
}

async function afmelden(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const eventId = url.searchParams.get("event") ?? ""
  const sig = url.searchParams.get("sig") ?? ""

  if (!UUID.test(eventId) || !/^[0-9a-f]{64}$/.test(sig) || !(await afmeldHandtekeningKlopt(eventId, sig))) {
    return pagina("Deze link klopt niet", "De afmeldlink is onvolledig of verlopen. Open de mail opnieuw en klik nog een keer, of zet je herinneringen uit in je dashboard.", 400)
  }

  const service = createServiceClient()
  const { error } = await service.from("events").update({ herinneringen_uit: true }).eq("id", eventId)
  if (error) {
    console.error("[mail/afmelden] bijwerken mislukt:", error)
    return pagina("Dat lukte even niet", "Probeer het straks nog een keer, of zet je herinneringen uit in je dashboard.", 500)
  }

  return pagina(
    "Je bent afgemeld",
    "Je krijgt van ons geen herinneringen meer over deze bruiloft: geen standmails, geen conceptherinneringen en geen mails rond de trouwdag. Mails over je betaling, je aanmeldingen en het verlopen van je site krijg je nog wel."
  )
}

export async function GET(request: Request) {
  return afmelden(request)
}

export async function POST(request: Request) {
  return afmelden(request)
}
