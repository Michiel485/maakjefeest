import QRCode from "qrcode"
import { fetchCardByToken, isOpenbaar } from "@/lib/cards-server"
import { kaartUrl } from "@/lib/site-url"

export const dynamic = "force-dynamic"

// De QR-code naar een digitale kaart, om op een papieren kaart te zetten.
//
// Michiels idee van 21 september 2026, en het is bijna gratis: elke kaart heeft
// al een deellink, een QR-code is die link als plaatje. Wat het verkoopt is
// iets anders. Wie zijn mooie papieren kaart niet wil opgeven hoeft niet te
// kiezen: hij stuurt de kaart op met onze code erop, en krijgt er de
// aanmelding, de dieetwensen, de allergieën en de doorgang naar de website bij.
//
// Twee vormen. PNG voor wie het plaatje in Canva of Word zet, SVG voor de
// drukker, want een QR uit een vector blijft scherp op elk formaat.
//
// Geen login: de QR wijst naar een pagina die toch al openbaar is. Wel dezelfde
// controle als de kaartpagina zelf, want een code naar een kaart die nog niet
// geactiveerd is zou op driehonderd gedrukte kaarten staan en niet werken. Dat
// is precies het soort fout dat niet meer te herstellen valt.

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  const vorm = url.searchParams.get("vorm") === "svg" ? "svg" : "png"

  if (!token) return Response.json({ error: "token is verplicht" }, { status: 400 })

  const data = await fetchCardByToken(token)
  if (!data) return Response.json({ error: "Deze kaart bestaat niet" }, { status: 404 })

  if (!isOpenbaar(data)) {
    return Response.json(
      {
        error:
          "Deze kaart is nog niet geactiveerd. Activeer hem eerst, anders staat er een code op je gedrukte kaart die niet werkt.",
      },
      { status: 403 }
    )
  }

  // Altijd het echte domein, nooit dat van het verzoek. Zie kaartUrl.
  const doel = kaartUrl(token, url.origin)

  // Zwart op wit, zonder kleuring. Een QR moet leesbaar zijn, en dat is de enige
  // eis die telt bij een code die op papier belandt en niet meer te wijzigen is.
  // Foutcorrectie op Q: dan blijft hij werken met een vouw of een vlek erover.
  const opties = {
    margin: 2,
    errorCorrectionLevel: "Q" as const,
    color: { dark: "#000000", light: "#FFFFFF" },
  }

  if (vorm === "svg") {
    const svg = await QRCode.toString(doel, { ...opties, type: "svg", width: 1024 })
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="qr-kaart-${token}.svg"`,
        "Cache-Control": "no-store",
      },
    })
  }

  // Ruim genoeg om op een kaart van twee centimeter nog scherp te drukken.
  const png = await QRCode.toBuffer(doel, { ...opties, type: "png", width: 2048 })

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-kaart-${token}.png"`,
      "Cache-Control": "no-store",
    },
  })
}
