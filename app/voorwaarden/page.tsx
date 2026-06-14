import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Algemene Voorwaarden — SayingYes",
  description: "Lees de algemene voorwaarden van SayingYes, handelsnaam van MvB Commerce.",
}

const GOLD     = "#C5A059"
const CHARCOAL = "#2A2218"
const DARK     = "#0E0C09"

export default function VoorwaardenPage() {
  return (
    <div style={{ backgroundColor: "#FAF7F2", minHeight: "100vh" }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#FAF7F2", borderColor: "#E8DDD0" }}>
        <Link href="/" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem", fontWeight: 700, color: CHARCOAL, textDecoration: "none" }}>
          SayingYes
        </Link>
        <Link href="/" className="text-sm font-medium" style={{ color: GOLD, textDecoration: "none" }}>
          ← Terug naar home
        </Link>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-14 pb-24">

        <h1 className="mb-2" style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.75rem", fontWeight: 700, color: CHARCOAL, lineHeight: 1.15 }}>
          Algemene Voorwaarden
        </h1>
        <p className="mb-10 text-sm" style={{ color: "#8A7E72" }}>
          SayingYes, handelsnaam van MvB Commerce &nbsp;·&nbsp; Versie 1.0 &nbsp;·&nbsp; Ingangsdatum: 1 juni 2025
        </p>

        <p className="text-sm leading-relaxed mb-10" style={{ color: "#4A4030" }}>
          Welkom bij SayingYes. Voordat je gebruikmaakt van ons platform, vragen wij je deze Algemene Voorwaarden zorgvuldig door te lezen. Door een account aan te maken of een betaling te verrichten, ga je akkoord met deze voorwaarden.
        </p>

        <Section title="Artikel 1. Definities">
          <p className="mb-3">In deze voorwaarden wordt verstaan onder:</p>
          <ul className="list-none space-y-3">
            <li><strong>SayingYes:</strong> De contractpartij en dienstverlener, handelsnaam van de eenmanszaak MvB Commerce, gevestigd te Amersfoort. KVK-nummer: 42079472 · BTW-nummer: NL005478870B96 · Adres: Theo Uden Masmanstraat 43, 3813ZE Amersfoort · E-mail: <a href="mailto:info@sayingyes.nl" style={{ color: GOLD }}>info@sayingyes.nl</a></li>
            <li><strong>Builder (of Gebruiker):</strong> De consument (het bruidspaar of de organisator) die een account aanmaakt op de website en een bruiloftswebsite bouwt.</li>
            <li><strong>Gast:</strong> De bezoeker die door de Builder wordt uitgenodigd op de gecreëerde bruiloftswebsite (bijvoorbeeld om de RSVP in te vullen).</li>
            <li><strong>Dienst:</strong> Het online softwareplatform (SaaS) op sayingyes.nl waarmee de Builder een bruiloftswebsite kan ontwerpen, beheren en hosten.</li>
            <li><strong>Overeenkomst:</strong> De afspraak tussen SayingYes en de Builder voor het leveren van de Dienst.</li>
          </ul>
        </Section>

        <Section title="Artikel 2. Toepasselijkheid">
          <p>Deze Algemene Voorwaarden zijn van toepassing op elk gebruik van de Dienst, op alle overeenkomsten die tussen SayingYes en de Builder tot stand komen, en op alle functionaliteiten die binnen het platform worden aangeboden.</p>
          <p className="mt-3">Afwijkingen van deze voorwaarden zijn alleen geldig indien deze schriftelijk of per e-mail expliciet door SayingYes zijn bevestigd.</p>
        </Section>

        <Section title="Artikel 3. Aanbod, Prijzen en Betaling">
          <p>Het aanmaken van een basisaccount is kosteloos. Voor het activeren en publiceren van de volledige premium bruiloftswebsite (inclusief subdomein, onbeperkte RSVP-functies en fotogalerij) betaalt de Builder een eenmalig, vast tarief zoals vermeld op de website (inclusief BTW).</p>
          <p className="mt-3">Er is geen sprake van een doorlopend abonnement; de initiële betaling is strikt eenmalig.</p>
          <p className="mt-3">Betalingen verlopen veilig via de online betaalprovider Mollie.</p>
          <p className="mt-3">Zodra de betaling met succes is afgerond, wordt de premium toegang direct geactiveerd.</p>
        </Section>

        <Section title="Artikel 4. Verlenging">
          <p>Na afloop van de initiële publicatieperiode van 12 maanden heeft de Builder de mogelijkheid de website actief te houden via een optionele verlenging. Het verlengingstarief en de verlengingsperiode worden vermeld op de website.</p>
          <p className="mt-3">Verlenging is volledig vrijblijvend en wordt nooit automatisch verlengd of gefactureerd. De Builder ontvangt tijdig een herinnering per e-mail voordat de publicatieperiode afloopt.</p>
          <p className="mt-3">Indien niet verlengd wordt, wordt de bruiloftswebsite offline gehaald conform de termijnen beschreven in Artikel 7.</p>
        </Section>

        <Section title="Artikel 5. Uitsluiting Herroepingsrecht (Bedenktijd)">
          <p>Omdat SayingYes een digitale dienst levert die direct na betaling volledig en automatisch ter beschikking wordt gesteld, stemt de Builder ermee in dat de levering direct begint.</p>
          <p className="mt-3">Het wettelijke herroepingsrecht (de bedenktijd van 14 dagen) is hierdoor uitgesloten op grond van artikel 6:230p sub m Burgerlijk Wetboek. Restitutie van het aankoopbedrag na activering is niet mogelijk.</p>
        </Section>

        <Section title="Artikel 6. Gebruiksregels en Intellectueel Eigendom">
          <p>De Builder blijft te allen tijde de eigenaar van alle teksten, gegevens en foto's die hij of zij op de bruiloftswebsite plaatst.</p>
          <p className="mt-3">De Builder garandeert dat alle geüploade media (zoals professionele trouwfoto's) rechtmatig worden gebruikt en dat er geen inbreuk wordt gemaakt op de auteursrechten van derden (zoals de fotograaf). SayingYes is niet aansprakelijk voor claims omtrent auteursrechtelijk beschermd materiaal dat door Gebruikers is geüpload.</p>
          <p className="mt-3">Het is strikt verboden om inhoud te plaatsen die in strijd is met de Nederlandse wet- en regelgeving, waaronder smadelijke, racistische, discriminerende, aanstootgevende of pornografische content.</p>
          <p className="mt-3">SayingYes behoudt zich het recht voor om accounts die deze regels overtreden direct en zonder restitutie te blokkeren of te verwijderen.</p>
        </Section>

        <Section title="Artikel 7. Beschikbaarheid, Onderhoud en Back-ups">
          <p>SayingYes streeft naar een zo hoog mogelijke beschikbaarheid van het platform (uptime), maar biedt geen harde garanties. De Dienst wordt geleverd op basis van "as is" en "as available".</p>
          <p className="mt-3">SayingYes mag het platform op elk moment tijdelijk buiten gebruik stellen voor noodzakelijk onderhoud of updates. Dit wordt, indien mogelijk, vooraf aangekondigd en beperkt tot de nachtelijke uren.</p>
          <p className="mt-3">SayingYes is niet aansprakelijk voor schade, misgelopen RSVP-aanmeldingen of ongemak als gevolg van tijdelijke downtime, serverstoringen of internetonderbrekingen.</p>
        </Section>

        <Section title="Artikel 8. Duur en Automatische Verwijdering">
          <p>De Overeenkomst wordt aangegaan voor de duur van het evenement.</p>
          <p className="mt-3">Conform ons <Link href="/privacy" style={{ color: GOLD }}>Privacybeleid</Link> worden alle specifieke eventgegevens, gastenlijsten, RSVP-antwoorden en geüploade foto's uiterlijk 12 maanden na de ingevulde bruiloftsdatum automatisch en permanent verwijderd. Het is de verantwoordelijkheid van de Builder om eventuele back-ups van RSVP-data of foto's vóór die tijd zelf te downloaden.</p>
          <p className="mt-3">De Builder kan zijn of haar account en website op ieder gewenst moment via het dashboard definitief verwijderen.</p>
        </Section>

        <Section title="Artikel 9. Aansprakelijkheidsbeperking">
          <p>De totale aansprakelijkheid van SayingYes wegens een toerekenbare tekortkoming in de nakoming van de Overeenkomst is beperkt tot vergoeding van directe schade en bedraagt maximaal het bedrag dat de Builder voor de Dienst heeft betaald.</p>
          <p className="mt-3">Aansprakelijkheid voor indirecte schade, gevolgschade, gederfde winst, gemiste besparingen of emotionele schade (bijvoorbeeld door een storing op de trouwdag zelf) is volledig uitgesloten.</p>
          <p className="mt-3">Deze beperking geldt niet in geval van opzet of bewuste roekeloosheid aan de zijde van SayingYes.</p>
        </Section>

        <Section title="Artikel 10. Ingesloten Verwerkersovereenkomst (DPA)">
          <p>Dit artikel is wettelijk verplicht onder de AVG omdat de Builder via ons platform persoonsgegevens van derden (Gasten) verwerkt.</p>
          <ul className="list-none space-y-3 mt-3">
            <li><strong>Rolverdeling:</strong> De Builder is de &apos;Verwerkingsverantwoordelijke&apos; en bepaalt welke gegevens van Gasten worden verzameld. SayingYes (MvB Commerce) is de &apos;Verwerker&apos; en faciliteert enkel de technische opslag in opdracht van de Builder.</li>
            <li><strong>Doel:</strong> SayingYes verwerkt de Gastengegevens (zoals namen, dieetwensen en verzoeknummers) uitsluitend ten behoeve van de uitvoering van de Dienst en zal deze gegevens nooit voor eigen (marketing)doeleinden gebruiken, inzien of doorverkopen.</li>
            <li><strong>Beveiliging:</strong> SayingYes verplicht zich tot het nemen van passende technische en organisatorische beveiligingsmaatregelen (zoals HTTPS-versleuteling en database-afscherming via Supabase RLS) om de persoonsgegevens te beschermen tegen verlies of onrechtmatige verwerking.</li>
            <li><strong>Subverwerkers:</strong> De Builder geeft SayingYes toestemming om betrouwbare subverwerkers in te schakelen (zoals vermeld in de <Link href="/privacy" style={{ color: GOLD }}>Privacyverklaring</Link>, waaronder Supabase en Vercel) die noodzakelijk zijn voor het leveren van de Dienst.</li>
            <li><strong>Datalekken:</strong> In het onwaarschijnlijke geval van een aangetoond beveiligingsincident of datalek waarbij gegevens van Gasten betrokken zijn, zal SayingYes de Builder hierover zonder onredelijke vertraging informeren, zodat de Builder aan zijn of haar wettelijke meldplicht kan voldoen.</li>
          </ul>
        </Section>

        <Section title="Artikel 11. Klachten en Geschillen">
          <p>Klachten over de Dienst kunnen worden ingediend via <a href="mailto:info@sayingyes.nl" style={{ color: GOLD }}>info@sayingyes.nl</a>. SayingYes streeft ernaar klachten binnen 14 dagen te beantwoorden.</p>
          <p className="mt-3">Op alle rechtsbetrekkingen waarbij SayingYes partij is, is uitsluitend het Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar MvB Commerce is gevestigd, tenzij de wet dwingend anders voorschrijft.</p>
          <p className="mt-3">Als consument kun je ook terecht bij het Europese ODR-platform voor onlinegeschillenbeslechting: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>ec.europa.eu/consumers/odr</a>.</p>
        </Section>

        <Section title="Artikel 12. Wijzigingen">
          <p>SayingYes heeft het recht om deze Algemene Voorwaarden eenzijdig te wijzigen. Wijzigingen worden minimaal 30 dagen voor ingang per e-mail aan actieve Gebruikers gecommuniceerd. De meest recente versie is altijd te vinden op <a href="/voorwaarden" style={{ color: GOLD }}>sayingyes.nl/voorwaarden</a>.</p>
        </Section>

      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs border-t" style={{ backgroundColor: DARK, borderColor: "#1A1510", color: "#4A4030" }}>
        <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: "#8A7E72", fontWeight: 600 }}>SayingYes</span>
        <span className="mx-3" style={{ color: "#2A2218" }}>·</span>
        © {new Date().getFullYear()}
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.5rem", fontWeight: 700, color: CHARCOAL }}>
        {title}
      </h2>
      <div className="text-[0.9375rem] leading-relaxed" style={{ color: "#4A4030" }}>
        {children}
      </div>
    </section>
  )
}
