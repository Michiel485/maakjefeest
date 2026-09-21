// Wat er in de band "Nu" van het dashboard staat.
//
// Uit het klantreisgesprek van 21 september 2026. Het dashboard was een platte
// lijst van vijf secties die er altijd allemaal stonden, waardoor een bruidspaar
// op negen maanden vooraf naar een trouwkaart keek waar het nog een half jaar
// niets mee doet. Nu staat per fase alleen wat op dat moment telt.
//
// Twee regels die ik hier bewust hard heb gemaakt:
//
// - Hoogstens drie tegels, en meestal twee. Vier tegels is weer een lijst.
// - Precies één tegel vraagt aandacht. Als alles schreeuwt, schreeuwt niets.
//
// Dit bestand rekent alleen; het tekent niets. Zo is het te testen zonder het
// dashboard te starten, net als lib/fasen.ts.

import type { Fase } from "./fasen"

/** Hoe een tegel erbij staat. Bepaalt de rand en het chipje. */
export type Toon = "vraagt" | "op_tijd" | "stil"

export interface Cijfer {
  wat: string
  waarde: number | string
  bij?: string
}

export interface Actie {
  wat: string
  naar: string
  /** De eerste actie is de gewone; de rest staat er rustiger bij. */
  stil?: boolean
}

export interface Tegel {
  id: string
  titel: string
  toon: Toon
  chip: string
  tekst?: string
  cijfers?: Cijfer[]
  /** Aandeel ja en nee, samen hoogstens honderd. Voor het standbalkje. */
  stand?: { ja: number; nee: number }
  acties?: Actie[]
}

// ── Wat het dashboard van de bruiloft weet ──────────────────────────────────
// Alles hieronder komt uit gegevens die het dashboard toch al ophaalt.
export interface Stand {
  /** Staat er een trouwdatum? */
  datum: string | null
  /** Staat er een locatie? */
  locatie: string | null
  /** Is er iets gepubliceerd, dus betaald? */
  live: boolean
  /** Mag deze bruiloft een trouwwebsite hebben? */
  magSite: boolean

  /** Hoeveel gasten in de lijst staan. */
  gasten: number
  huishoudens: number
  kinderen: number

  /** Reacties, per product. */
  stdVerstuurd: number
  stdGereageerd: number
  invVerstuurd: number
  invGereageerd: number

  /** Wie er komt, en wie nog niets liet weten. */
  komen: number
  nietKomen: number
  stil: number
  dieet: number
  allergie: number

  /** Kaarten. */
  heeftStdKaart: boolean
  heeftInvKaart: boolean
  stdKaartLink: string | null
  invKaartLink: string | null

  /** De deadline van de locatie. */
  deadlineNaam: string | null
  deadlineOver: number | null
  deadlineGedaan: boolean

  /** De fotomuur. */
  fotos: number
  fotomuurAan: boolean

  /** Hoeveel ontwerpen er klaarstaan. */
  ontwerpen: number
}

export const LEGE_STAND: Stand = {
  datum: null,
  locatie: null,
  live: false,
  magSite: false,
  gasten: 0,
  huishoudens: 0,
  kinderen: 0,
  stdVerstuurd: 0,
  stdGereageerd: 0,
  invVerstuurd: 0,
  invGereageerd: 0,
  komen: 0,
  nietKomen: 0,
  stil: 0,
  dieet: 0,
  allergie: 0,
  heeftStdKaart: false,
  heeftInvKaart: false,
  stdKaartLink: null,
  invKaartLink: null,
  deadlineNaam: null,
  deadlineOver: null,
  deadlineGedaan: false,
  fotos: 0,
  fotomuurAan: false,
  ontwerpen: 0,
}

const GASTEN = "/dashboard#gasten"
const KAARTEN = "/dashboard#kaarten"
const FOTOS = "/dashboard#fotos"

/** Percentage, afgerond, en nooit meer dan honderd samen. */
function deel(aantal: number, totaal: number): number {
  if (totaal <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((aantal / totaal) * 100)))
}

function meervoud(n: number, een: string, meer: string): string {
  return n === 1 ? een : meer
}

