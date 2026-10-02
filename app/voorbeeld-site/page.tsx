import type { Metadata } from "next"
import Link from "next/link"
import EventNav from "@/app/events/[slug]/event-nav"
import EventHomePreview, { type HomepageSettings } from "@/components/EventHomePreview"
import StoryPreview from "@/components/StoryPreview"
import EventProgramPreview, { DEFAULT_PROGRAM_ITEMS } from "@/components/EventProgramPreview"
import PraktischPreview, { DEFAULT_PRAKTISCH_TILES } from "@/components/PraktischPreview"
import WishlistPreview, { DEFAULT_WISHLIST_ITEMS } from "@/components/WishlistPreview"
import EventMastersPreview from "@/components/EventMastersPreview"
import AanmeldFormulier from "@/components/AanmeldFormulier"
import SectieKop from "@/components/site/SectieKop"
import Sectie from "@/components/site/Sectie"
import Verschijn from "@/components/site/Verschijn"
import AanmeldKnop from "@/components/site/AanmeldKnop"
import Gastenboek from "@/components/site/Gastenboek"
import SiteOpening from "@/components/SiteOpening"
import BackToTopButton from "@/components/BackToTopButton"
import { formatDate, getStyleConfig } from "@/lib/event-styles"
import { VAN_KAART_SCRIPT } from "@/lib/site-opening"
import { MARKETING_URL } from "@/lib/site-url"
import { VOORBEELD, voorbeeldOpening } from "@/lib/voorbeeld"
import type { Moment } from "@/lib/verhaal"
import { GOUD, INKT, IVOOR } from "@/components/marketing/stijl"

// De trouwwebsite van Sophie en Daan (lib/voorbeeld.ts): een echte site,
// gebouwd met dezelfde onderdelen als de sites van klanten, zonder database.
// Twee redenen: wie op de homepage op "Bekijk onze website" tikt, komt hier
// door de deuren van de kaart, net als een gast. En "voorbeeld trouwwebsite"
// is iets waar mensen op zoeken; dit is de pagina die ze dan vinden.
// In het telefoontje op de homepage staat hij in een iframe; dan is de balk
// bovenaan weg (het scriptje onderaan).

export const metadata: Metadata = {
  title: "Voorbeeld van een trouwwebsite",
  description:
    "Zo ziet een trouwwebsite van SayingYes eruit: de opening met jullie foto en ontwerp, jullie verhaal, het programma als tijdlijn, de route, cadeautips, de ceremoniemeesters en aanmelden. Bekijk de site van Sophie en Daan.",
  alternates: { canonical: `${MARKETING_URL}/voorbeeld-site` },
  openGraph: {
    title: "Voorbeeld van een trouwwebsite",
    description: "De trouwwebsite van Sophie en Daan, gemaakt met SayingYes. Jullie site krijgt jullie namen, foto's en stijl.",
    url: `${MARKETING_URL}/voorbeeld-site`,
    siteName: "SayingYes",
    locale: "nl_NL",
    type: "website",
  },
}

const INSTELLINGEN: HomepageSettings = {
  layout: "editorial",
  opening: "foto-ontwerp",
  subtitleText: "",
  subtitleFont: "lora",
  subtitleSize: 1.1,
  subtitleVisible: true,
  hoofdtitelVisible: false,
  hoofdtitelFont: "pinyonscript",
  hoofdtitelSize: 5.5,
  datumFont: "playfair",
  datumSize: 1.6,
  datumNotatie: "uitgeschreven",
  titlePosition: "over",
  initialsVisible: true,
  frameNamesVisible: true,
  datumVisible: true,
  locatieVisible: true,
  locatieFont: "montserrat",
  locatieSize: 1.1,
  siteLayout: "boxed",
  pageMode: "single",
  ontwerp: VOORBEELD.ontwerp,
  ontwerpKop: "Wij gaan trouwen",
  tijden: VOORBEELD.tijden,
  dresscode: VOORBEELD.dresscode,
  details: "op",
  detailsStijl: "sierlijn",
}

