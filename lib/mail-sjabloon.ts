// Eén sjabloon voor alle mails, met twee gezichten (ontwerpronde, ronde 6,
// 2 oktober 2026). Mails aan het bruidspaar dragen de huisstijl van
// SayingYes; mails aan gasten dragen de bruiloft: de kleuren van het ontwerp
// en de namen van het bruidspaar bovenaan. Een gast kent ons niet, die kent
// het bruidspaar.
//
// Eerst bouwde elke mail zijn eigen opmaak van begin tot eind: twee tinten
// goud, soms gouden en soms zwarte knoppen, vier verschillende voetteksten.
// Elke verbetering moest vijftien keer. Nu één keer, hier.

import type { SC } from "./event-styles"

export interface Gezicht {
  /** De naam bovenaan: "SayingYes" of "Michiel & Lindsey" */
  woordmerk: string
  woordmerkFont: string
  kopBg: string
  kopTekst: string
  /** De kleur van kleine kopjes, lijnen en links */
  accent: string
  knopBg: string
  knopTekst: string
  /** De zachte achtergrond achter de witte kaart */
  pagina: string
  /** Onderaan: wie dit stuurde */
  voet: string
}

// Het palet van SayingYes, dezelfde waarden als in app/globals.css
export const GOUD = "#C5A059"
const INKT = "#1A1A1A"
const TEKST = "#5C5248"
const ZACHT = "#9A8E82"
const IVOOR = "#FAF7F2"
const GOUD_VLAK = "#FBF5E8"
const GOUD_LICHT = "#E8D5A3"

export const SAYINGYES: Gezicht = {
  woordmerk: "SayingYes",
  woordmerkFont: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  kopBg: GOUD,
  kopTekst: INKT,
  accent: GOUD,
  knopBg: INKT,
  knopTekst: "#ffffff",
  pagina: "#F5F1EC",
  voet: "SayingYes &middot; sayingyes.nl &middot; info@sayingyes.nl",
}

/** Het gezicht van een bruiloft: de kleuren van de site, de namen bovenaan */
export function bruiloftGezicht(sc: Pick<SC, "accent" | "navBg" | "headingColor" | "buttonBg" | "buttonText" | "bodyBg">, namen: string): Gezicht {
  return {
    woordmerk: namen,
    woordmerkFont: "Georgia, 'Times New Roman', serif",
    kopBg: sc.navBg,
    kopTekst: sc.headingColor,
    accent: sc.accent,
    knopBg: sc.buttonBg,
    knopTekst: sc.buttonText,
    pagina: sc.bodyBg,
    voet: `Dit bericht komt van ${namen}, verstuurd via SayingYes.`,
  }
}

/** Tekst zonder html-haken, voor wat een gast of het bruidspaar zelf typte */
export function veilig(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Een gewone alinea */
export function alinea(inhoud: string, extra = ""): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${TEKST};${extra}">${inhoud}</p>`
}

/** Een klein kopje in kapitalen, zoals op de site */
export function kopje(tekst: string, g: Gezicht): string {
  return `<p style="margin:0 0 10px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${g.accent};font-weight:700;">${tekst}</p>`
}

/** De knop. `licht` is de tweede vorm: een rand in plaats van een vlak. */
export function knop(href: string, tekst: string, g: Gezicht, licht = false): string {
  const stijl = licht
    ? `background-color:transparent;color:${g.accent};border:1px solid ${g.accent};`
    : `background-color:${g.knopBg};color:${g.knopTekst};border:1px solid ${g.knopBg};`
  return `<a href="${href}" style="display:inline-block;${stijl}text-decoration:none;padding:13px 28px;border-radius:999px;font-size:15px;font-weight:700;">${tekst}</a>`
}

/** Een rij knoppen, in het midden */
export function knoppen(...items: string[]): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:8px auto 28px;"><tr>${items.map((k) => `<td style="padding:4px 5px;">${k}</td>`).join("")}</tr></table>`
}