// ── De gastenlijsttegel ─────────────────────────────────────────────────────
// Komt in bijna elke fase terug, want de lijst is de rode draad. Hij ziet er
// alleen anders uit als hij nog leeg is: dan is hij een uitnodiging om te
// beginnen in plaats van een stand van zaken.
function gastenTegel(s: Stand, vraagt: boolean): Tegel {
  if (s.gasten === 0) {
    return {
      id: "gasten-leeg",
      titel: "Je gastenlijst",
      toon: vraagt ? "vraagt" : "stil",
      chip: "Leeg",
      tekst:
        "Begin hier, ook als je nog niets hebt gekocht. Typ of plak je gasten, of laat de lijst zich vullen door de reacties op je Save the Date.",
      acties: [
        { wat: "Lijst beginnen", naar: GASTEN },
        { wat: "Voorbeeld voor Excel", naar: GASTEN, stil: true },
      ],
    }
  }
  return {
    id: "gasten",
    titel: "Je gastenlijst",
    toon: vraagt ? "vraagt" : "op_tijd",
    chip: `${s.gasten} ${meervoud(s.gasten, "gast", "gasten")}`,
    cijfers: [
      { wat: "Huishoudens", waarde: s.huishoudens },
      { wat: "Kinderen", waarde: s.kinderen },
      { wat: "Nog niets", waarde: s.stil, bij: "gehoord" },
    ],
    acties: [
      { wat: "Lijst openen", naar: GASTEN },
      { wat: "Gasten toevoegen", naar: GASTEN, stil: true },
    ],
  }
}

// ── De tegels per fase ──────────────────────────────────────────────────────

export function tegelsVoor(fase: Fase, s: Stand): Tegel[] {
  switch (fase) {
    case "voorbereiden":
      return voorbereiden(s)
    case "save_the_date":
      return saveTheDate(s)
    case "uitnodigen":
      return uitnodigen(s)
    case "najagen":
      return najagen(s)
    case "aftellen":
      return aftellen(s)
    case "na_de_dag":
      return naDeDag(s)
  }
}

function voorbereiden(s: Stand): Tegel[] {
  const uit: Tegel[] = []

  // Zonder datum kun je niets plannen, dus dan is dat het enige dat vraagt.
  if (!s.datum) {
    uit.push({
      id: "datum",
      titel: "Je trouwdag",
      toon: "vraagt",
      chip: "Nog niet bekend",
      tekst:
        "Zet je datum, dan weten wij wanneer wat aan de beurt is. Staat hij nog niet vast? Zet dan een schatting, je kunt hem altijd wijzigen.",
      acties: [{ wat: "Datum invullen", naar: "/bouwen" }],
    })
    uit.push(gastenTegel(s, false))
    return uit
  }

  uit.push(gastenTegel(s, s.gasten === 0))

  uit.push(
    s.heeftStdKaart
      ? {
          id: "std",
          titel: "Save the Date",
          toon: s.gasten === 0 ? "stil" : "vraagt",
          chip: s.live ? "Klaar om te delen" : "Concept",
          tekst: s.live
            ? "Je kaart is geactiveerd. Deel de link met je gasten, en zet daarna in je lijst wie hem gehad heeft."
            : "Je ontwerp staat klaar. Activeer hem om de link te kunnen delen met je gasten.",
          acties: s.live
            ? [
                { wat: "Link delen", naar: KAARTEN },
                { wat: "Verder ontwerpen", naar: "/kaart-maken?type=save_the_date", stil: true },
              ]
            : [{ wat: "Activeren", naar: KAARTEN }, { wat: "Verder ontwerpen", naar: "/kaart-maken?type=save_the_date", stil: true }],
        }
      : {
          id: "std-nieuw",
          titel: "Save the Date",
          toon: "stil",
          chip: "Nog niets",
          tekst:
            "Het eerste dat je verstuurt, en het enige doel is dat mensen de dag vrijhouden voordat ze iets anders plannen.",
          acties: [{ wat: "Save the Date maken", naar: "/kaart-maken?type=save_the_date" }],
        }
  )

  return uit
}