const MOMENTEN: Moment[] = [
  { id: "m1", jaar: "2016", titel: "Hoe we elkaar leerden kennen", tekst: "Op een feestje van een gezamenlijke vriend, in een keuken in Utrecht. Daan was te laat, Sophie vergaf het hem na één drankje. Twee weken later de eerste date, en daarna zijn we eigenlijk nooit meer uit elkaar gegaan." },
  { id: "m2", jaar: "2020", titel: "Samen wonen", tekst: "Een huis in Arnhem met een tuin die te groot was voor onze plannen. We kregen Moos, een hond die nog steeds denkt dat hij een schoothond is." },
  { id: "m3", jaar: "2025", titel: "Het aanzoek", tekst: "Op het strand van Terschelling, net na zonsondergang. Ze zei ja voordat hij was uitgepraat. De ring zat vol zand." },
]

const CEREMONIEMEESTERS = [
  { id: "c1", naam: "Emma", rol: "zus van Sophie", telefoon: "", email: "", foto_url: null, onderwerpen: "speeches, verrassingen, het programma" },
  { id: "c2", naam: "Thomas", rol: "beste vriend van Daan", telefoon: "", email: "", foto_url: null, onderwerpen: "dieetwensen, vervoer, overnachten" },
]

const GASTENBOEK = [
  { naam: "Oma Riet", tekst: "Wat een prachtige kaart. Ik ben er natuurlijk bij, met mijn dansschoenen aan." },
  { naam: "Lotte", tekst: "Zó blij voor jullie! We tellen de dagen af." },
  { naam: "Jasper en Fleur", tekst: "Eindelijk! We komen met z'n drieën, de kleine wil per se de ringen dragen." },
]

const NAV = [
  { type: "Home", title: "Home" },
  { type: "OnsVerhaal", title: "Ons verhaal" },
  { type: "Programma", title: "Programma" },
  { type: "Informatie", title: "Informatie" },
  { type: "Cadeautips", title: "Cadeautips" },
  { type: "Ceremoniemeesters", title: "Ceremoniemeesters" },
  { type: "RSVP", title: "RSVP" },
  { type: "gastenboek", title: "Gastenboek" },
]

// In het telefoontje op de homepage (een iframe) hoort de balk niet
const BALK_SCRIPT = `(function(){try{if(window.top!==window.self){var b=document.getElementById("sy-voorbeeld-balk");if(b)b.style.display="none"}}catch(e){}})();`

