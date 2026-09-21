// De checklist voor het plannen van een bruiloft.
//
// Michiels voorstel van 21 september 2026, en zijn tweede opmerking erover is
// wat dit bestand zijn vorm geeft: de checklist moet vanaf het begin zichtbaar
// zijn, en de Save the Date is er zelf een punt van. Onze eigen producten staan
// dus niet apart, ze staan tussen de dingen die niets met ons te maken hebben.
//
// Daar zit ook de waarde. Een lijst met alleen onze producten is een menu; een
// lijst met de hele bruiloft erin is planningskennis, en dan is het logisch dat
// vier van de dertig punten bij ons gebeuren. Wie de lijst gebruikt en niets
// koopt heeft er nog steeds iets aan gehad, en dat is precies wat Michiel wil.
//
// Waar wij het weten, vinkt de lijst zichzelf af. Niemand hoort ons te
// vertellen dat zijn Save the Date verstuurd is: dat weten we.
//
// Geen imports, zodat dit ook in clientcode bruikbaar is. De fasen komen uit
// lib/fasen.ts, maar als losse tekst, zodat dit bestand vrij blijft.

export type ChecklistFase =
  | "voorbereiden"
  | "save_the_date"
  | "uitnodigen"
  | "najagen"
  | "aftellen"
  | "na_de_dag"

/** Wat we van de bruiloft weten, om punten vanzelf af te kunnen vinken. */
export interface Signalen {
  datumGezet: boolean
  locatieGezet: boolean
  gastenInLijst: number
  stdVerstuurd: boolean
  invVerstuurd: boolean
  siteLive: boolean
  aanmeldingen: number
  aantallenDoorgegeven: boolean
  fotos: number
}

export const GEEN_SIGNALEN: Signalen = {
  datumGezet: false,
  locatieGezet: false,
  gastenInLijst: 0,
  stdVerstuurd: false,
  invVerstuurd: false,
  siteLive: false,
  aanmeldingen: 0,
  aantallenDoorgegeven: false,
  fotos: 0,
}

export interface ChecklistPunt {
  id: string
  wat: string
  fase: ChecklistFase
  /** Waarom het nu moet, of waar het meestal fout gaat. Eén regel. */
  waarom?: string
  /** Dit punt gebeurt bij ons. Dan staat er een knop bij in het dashboard. */
  bijOns?: { naar: string; knop: string }
  /** Wij weten of dit gedaan is, dus de klant hoeft niets af te vinken. */
  vanzelf?: (s: Signalen) => boolean
}

