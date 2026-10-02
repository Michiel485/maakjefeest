import type { Metadata } from "next"
import Zoekpagina, { type ZoekpaginaInhoud } from "@/components/marketing/Zoekpagina"
import { MARKETING_URL } from "@/lib/site-url"
import { PLANS, RENEWAL_MONTHS, RENEWAL_PRICE, formatEur } from "@/lib/plans"

const PRIJS = formatEur(PLANS.compleet.price)
const TITEL = "Trouwwebsite maken: jullie eigen site met kaart, aanmelden en fotomuur"
const OMSCHRIJVING = `Maak jullie trouwwebsite in een kwartier, zonder technische kennis. Programma, route, aanmelden, foto's en een live fotomuur, in dezelfde stijl als jullie trouwkaart. ${PRIJS} voor een jaar, geen abonnement.`

export const metadata: Metadata = {
  title: TITEL,
  description: OMSCHRIJVING,
  alternates: { canonical: `${MARKETING_URL}/trouwwebsite-maken` },
  openGraph: { title: TITEL, description: OMSCHRIJVING, url: `${MARKETING_URL}/trouwwebsite-maken`, siteName: "SayingYes", locale: "nl_NL", type: "website" },
}

const inhoud: ZoekpaginaInhoud = {
  kopje: "Trouwwebsite maken",
  h1: <>Een trouwwebsite die <em style={{ fontStyle: "italic", color: "#C5A059" }}>begint bij jullie kaart</em></>,
  intro: "Jullie gasten tikken op de trouwkaart, de kaart gaat als twee deuren open en daar staat jullie website: in dezelfde kleuren en letters. Het programma als tijdlijn, de route, cadeautips, de ceremoniemeesters, aanmelden en op de dag zelf de fotomuur.",
  stappen: [
    ["Kies een stijl", "Vijftien stijlen met eigen kleuren en letters, voor de kaart en de site samen. Een foto of het ontwerp van jullie kaart als opening."],
    ["Vul de onderdelen", "Jullie verhaal in momenten, het programma, praktische informatie, cadeautips, wie de ceremoniemeesters zijn. Alles staat er al als voorbeeld; je past het aan."],
    ["Zet hem live", "Jullie krijgen een eigen adres, zoals jullienamen.sayingyes.nl. Met een wachtwoord als je wilt. Pas dan betaal je."],
  ],
  voordelenKop: "Alles voor jullie gasten op één plek",
  voordelenTekst: "Een trouwwebsite is het antwoord op alle vragen die je anders honderd keer per app krijgt: hoe laat, waar, wat trek ik aan, wat willen jullie als cadeau. En na de dag leeft hij door met de foto's.",
  voordelen: [
    "Opening met jullie foto of het ontwerp van de kaart, met aftellen en een agendaknop",
    "Programma als getekende tijdlijn, op de dag zelf met 'nu'",
    "Aanmelden in drie stappen, en een gastenlijst die zichzelf vult",
    "Live fotomuur: gasten scannen een QR-code en hun foto's verschijnen op de muur en op een groot scherm",
    "Na de dag zegt de site 'wij zijn getrouwd' en staan de foto's bovenaan",
    "Gastenboek uit de berichtjes van je gasten, zes talen, wachtwoord als je wilt",
  ],
  faq: [
    ["Wat kost een trouwwebsite?", `${PRIJS} voor een jaar, eenmalig. De trouwkaart en de Save the Date zitten erbij. Daarna verleng je als je wilt met ${RENEWAL_MONTHS} maanden voor ${formatEur(RENEWAL_PRICE).replace(",00", "")}, bijvoorbeeld voor de foto's. Geen abonnement.`],
    ["Heb ik technische kennis nodig?", "Nee. Je kiest een stijl, vult de onderdelen in en zet de site live. Alles werkt vanaf je telefoon."],
    ["Krijgen we een eigen webadres?", "Ja, jullie kiezen zelf een adres zoals jullienamen.sayingyes.nl. Makkelijk te onthouden en mooi op de kaart."],
    ["Is de site privé?", "De site staat niet in Google en je kunt hem afschermen met een wachtwoord of een geheime vraag die alleen jullie gasten kennen."],
    ["Hoe werkt de fotomuur?", "Gasten scannen een QR-code op hun tafel en zetten hun foto's op jullie fotomuur, met een berichtje. Op een beamer loopt een live slideshow. Achteraf download je alles als zip."],
    ["Kunnen we de site na publicatie nog aanpassen?", "Ja, altijd. Teksten, foto's, het programma, de stijl en zelfs het adres. Wijzigingen staan direct live."],
  ],
  pakket: "compleet",
  artikelen: [
    ["/tips/wat-zet-je-op-een-trouwwebsite", "Wat zet je op een trouwwebsite?"],
    ["/tips/fotos-verzamelen-bruiloft-qr-code", "Gastenfoto's verzamelen op je bruiloft met een QR-code"],
    ["/tips/rsvp-trouwerij-hoe-pak-je-dat-aan", "RSVP trouwerij: hoe pak je dat aan?"],
  ],
}

export default function TrouwwebsiteMakenPage() {
  return <Zoekpagina inhoud={inhoud} />
}