export default function VoorbeeldSitePage() {
  const sc = getStyleConfig(VOORBEELD.stijl)
  const datumTekst = formatDate(VOORBEELD.datum)

  const secties: { id: string; inhoud: React.ReactNode }[] = [
    {
      id: "onsverhaal",
      inhoud: <StoryPreview title="Ons verhaal" quote="Ze zei ja voordat hij was uitgepraat." momenten={MOMENTEN} sc={sc} />,
    },
    {
      id: "programma",
      inhoud: <EventProgramPreview items={DEFAULT_PROGRAM_ITEMS} sc={sc} datum={VOORBEELD.datum} />,
    },
    {
      id: "informatie",
      inhoud: <PraktischPreview tiles={DEFAULT_PRAKTISCH_TILES} sc={sc} locatie={VOORBEELD.locatie} />,
    },
    {
      id: "cadeautips",
      inhoud: <WishlistPreview items={DEFAULT_WISHLIST_ITEMS} sc={sc} />,
    },
    {
      id: "ceremoniemeesters",
      inhoud: <EventMastersPreview masters={CEREMONIEMEESTERS} sc={sc} />,
    },
    {
      id: "rsvp",
      inhoud: (
        <div className="@container" style={{ padding: "48px 24px 64px", fontFamily: sc.fontFamily }}>
          <SectieKop
            sc={sc}
            kopje="Ben je erbij?"
            titel="RSVP"
            onder={<p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: sc.bodyText }}>Laat ons voor 1 mei weten of je erbij bent. Dit is een voorbeeld: er wordt niets verstuurd.</p>}
          />
          <div style={{ maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            <AanmeldFormulier
              voorbeeld
              stand="volledig"
              knopTekstKleur={sc.buttonText}
              accentColor={sc.accent}
              labelColor={sc.bodyText}
              titelFont={sc.fontPageTitles}
              titelGewicht={sc.fontPageTitlesWeight}
              datumTekst={datumTekst}
              programmaHref="#programma"
              guestTypes={["daggast", "avondgast"]}
              deadline="2027-05-01"
              showOvernachting
            />
          </div>
        </div>
      ),
    },
    { id: "gastenboek", inhoud: <Gastenboek berichten={GASTENBOEK} sc={sc} /> },
  ]

  return (
    <div className="min-h-screen sm:py-12" style={{ fontFamily: sc.fontFamily, background: sc.bodyBg, letterSpacing: sc.bodyLetterSpacing, fontWeight: sc.bodyFontWeight, scrollBehavior: "smooth" }}>
      {sc.fontImport && <style>{sc.fontImport}</style>}

      {/* Een smalle balk erboven: dit is een voorbeeld, en de weg naar je eigen site */}
      <div
        id="sy-voorbeeld-balk"
        className="flex items-center justify-between gap-3 px-4 py-2.5 sm:mx-auto sm:max-w-5xl sm:rounded-2xl sm:mb-4"
        style={{ backgroundColor: INKT, color: IVOOR, fontFamily: "var(--font-sans), system-ui, sans-serif", letterSpacing: 0, fontWeight: 400 }}
      >
        <p className="m-0 text-xs sm:text-sm leading-snug min-w-0">
          <Link href="/" style={{ color: GOUD, fontWeight: 600, textDecoration: "none" }}>SayingYes</Link>
          <span className="hidden sm:inline"> &middot; Voorbeeld van een trouwwebsite. Jullie site krijgt jullie namen, foto&apos;s en stijl.</span>
          <span className="sm:hidden"> &middot; Voorbeeldsite</span>
        </p>
        <Link
          href="/start?pakket=compleet"
          className="shrink-0 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl"
          style={{ backgroundColor: GOUD, color: INKT, textDecoration: "none" }}
        >
          Maak jullie site
        </Link>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BALK_SCRIPT }} />

      {/* Het beginscherm voor wie van de kaart komt, zoals op een echte site */}
      <SiteOpening
        id="sy-van-kaart"
        onderdrukHydratie
        data={voorbeeldOpening()}
        style={{ display: "none", zIndex: 1000, transition: "opacity 0.8s ease" }}
      />
      <script dangerouslySetInnerHTML={{ __html: VAN_KAART_SCRIPT }} />

      <div className="max-w-5xl mx-auto sm:shadow-2xl sm:rounded-2xl overflow-clip flex flex-col relative" style={{ background: sc.bodyBackground ?? sc.navBg }}>
        <EventNav title={VOORBEELD.namen} pages={NAV} sc={sc} navLayout="split" singlePage />
        <main className="relative" style={{ zIndex: 1 }}>
          <section id="home">
            <EventHomePreview
              title={VOORBEELD.namen}
              datum={VOORBEELD.datum}
              datumFormatted={datumTekst}
              locatie={VOORBEELD.locatie}
              heroImageUrl="/marketing/hero.jpg"
              heroOverlay
              heroPosX={50}
              heroPosY={60}
              useFrame
              frameNames={VOORBEELD.namen}
              frameLocation={VOORBEELD.locatie}
              initials={VOORBEELD.initialen}
              homeTitle="Welkom"
              homeBody={"Lieve familie en vrienden,\n\nWat fijn dat je hier bent. Op deze site vind je alles over onze dag: het programma, de route, waar je kunt slapen en hoe je ons kunt verrassen. Laat ons vooral even weten of je erbij bent, dan weten wij voor hoeveel mensen we taart bestellen."}
              homeAlign="center"
              rsvpHref="#rsvp"
              sc={sc}
              homepageSettings={INSTELLINGEN}
            />
          </section>
          {secties.map((s, i) => (
            <Sectie key={s.id} id={s.id} sc={sc} band={i % 2 === 0} verschijn>
              {s.inhoud}
            </Sectie>
          ))}
          <Verschijn />
          <AanmeldKnop href="#rsvp" sc={sc} />
          <BackToTopButton accentColor={sc.accent} />
        </main>
      </div>

      <footer className="py-6 text-center text-sm" style={{ color: sc.bodyText, opacity: 0.75 }}>
        Gemaakt met{" "}
        <Link href="/" style={{ fontWeight: 600, color: sc.accent, textDecoration: "none", fontFamily: "var(--font-cormorant)", fontSize: "1.05rem", letterSpacing: "0.01em" }}>
          SayingYes
        </Link>
      </footer>
    </div>
  )
}