// ── De lijst ────────────────────────────────────────────────────────────────
// Op volgorde van wanneer je het doet. De levertijden en termijnen hieronder
// zijn de gebruikelijke in Nederland; het zijn de dingen waar mensen achteraf
// zeggen dat ze er eerder aan hadden moeten beginnen.
export const CHECKLIST: readonly ChecklistPunt[] = [
  // ── Voorbereiden ──────────────────────────────────────────────────────────
  {
    id: "datum",
    wat: "Kies je trouwdatum",
    fase: "voorbereiden",
    waarom: "Hieraan hangt al het andere, dus dit is het enige dat echt eerst moet.",
    vanzelf: (s) => s.datumGezet,
  },
  {
    id: "locatie",
    wat: "Boek je ceremonie- en feestlocatie",
    fase: "voorbereiden",
    waarom: "Populaire locaties zijn anderhalf jaar vooruit al vol, vooral in juni en september.",
    vanzelf: (s) => s.locatieGezet,
  },
  {
    id: "gemeente",
    wat: "Meld je voorgenomen huwelijk bij de gemeente",
    fase: "voorbereiden",
    waarom: "Dat kan tot een jaar vooruit, en het moet uiterlijk twee weken voor de dag.",
  },
  {
    id: "budget",
    wat: "Spreek samen een budget af",
    fase: "voorbereiden",
    waarom: "Eerder een getal dan een wensenlijst, want de wensenlijst groeit altijd mee.",
  },
  {
    id: "getuigen",
    wat: "Vraag je getuigen",
    fase: "voorbereiden",
    waarom: "Twee tot vier, en ze moeten die dag echt kunnen.",
  },
  {
    id: "gastenlijst",
    wat: "Maak je gastenlijst",
    fase: "voorbereiden",
    waarom: "Het aantal gasten bepaalt je locatie, je catering en je budget, dus dit komt vroeg.",
    bijOns: { naar: "/dashboard#gasten", knop: "Naar je gastenlijst" },
    vanzelf: (s) => s.gastenInLijst > 0,
  },
  {
    id: "save-the-date",
    wat: "Stuur je Save the Date",
    fase: "voorbereiden",
    waarom: "Zodat mensen de dag vrijhouden voordat ze iets anders plannen.",
    bijOns: { naar: "/kaart-maken?type=save_the_date", knop: "Save the Date maken" },
    vanzelf: (s) => s.stdVerstuurd,
  },

  // ── Save the Date ─────────────────────────────────────────────────────────
  {
    id: "fotograaf",
    wat: "Leg je fotograaf vast",
    fase: "save_the_date",
    waarom: "Goede fotografen zitten een jaar vooruit vol, en dit is niets om op te bezuinigen.",
  },
  {
    id: "catering",
    wat: "Regel je catering of diner",
    fase: "save_the_date",
    waarom: "Vraag meteen wanneer ze je definitieve aantallen willen hebben.",
  },
  {
    id: "kleding",
    wat: "Begin met zoeken naar je trouwkleding",
    fase: "save_the_date",
    waarom: "Een trouwjurk heeft vaak vier tot zes maanden levertijd, plus tijd om te passen.",
  },
  {
    id: "ringen",
    wat: "Zoek je ringen uit",
    fase: "save_the_date",
    waarom: "Op maat gemaakte ringen duren zes tot acht weken.",
  },
  {
    id: "ceremoniemeester",
    wat: "Vraag een ceremoniemeester",
    fase: "save_the_date",
    waarom: "Iemand die de dag zelf de vragen krijgt, zodat jullie dat niet hoeven.",
  },
  {
    id: "muziek",
    wat: "Regel muziek voor de ceremonie en de avond",
    fase: "save_the_date",
  },

  // ── Uitnodigen ────────────────────────────────────────────────────────────
  {
    id: "trouwkaart",
    wat: "Maak en verstuur je trouwkaart",
    fase: "uitnodigen",
    waarom: "Drie tot vier maanden vooraf, met alle tijden en de dresscode erop.",
    bijOns: { naar: "/kaart-maken?type=trouwkaart", knop: "Trouwkaart maken" },
    vanzelf: (s) => s.invVerstuurd,
  },
  {
    id: "website",
    wat: "Zet je trouwwebsite live",
    fase: "uitnodigen",
    waarom: "Voor alles wat niet op de kaart past: route, programma, cadeautips.",
    bijOns: { naar: "/bouwen", knop: "Naar de websitebouwer" },
    vanzelf: (s) => s.siteLive,
  },
  {
    id: "dagprogramma",
    wat: "Leg je dagprogramma vast",
    fase: "uitnodigen",
    waarom: "Gasten zoeken op de dag zelf op hun telefoon op hoe laat ze waar moeten zijn.",
    bijOns: { naar: "/bouwen", knop: "Programma bewerken" },
  },
  {
    id: "proeverij",
    wat: "Ga op proeverij bij je cateraar",
    fase: "uitnodigen",
  },
  {
    id: "bloemen",
    wat: "Regel bloemen en decoratie",
    fase: "uitnodigen",
  },
  {
    id: "vervoer",
    wat: "Regel vervoer voor jullie en voor je gasten",
    fase: "uitnodigen",
    waarom: "Denk ook aan gasten die 's avonds terug moeten en niet kunnen rijden.",
  },

  // ── Najagen ───────────────────────────────────────────────────────────────
  {
    id: "najagen",
    wat: "Jaag de gasten na die nog niet gereageerd hebben",
    fase: "najagen",
    waarom: "Er reageert altijd een kwart niet zonder dat je erachteraan gaat.",
    bijOns: { naar: "/dashboard#gasten", knop: "Wie nog niet reageerde" },
    vanzelf: (s) => s.aanmeldingen > 0,
  },
  {
    id: "haar-make-up",
    wat: "Doe een proefsessie haar en make-up",
    fase: "najagen",
  },
  {
    id: "speeches",
    wat: "Stem speeches en verrassingen af",
    fase: "najagen",
    waarom: "Met je ceremoniemeester, zodat er niet drie mensen hetzelfde verhaal vertellen.",
  },
  {
    id: "ceremonie",
    wat: "Neem de ceremonie door met je trouwambtenaar",
    fase: "najagen",
  },

  // ── Aftellen ──────────────────────────────────────────────────────────────
  {
    id: "aantallen",
    wat: "Geef je definitieve aantallen door aan je locatie",
    fase: "aftellen",
    waarom: "Te laat betekent betalen voor gasten die niet komen: de inkoop is dan al gedaan.",
    bijOns: { naar: "/dashboard#gasten", knop: "Overzicht voor de cateraar" },
    vanzelf: (s) => s.aantallenDoorgegeven,
  },
  {
    id: "tafelindeling",
    wat: "Maak je tafelindeling",
    fase: "aftellen",
  },
  {
    id: "laatste-nieuws",
    wat: "Laat je gasten weten wat er nog veranderd is",
    fase: "aftellen",
    waarom: "Een ander tijdstip of een gewijzigde route bereikt nooit iedereen via de appgroep.",
    bijOns: { naar: "/dashboard#gasten", knop: "Bericht sturen" },
  },
  {
    id: "fotomuur",
    wat: "Druk de QR-code van je fotomuur af",
    fase: "aftellen",
    waarom: "Eén code op de tafels, en je gasten uploaden zonder app.",
    bijOns: { naar: "/dashboard#fotos", knop: "QR-code downloaden" },
  },
  {
    id: "betalingen",
    wat: "Betaal de laatste facturen van je leveranciers",
    fase: "aftellen",
  },
  {
    id: "noodtas",
    wat: "Pak een tas met naald, draad, pleisters en een powerbank",
    fase: "aftellen",
    waarom: "Iedereen die dit oversloeg heeft er die dag om gevraagd.",
  },

  // ── Na de dag ─────────────────────────────────────────────────────────────
  {
    id: "fotos-binnen",
    wat: "Haal de foto's van je gasten binnen",
    fase: "na_de_dag",
    waarom: "Ze staan bij ons klaar, maar je site gaat een keer uit.",
    bijOns: { naar: "/dashboard#fotos", knop: "Foto's downloaden" },
    vanzelf: (s) => s.fotos > 0,
  },
  {
    id: "bedankjes",
    wat: "Stuur je bedankjes",
    fase: "na_de_dag",
    waarom: "Binnen een maand, en het liefst met een foto erbij.",
  },
  {
    id: "naamgebruik",
    wat: "Geef je naamgebruik door waar dat nodig is",
    fase: "na_de_dag",
    waarom: "Als een van jullie de naam van de ander gaat gebruiken.",
  },
] as const

