// Het voorbeeldpaar van de marketingsite: Sophie en Daan. Eén plek voor hun
// kaart en hun site, zodat de envelop op de homepage, de voorbeeldkaart en de
// voorbeeldsite (app/voorbeeld-site) bij elkaar horen: dezelfde namen, datum,
// stijl en ontwerp. De kaart is het ontwerp dat Michiel het mooist vond
// (schaduwhart, 2 oktober 2026), met de tijden en dresscode op de kaart.

import { displayTeksten, type CardDisplay } from "./cards"
import { siteOpeningData, type SiteOpeningData } from "./site-opening"

export const VOORBEELD = {
  namen: "Sophie & Daan",
  initialen: "S&D",
  datum: "2027-06-12",
  datumTekst: "12 juni 2027",
  locatie: "Landgoed Duno, Doorwerth",
  stijl: "emerald",
  ontwerp: "schaduwhart" as const,
  tijden: "13:00 tot 23:00 uur",
  dresscode: "Feestelijk chique",
} as const

/** De voorbeeldsite op sayingyes.nl, waar de knop op de kaart heen gaat */
export const VOORBEELD_SITE_URL = "/voorbeeld-site"

/** De kaart van Sophie en Daan, zoals een gast hem krijgt */
export function voorbeeldKaart(): CardDisplay {
  return {
    heading: "Wij gaan trouwen",
    names: VOORBEELD.namen,
    dateText: VOORBEELD.datumTekst,
    datumIso: VOORBEELD.datum,
    location: VOORBEELD.locatie,
    inviteLine: null,
    timeText: null,
    message: "Wij gaan trouwen en vieren dat graag met jou. Kom je ook?",
    eigenBericht: true,
    photoUrl: null,
    design: VOORBEELD.ontwerp,
    animatie: "feestelijk",
    detailsStand: "op",
    detailsStijl: "sierlijn",
    tijd: VOORBEELD.tijden,
    dresscode: VOORBEELD.dresscode,
    ...displayTeksten("nl"),
  }
}

/** Het beginscherm achter de deuren van de kaart, en waar de site mee begint */
export function voorbeeldOpening(): SiteOpeningData {
  return siteOpeningData(VOORBEELD.stijl, {}, VOORBEELD.namen, VOORBEELD.datum)
}