function saveTheDate(s: Stand): Tegel[] {
  const uit: Tegel[] = []

  if (s.stdVerstuurd > 0) {
    uit.push({
      id: "std-stand",
      titel: "Save the Date",
      toon: "vraagt",
      chip: "Verstuurd",
      cijfers: [
        { wat: "Verstuurd", waarde: s.stdVerstuurd },
        { wat: "Gereageerd", waarde: s.stdGereageerd, bij: `van ${s.stdVerstuurd}` },
        { wat: "Komen", waarde: s.komen },
      ],
      stand: { ja: deel(s.komen, s.gasten), nee: deel(s.nietKomen, s.gasten) },
      acties: [
        { wat: "Wie nog niet reageerde", naar: GASTEN },
        { wat: "Kaart bekijken", naar: KAARTEN, stil: true },
      ],
    })
  } else {
    uit.push({
      id: "std-delen",
      titel: "Save the Date",
      toon: "vraagt",
      chip: s.heeftStdKaart ? "Nog niet gedeeld" : "Nog niets",
      tekst: s.heeftStdKaart
        ? "Deel de link met je gasten, en zet daarna in je lijst wie hem gehad heeft. Dan weet je straks wie je nog moet najagen."
        : "Je bruiloft is over een jaar of minder. Dit is het moment waarop mensen de dag nog vrij kunnen houden.",
      acties: s.heeftStdKaart
        ? [{ wat: "Link delen", naar: KAARTEN }, { wat: "Verstuurd zetten", naar: GASTEN, stil: true }]
        : [{ wat: "Save the Date maken", naar: "/kaart-maken?type=save_the_date" }],
    })
  }

  uit.push(gastenTegel(s, false))
  return uit
}

function uitnodigen(s: Stand): Tegel[] {
  const uit: Tegel[] = []

  uit.push(
    s.heeftInvKaart
      ? {
          id: "inv",
          titel: "Trouwkaart",
          toon: "vraagt",
          chip: s.invVerstuurd > 0 ? "Verstuurd" : "Nog niet verstuurd",
          tekst:
            s.invVerstuurd > 0
              ? "De uitnodiging is eruit. Houd in je lijst bij wie er gereageerd heeft."
              : "Je ontwerp staat klaar. Hierop staan de tijden en de dresscode, en de aanmelding met dieetwensen.",
          acties:
            s.invVerstuurd > 0
              ? [{ wat: "Naar je gastenlijst", naar: GASTEN }, { wat: "Kaart bekijken", naar: KAARTEN, stil: true }]
              : [{ wat: "Verder ontwerpen", naar: "/kaart-maken?type=trouwkaart" }, { wat: "Link delen", naar: KAARTEN, stil: true }],
        }
      : {
          id: "inv-nieuw",
          titel: "Trouwkaart",
          toon: "vraagt",
          chip: "Nog niets",
          tekst:
            "Drie tot vier maanden vooraf, met de tijden en de dresscode erop. Hier vraag je ook de dieetwensen en allergieën uit.",
          acties: [{ wat: "Trouwkaart maken", naar: "/kaart-maken?type=trouwkaart" }],
        }
  )

  if (s.magSite) {
    uit.push({
      id: "site",
      titel: "Jullie website",
      toon: s.live ? "op_tijd" : "stil",
      chip: s.live ? "Live" : "Nog niet live",
      tekst: s.live
        ? "Je site staat online. De trouwkaart kan ernaar verwijzen voor de route, het programma en de cadeautips."
        : "Voor alles wat niet op de kaart past: route, programma, cadeautips, ceremoniemeesters.",
      acties: s.live
        ? [{ wat: "Site bewerken", naar: "/bouwen" }]
        : [{ wat: "Live zetten", naar: "/bouwen" }],
    })
  }

  if (uit.length < 3) uit.push(gastenTegel(s, false))
  return uit
}

