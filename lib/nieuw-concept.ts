// Het beginpunt van een nieuwe trouwwebsite.
//
// Staat hier omdat er twee wegen naartoe zijn: het aanmaakformulier, en de
// knop Website in de kaartbouwer. Die tweede gaf eerst zijn eigen half
// ingevulde versie door, en dan stonden de namen drie keer onder elkaar op de
// voorpagina omdat de kop, het kader en de initialen allemaal hetzelfde
// invulden. Eén beginpunt voor beide wegen voorkomt dat.

export const LS_WEBSITE_CONCEPT = "sayingyes_draft"
export const LS_WEBSITE_INHOUD = "sayingyes_content"

/**
 * Tijdstip waarop de kaartbouwer een concept klaarzette voor de websitebouwer.
 *
 * Dit bestaat omdat de overdracht alleen werkte als je niet was ingelogd. Was
 * je dat wel, dan keek de websitebouwer alleen naar de server, vond daar niets
 * en zette je in het aanmaakformulier. Precies wat we met de knop Website
 * wilden voorkomen: het moet voelen alsof je in dezelfde bouwer blijft.
 *
 * Een los tijdstip en niet alleen het concept zelf, want een oud concept in de
 * browser mag een gewoon bezoek aan de bouwer niet overnemen.
 */
export const LS_NAAR_WEBSITE = "sayingyes_naar_website"

/** Hoe lang zo'n overdracht geldig is. Eén klik hoort binnen een uur te volgen. */
export const NAAR_WEBSITE_GELDIG_MS = 60 * 60 * 1000

export const DEFAULT_PROGRAMMA = {
  layout: "timeline",
  items: [
    { id: "p1", time: "13:00", title: "Aankomst",  description: "Welkom bij onze trouwdag", iconId: "welkom"  },
    { id: "p2", time: "14:00", title: "Ceremonie", description: "Het ja-woord moment",      iconId: "ringen"  },
    { id: "p3", time: "17:00", title: "Borrel",    description: "Toasten op het geluk",     iconId: "toost"   },
    { id: "p4", time: "19:00", title: "Diner",     description: "Geniet van het feestmaal", iconId: "cutlery" },
    { id: "p5", time: "22:00", title: "Feest",     description: "Dansen tot in de nacht",   iconId: "feest"   },
  ],
}

export const DEFAULT_PRAKTISCH = {
  items: [
    { id: "1", iconId: "dresscode",  title: "Dresscode",      text: "Wij zien jullie graag in feestelijke kleding. Voel je vooral comfortabel, maar laat de spijkerbroek liever thuis!" },
    { id: "2", iconId: "cutlery",    title: "Dieetwensen",    text: "Heb je speciale dieetwensen of allergieën? Laat het onze ceremoniemeester uiterlijk 4 weken van tevoren weten, dan houdt de catering daar graag rekening mee." },
    { id: "3", iconId: "geen_smart", title: "Geen telefoons", text: "Wij willen onze ceremonie graag 'unplugged' beleven. Geniet in het moment met ons mee en laat de telefoons lekker in de tas zitten. Onze fotograaf legt alles vast!" },
  ],
}

/** "Michiel & Jimi" wordt "M|J". Het streepje is de scheiding in het kader. */
export function initialenMetStreep(namen: string): string {
  const delen = namen
    .split(/\s*&\s*|\s+en\s+|\r?\n/i)
    .map((n) => n.trim()[0]?.toUpperCase())
    .filter(Boolean)
  return delen.length >= 2 ? `${delen[0]}|${delen[1]}` : delen[0] ?? "J|C"
}

export function welkomstTekst(namen: string): string {
  return `Welkom op onze eigen trouwwebsite! Na een fantastisch aanzoek (vraag ons gerust naar het hele verhaal onder het genot van een wijntje), is het nu tijd voor het echte werk.

Omdat we deze dag het liefst vieren met onze favoriete mensen, hebben we deze website gemaakt. Hier vind je alle ins & outs over onze grote dag. Van het programma tot de dresscode en de routebeschrijving naar de locatie.

Kijk gerust rond en vergeet niet om via het menu jullie RSVP in te vullen. We kunnen niet wachten om de liefde met jullie te vieren!

Liefs,
${namen}`
}

/**
 * Het concept waarmee de websitebouwer opent. De kop van de pagina is "De
 * bruiloft van ..." en het kader toont alleen de namen; die twee moeten
 * verschillen, anders staat dezelfde regel twee keer onder elkaar.
 */
export function nieuwWebsiteConcept({
  namen,
  datum,
  locatie,
  style = "ivoor",
  slug,
  email,
}: {
  namen: string
  datum: string
  locatie: string
  style?: string
  slug?: string
  email?: string
}) {
  const schoneNamen = namen.trim() || "Ons"
  const schoneLocatie = locatie.trim()

  return {
    type: "bruiloft",
    naam: `De bruiloft van ${schoneNamen}`,
    slug,
    style,
    nav_title: schoneNamen,
    nav_layout: "split",
    datum,
    locatie: schoneLocatie,
    email,
    aangemaakt: new Date().toISOString(),
    use_frame: true,
    frame_style: "olive-square",
    frame_names: schoneNamen,
    frame_location: schoneLocatie,
    initials: initialenMetStreep(schoneNamen),
    font_hero: "cormorant",
    font_initials: "cormorant",
    font_frame_names: "cormorant",
    font_page_titles: "cormorant",
    frameInitialsSize: 8,
    frameNamesSize: 5.5,
    frameDateSize: 2.8,
    frameLocationSize: 2.8,
    homepage_settings: {
      layout: "editorial",
      subtitleVisible: false, subtitleText: "", subtitleFont: "cormorant", subtitleSize: 1.1,
      // De kop staat uit: het kader toont de namen al. Aan zou dezelfde regel
      // er een tweede keer onder zetten.
      hoofdtitelVisible: false, hoofdtitelFont: "cormorant", hoofdtitelSize: 2,
      datumFont: "cormorant", datumSize: 2.8, datumNotatie: "uitgeschreven",
      locatieFont: "cormorant", locatieSize: 2.8, titlePosition: "under",
      initialsVisible: true, frameNamesVisible: true, datumVisible: true, locatieVisible: true,
      siteLayout: "boxed", pageMode: "multi",
    },
    homeContent: {
      title: "Wij gaan trouwen!",
      body: welkomstTekst(schoneNamen),
      align: "center",
      titleSize: 1.6,
      bodySize: 1.05,
    },
  }
}