/** Een zacht vlak met iets erin: een tip, een waarschuwing, de stappen */
export function vlak(inhoud: string, toon: "zacht" | "let-op" = "zacht"): string {
  const bg = toon === "let-op" ? "#FFF7ED" : GOUD_VLAK
  const rand = toon === "let-op" ? "#FED7AA" : GOUD_LICHT
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background-color:${bg};border:1px solid ${rand};border-radius:12px;padding:18px 20px;">${inhoud}</td></tr></table>`
}

/** Drie cijfers naast elkaar, zoals in de stand- en deadlinemail */
export function cijfers(items: { label: string; waarde: number | string; kleur?: string }[]): string {
  const breedte = Math.floor(100 / Math.max(1, items.length))
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${GOUD_VLAK};border:1px solid ${GOUD_LICHT};border-radius:12px;margin:0 0 16px;"><tr>${items
    .map(
      (c) => `<td width="${breedte}%" style="padding:14px 10px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:700;color:${c.kleur ?? INKT};font-family:Georgia,serif;">${c.waarde}</p>
      <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${ZACHT};">${c.label}</p>
    </td>`
    )
    .join("")}</tr></table>`
}

/** Genummerde stappen */
export function stappen(items: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${items
    .map(
      (s, i) => `<tr>
      <td width="30" valign="top" style="padding:0 0 10px;"><span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:999px;background:${GOUD_VLAK};border:1px solid ${GOUD_LICHT};text-align:center;font-size:12px;font-weight:700;color:${INKT};">${i + 1}</span></td>
      <td valign="top" style="padding:1px 0 10px;font-size:14px;line-height:1.6;color:${TEKST};">${s}</td>
    </tr>`
    )
    .join("")}</table>`
}

/** Vinkjes met een kopje en een zin */
export function vinkjes(items: [string, string][]): string {
  return vlak(
    items
      .map(([k, t]) => `<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:${TEKST};"><span style="color:#059669;font-weight:700;">&#10003;</span>&nbsp; <strong style="color:${INKT};">${k}</strong> ${t}</p>`)
      .join("")
  )
}

/** De hele mail: kop, inhoud, voet */
export function omlijsting({
  gezicht: g,
  kop,
  subkop,
  inhoud,
  voetExtra,
  afzender,
}: {
  gezicht: Gezicht
  /** De grote regel in de kop */
  kop: string
  /** Een regel eronder, in de kop */
  subkop?: string
  inhoud: string
  /** Een regel boven de vaste voettekst, bijvoorbeeld waarom je dit krijgt */
  voetExtra?: string
  /** De ondertekening, standaard het team van SayingYes; leeg laten voor geen */
  afzender?: string | null
}): string {
  const onder = afzender === undefined ? "Het team van SayingYes" : afzender
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${g.pagina};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${g.pagina};padding:36px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <tr>
          <td bgcolor="${g.kopBg}" style="background-color:${g.kopBg};padding:40px 40px 34px;text-align:center;">
            <p style="margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:0.04em;color:${g.kopTekst};font-family:${g.woordmerkFont};">${g.woordmerk}</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;"><tr>
              <td style="width:36px;height:1px;background-color:${g.accent};opacity:0.8;"></td>
              <td style="padding:0 8px;font-size:9px;color:${g.accent};line-height:1;">&#9670;</td>
              <td style="width:36px;height:1px;background-color:${g.accent};opacity:0.8;"></td>
            </tr></table>
            <h1 style="margin:0;font-size:24px;font-weight:700;color:${g.kopTekst};line-height:1.25;">${kop}</h1>
            ${subkop ? `<p style="margin:10px 0 0;font-size:14px;color:${g.kopTekst};opacity:0.8;">${subkop}</p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:34px 40px 8px;">
            ${inhoud}
            ${onder ? `<p style="margin:8px 0 24px;font-size:15px;line-height:1.7;color:${TEKST};">${onder}</p>` : ""}
          </td>
        </tr>
        <tr>
          <td bgcolor="${IVOOR}" style="background-color:${IVOOR};padding:20px 40px;text-align:center;border-top:1px solid ${GOUD_LICHT};">
            ${voetExtra ? `<p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${ZACHT};">${voetExtra}</p>` : ""}
            <p style="margin:0;font-size:12px;line-height:1.6;color:${ZACHT};">${g.voet}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
