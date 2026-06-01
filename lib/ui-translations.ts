export type UILocale = "nl" | "en" | "de" | "fr" | "es"

export const uiTranslations = {
  nl: {
    home: "Home",
    verhaal: "Ons Verhaal",
    programma: "Programma",
    informatie: "Informatie",
    cadeautips: "Cadeautips",
    ceremoniemeesters: "Ceremoniemeesters",
    rsvp: "RSVP",
    fotos: "Foto's",
  },
  en: {
    home: "Home",
    verhaal: "Our Story",
    programma: "Program & Timeline",
    informatie: "Details",
    cadeautips: "Gift Ideas",
    ceremoniemeesters: "Masters of Ceremonies",
    rsvp: "RSVP",
    fotos: "Photos",
  },
  de: {
    home: "Startseite",
    verhaal: "Unsere Geschichte",
    programma: "Programm",
    informatie: "Informationen",
    cadeautips: "Geschenkideen",
    ceremoniemeesters: "Zeremonienmeister",
    rsvp: "RSVP",
    fotos: "Fotos",
  },
  fr: {
    home: "Accueil",
    verhaal: "Notre Histoire",
    programma: "Programme",
    informatie: "Informations",
    cadeautips: "Idées Cadeaux",
    ceremoniemeesters: "Maîtres de Cérémonie",
    rsvp: "RSVP",
    fotos: "Photos",
  },
  es: {
    home: "Inicio",
    verhaal: "Nuestra Historia",
    programma: "Programa",
    informatie: "Información",
    cadeautips: "Ideas de Regalo",
    ceremoniemeesters: "Maestros de Ceremonia",
    rsvp: "RSVP",
    fotos: "Fotos",
  },
} as const

export type UIKey = keyof (typeof uiTranslations)["nl"]

export const PAGE_TYPE_TO_KEY: Record<string, UIKey> = {
  Home: "home",
  OnsVerhaal: "verhaal",
  Programma: "programma",
  Informatie: "informatie",
  Cadeautips: "cadeautips",
  Fotos: "fotos",
  Ceremoniemeesters: "ceremoniemeesters",
  RSVP: "rsvp",
}

export function getUILabel(locale: string, key: UIKey): string {
  const dict = uiTranslations[locale as UILocale] ?? uiTranslations.nl
  return dict[key]
}
