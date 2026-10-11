// Het voorbeeldpaar van de marketingsite: Sophie en Daan. Eén plek voor hun
// kaart en hun site, zodat de envelop op de homepage, de voorbeeldkaart en de
// voorbeeldsite (app/voorbeeld-site) bij elkaar horen: dezelfde namen, datum,
// stijl en ontwerp. Sinds 11 oktober 2026 zoals Michiels eigen testsite
// (michiel-en-lindsey.sayingyes.nl): stijl Zand, de krans met takjes, de site
// in Montserrat, de namen op de kaart ook in Montserrat en op de homepage in
// de Italiana van het ontwerp. Eerder schaduwhart in Smaragd.

import { displayTeksten, type CardDisplay } from "./cards"
import { siteOpeningData, type SiteOpeningData } from "./site-opening"
import { getStyleConfig, type SC } from "./event-styles"

export const VOORBEELD = {
  namen: "Sophie & Daan",
  initialen: "S&D",
  datum: "2027-06-12",
  datumTekst: "12 juni 2027",
  locatie: "Landgoed Duno, Doorwerth",
  stijl: "zand",
  ontwerp: "kranstakjes" as const,
  /** De letter van de site (koppen, menu, tekst) en van de namen op de kaart */
  siteLetter: "montserrat",
  kaartNamenLetter: "montserrat",
  /** De namen in het ontwerp op de homepage en achter de deuren */
  namenLetter: "italiana",
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
    namenFont: VOORBEELD.kaartNamenLetter,
    tijd: VOORBEELD.tijden,
    dresscode: VOORBEELD.dresscode,
    ...displayTeksten("nl"),
  }
}

/** Het beginscherm achter de deuren van de kaart, en waar de site mee begint */
export function voorbeeldOpening(): SiteOpeningData {
  return siteOpeningData(
    VOORBEELD.stijl,
    { fontFrameNames: VOORBEELD.namenLetter, fontPageTitles: VOORBEELD.siteLetter },
    VOORBEELD.namen,
    VOORBEELD.datum,
  )
}

/** De stijl van het paar met hun letters, voor de kaart, de envelop en de site */
export function voorbeeldStijl(): SC {
  return getStyleConfig(VOORBEELD.stijl, { fontPageTitles: VOORBEELD.siteLetter, fontFrameNames: VOORBEELD.namenLetter })
}