function najagen(s: Stand): Tegel[] {
  const uit: Tegel[] = []

  // Zonder lijst kunnen we niet zeggen wie er stil is. Dan is "iedereen heeft
  // gereageerd" een leugen, en is de lijst zelf het antwoord.
  if (s.gasten === 0) {
    return [
      gastenTegel(s, true),
      {
        id: "najagen-zonder-lijst",
        titel: "Wie heeft nog niet gereageerd?",
        toon: "stil",
        chip: "Niet te zien",
        tekst:
          "Dat kunnen we alleen zeggen als we weten wie je hebt uitgenodigd. Staat je lijst er, dan selecteer je de stille gasten met één druk.",
        acties: [{ wat: "Lijst beginnen", naar: GASTEN, stil: true }],
      },
    ]
  }

  uit.push({
    id: "stil",
    titel: "Nog geen antwoord",
    toon: s.stil > 0 ? "vraagt" : "op_tijd",
    chip: s.stil > 0 ? `${s.stil} ${meervoud(s.stil, "gast", "gasten")}` : "Iedereen heeft gereageerd",
    cijfers: [
      { wat: "Uitgenodigd", waarde: s.gasten },
      { wat: "Aangemeld", waarde: s.komen + s.nietKomen },
      { wat: "Stil", waarde: s.stil },
    ],
    tekst:
      s.stil > 0
        ? "Selecteer met één druk iedereen die nog niets liet weten. Wij schrijven het bericht, jij verstuurt het zelf."
        : "Alle gasten hebben laten weten of ze komen. Dat is eerder de uitzondering dan de regel.",
    acties:
      s.stil > 0
        ? [{ wat: "Wie nog niet reageerde", naar: GASTEN }]
        : [{ wat: "Lijst openen", naar: GASTEN, stil: true }],
  })

  uit.push({
    id: "aanmeldingen",
    titel: "Aanmeldingen",
    toon: "op_tijd",
    chip: `${s.komen + s.nietKomen} van ${s.gasten}`,
    stand: { ja: deel(s.komen, s.gasten), nee: deel(s.nietKomen, s.gasten) },
    cijfers: [
      { wat: "Dieetwensen", waarde: s.dieet },
      { wat: "Allergieën", waarde: s.allergie },
      { wat: "Kinderen", waarde: s.kinderen },
    ],
    acties: [{ wat: "Aanmeldingen bekijken", naar: GASTEN }],
  })

  return uit
}

function aftellen(s: Stand): Tegel[] {
  const uit: Tegel[] = []

  // De deadline van de locatie is het enige in deze fase dat geld kost als je
  // hem mist, dus die staat vooraan.
  if (s.deadlineGedaan) {
    uit.push({
      id: "deadline-af",
      titel: s.deadlineNaam ? `Aantallen naar ${s.deadlineNaam}` : "Definitieve aantallen",
      toon: "op_tijd",
      chip: "Doorgegeven",
      tekst: "Je hebt aangegeven dat de aantallen doorgegeven zijn, dus we houden er verder over op.",
      acties: [{ wat: "Overzicht voor de cateraar", naar: GASTEN, stil: true }],
    })
  } else {
    const over = s.deadlineOver
    uit.push({
      id: "deadline",
      titel: s.deadlineNaam ? `Aantallen naar ${s.deadlineNaam}` : "Definitieve aantallen doorgeven",
      toon: "vraagt",
      chip:
        over == null
          ? "Datum nog niet gezet"
          : over < 0
            ? `${Math.abs(over)} ${meervoud(Math.abs(over), "dag", "dagen")} te laat`
            : over === 0
              ? "Vandaag"
              : `Over ${over} ${meervoud(over, "dag", "dagen")}`,
      cijfers: [
        { wat: "Komen", waarde: s.komen },
        { wat: "Waarvan kind", waarde: s.kinderen },
        { wat: "Nog stil", waarde: s.stil },
      ],
      tekst:
        over == null
          ? "Zet hier wanneer je locatie je aantallen wil hebben, dan herinneren wij je eraan. Te laat betekent betalen voor gasten die niet komen: de inkoop is dan al gedaan."
          : "Wij sturen niets naar je locatie, dat blijft aan jou. We zorgen dat je het niet vergeet en dat de lijst klaarstaat.",
      acties:
        over == null
          ? [{ wat: "Deadline instellen", naar: GASTEN }]
          : [
              { wat: "Overzicht voor de cateraar", naar: GASTEN },
              { wat: "Doorgegeven", naar: GASTEN, stil: true },
            ],
    })
  }

  uit.push({
    id: "wijziging",
    titel: "Iets veranderd?",
    toon: "stil",
    chip: `${s.komen} ${meervoud(s.komen, "gast", "gasten")}`,
    tekst:
      "Een ander tijdstip of een gewijzigde route stuur je in één keer naar iedereen die komt. Via de appgroep bereik je nooit iedereen.",
    acties: [{ wat: "Bericht opstellen", naar: GASTEN }],
  })

  if (s.fotomuurAan) {
    uit.push({
      id: "fotomuur",
      titel: "Fotomuur",
      toon: "op_tijd",
      chip: "Klaar",
      tekst: "Eén QR-code op de tafels. Je gasten uploaden zonder app en zonder account.",
      acties: [{ wat: "QR-code downloaden", naar: FOTOS }],
    })
  }

  return uit
}