// ── Wat de klant zelf toevoegt ──────────────────────────────────────────────
export interface EigenPunt {
  id: string
  wat: string
  fase: ChecklistFase
  af: boolean
}

/** Wat er in events.checklist staat. */
export interface ChecklistStand {
  /** De id's van onze punten die de klant heeft afgevinkt. */
  af?: string[]
  /** Punten die de klant zelf heeft toegevoegd. */
  eigen?: EigenPunt[]
}

export const MAX_EIGEN_PUNTEN = 40
export const MAX_PUNT_TEKST = 120

/** Vorm van de kolom checklist, met alle rommel eruit. */
export function leesStand(waarde: unknown): ChecklistStand {
  const v = (waarde ?? {}) as ChecklistStand
  const geldig = new Set(CHECKLIST.map((p) => p.id))
  const fasen = new Set<string>([
    "voorbereiden",
    "save_the_date",
    "uitnodigen",
    "najagen",
    "aftellen",
    "na_de_dag",
  ])
  return {
    af: Array.isArray(v.af) ? v.af.filter((s) => typeof s === "string" && geldig.has(s)) : [],
    eigen: Array.isArray(v.eigen)
      ? v.eigen
          .filter(
            (p): p is EigenPunt =>
              !!p && typeof p.id === "string" && typeof p.wat === "string" && fasen.has(p.fase)
          )
          .slice(0, MAX_EIGEN_PUNTEN)
          .map((p) => ({ ...p, wat: p.wat.slice(0, MAX_PUNT_TEKST), af: p.af === true }))
      : [],
  }
}

// ── Afgevinkt of niet ───────────────────────────────────────────────────────

export interface PuntStand {
  punt: ChecklistPunt
  af: boolean
  /** Afgevinkt doordat wij het weten, niet doordat de klant het aanvinkte. */
  doorOns: boolean
}

/**
 * Van elk punt of het af is. Wat wij weten gaat voor: een Save the Date die
 * verstuurd is, is verstuurd, ook als de klant het vinkje nooit heeft
 * aangeraakt. En omgekeerd kan de klant zo'n punt niet per ongeluk uitzetten.
 */
export function standVan(
  stand: ChecklistStand,
  signalen: Signalen = GEEN_SIGNALEN
): PuntStand[] {
  const handmatig = new Set(stand.af ?? [])
  return CHECKLIST.map((punt) => {
    const doorOns = punt.vanzelf ? punt.vanzelf(signalen) : false
    return { punt, af: doorOns || handmatig.has(punt.id), doorOns }
  })
}

/** Hoeveel er af is, van hoeveel. Eigen punten tellen mee. */
export function voortgang(
  stand: ChecklistStand,
  signalen: Signalen = GEEN_SIGNALEN
): { af: number; totaal: number } {
  const onze = standVan(stand, signalen)
  const eigen = stand.eigen ?? []
  return {
    af: onze.filter((p) => p.af).length + eigen.filter((p) => p.af).length,
    totaal: onze.length + eigen.length,
  }
}

/** De punten van één fase, onze punten en die van de klant door elkaar. */
export function puntenVanFase(
  fase: ChecklistFase,
  stand: ChecklistStand,
  signalen: Signalen = GEEN_SIGNALEN
): { id: string; wat: string; waarom?: string; af: boolean; doorOns: boolean; bijOns?: ChecklistPunt["bijOns"]; eigen: boolean }[] {
  const onze = standVan(stand, signalen)
    .filter((p) => p.punt.fase === fase)
    .map((p) => ({
      id: p.punt.id,
      wat: p.punt.wat,
      waarom: p.punt.waarom,
      af: p.af,
      doorOns: p.doorOns,
      bijOns: p.punt.bijOns,
      eigen: false,
    }))

  const eigen = (stand.eigen ?? [])
    .filter((p) => p.fase === fase)
    .map((p) => ({ id: p.id, wat: p.wat, af: p.af, doorOns: false, eigen: true }))

  return [...onze, ...eigen]
}