function naDeDag(s: Stand): Tegel[] {
  const uit: Tegel[] = []

  if (s.fotos > 0) {
    uit.push({
      id: "fotos",
      titel: "Foto's van je gasten",
      toon: "vraagt",
      chip: `${s.fotos} ${meervoud(s.fotos, "foto", "foto's")}`,
      cijfers: [{ wat: "Foto's", waarde: s.fotos }],
      tekst: "Haal ze binnen zolang je site nog live staat. Daarna gaat de deur dicht.",
      acties: [
        { wat: "Naar je fotomuur", naar: FOTOS },
        { wat: "Delen met gasten", naar: FOTOS, stil: true },
      ],
    })
  }

  uit.push({
    id: "terugblik",
    titel: "Jullie bruiloft",
    toon: uit.length === 0 ? "vraagt" : "stil",
    chip: "Geweest",
    cijfers: [
      { wat: "Gasten", waarde: s.gasten },
      { wat: "Kwamen", waarde: s.komen },
    ],
    tekst:
      "Je gastenlijst en je aanmeldingen blijven staan, dus je kunt nog exporteren wat je wilt bewaren. Bedankjes sturen kan met dezelfde lijst.",
    acties: [{ wat: "Lijst exporteren", naar: GASTEN }],
  })

  return uit
}

// ── De band Straks ──────────────────────────────────────────────────────────
// Wat er aankomt, ingeklapt. Dit is de plek waar een bruidspaar ziet dat de
// gastenlijst bestaat voordat hij hem nodig heeft, en waar bij iemand met een
// klein pakket de trouwkaart staat met de maand erbij in plaats van als
// verkoopknop. Dat is eerlijker en het werkt beter.
export interface StraksPunt {
  wat: string
  vanaf: string
  prijs: string
  uitleg: string[]
}

export function straksVoor(fase: Fase, s: Stand): StraksPunt[] {
  const uit: StraksPunt[] = []
  const na = (f: Fase[]) => f.includes(fase)

  uit.push({
    wat: "Je gastenlijst gebruiken",
    vanaf: "wanneer je wil",
    prijs: "Gratis",
    uitleg: [
      "Op twee manieren, en je hoeft hem niet te gebruiken. Zelf invullen geeft je de regie: je ziet precies wie je nog niet hebt gehad. Of je verstuurt gewoon je kaart en laat de lijst zich vullen door wie er antwoordt, dan hoef je niets in te voeren.",
      "Je kunt ze ook combineren. Begin makkelijk, en typ later de mensen erbij die niet reageerden.",
    ],
  })

  if (!s.heeftInvKaart && !na(["na_de_dag"])) {
    uit.push({
      wat: "Trouwkaart met aanmelding",
      vanaf: "vanaf 6 maanden vooraf",
      prijs: s.magSite ? "In je pakket" : "Vanaf €25",
      uitleg: [
        "Hierop staan de tijden en de dresscode, en je gasten vullen meteen hun dieetwensen en allergieën in.",
        "Verstuur je liever een papieren kaart? Dan kun je onze QR-code op je eigen ontwerp zetten, zodat je gasten toch digitaal kunnen aanmelden.",
      ],
    })
  }

  if (!s.magSite) {
    uit.push({
      wat: "Een trouwwebsite",
      vanaf: "vanaf 4 maanden vooraf",
      prijs: "Vanaf €49,99",
      uitleg: [
        "Voor alles wat niet op de kaart past: de route, het dagprogramma, cadeautips, je ceremoniemeesters en een fotomuur voor de dag zelf.",
      ],
    })
  }

  if (!s.deadlineNaam && !na(["na_de_dag"])) {
    uit.push({
      wat: "Aantallen naar de locatie",
      vanaf: "2 weken vooraf",
      prijs: "In je pakket",
      uitleg: [
        "Zet de naam van je locatie en de datum waarop zij je aantallen willen hebben. Wij herinneren je er tien dagen ervoor aan, op de dag zelf, en vragen daarna één keer of het gelukt is.",
        "Dit staat er omdat het misgaat: wie te laat is betaalt voor gasten die niet komen, want de inkoop is dan al gedaan.",
      ],
    })
  }

  if (s.magSite && !na(["na_de_dag"])) {
    uit.push({
      wat: "Fotomuur voor de dag zelf",
      vanaf: "vanaf 2 weken vooraf",
      prijs: "In je pakket",
      uitleg: [
        "Eén QR-code op de tafels. Je gasten uploaden hun foto's zonder app, en jullie zien ze diezelfde avond al binnenkomen.",
      ],
    })
  }

  return uit
}
