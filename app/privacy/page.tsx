import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy & Cookiebeleid — SayingYes",
  description: "Lees hoe SayingYes omgaat met jouw persoonsgegevens en cookies.",
}

const GOLD = "#C5A059"
const CHARCOAL = "#2A2218"
const DARK = "#0E0C09"

export default function PrivacyPage() {
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
          Privacy- &amp; Cookieverklaring
        </h1>
        <p className="mb-10 text-sm" style={{ color: "#8A7E72" }}>
          SayingYes &nbsp;·&nbsp; Versie 1.0 &nbsp;·&nbsp; Ingangsdatum: 1 juni 2025
        </p>

        <Section title="1. Wie zijn wij?">
          <p>
            SayingYes is een handelsnaam van <strong>MvB Commerce</strong>, gevestigd in Nederland.
            Via <strong>sayingyes.nl</strong> kunnen bruidsparen een gepersonaliseerde bruiloftswebsite
            bouwen en beheren.
          </p>
          <p className="mt-3">
            KVK-nummer: 42079472 &nbsp;·&nbsp; BTW-nummer: NL005478870B96<br />
            Adres: Theo Uden Masmanstraat 43
          </p>
          <p className="mt-3">Contactgegevens voor privacyvragen: <a href="mailto:info@sayingyes.nl" style={{ color: GOLD }}>info@sayingyes.nl</a></p>
        </Section>

        <Section title="2. Welke gegevens verzamelen we?">
          <p className="mb-2">We verwerken alleen gegevens die strikt noodzakelijk zijn voor de werking van de dienst:</p>
          <Table rows={[
            ["Accountgegevens", "E-mailadres van de builder (bruidspaar)", "Inloggen via magic link (Supabase Auth)"],
            ["Eventgegevens", "Naam event, datum, locatie, stijlkeuzes, foto's", "Opgeslagen in Supabase (EU-regio)"],
            ["RSVP-gegevens", "Naam, e-mailadres, dieetwensen, antwoorden op vragen", "Ingevuld door gasten, opgeslagen in Supabase"],
            ["Betalingsgegevens", "Geen — betalingen verlopen volledig via Mollie", "SayingYes slaat geen kaartgegevens op"],
          ]} />
        </Section>

        <Section title="3. Waarvoor gebruiken we jouw gegevens?">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Het aanmaken en beheren van jouw bruiloftswebsite.</li>
            <li>Het versturen van een inloglink per e-mail (magic link via Resend).</li>
            <li>Het verwerken en tonen van RSVP-aanmeldingen aan het bruidspaar.</li>
            <li>Het verwerken van de eenmalige betaling via Mollie.</li>
            <li>Het per e-mail informeren over ernstige storingen of wijzigingen in de dienst.</li>
          </ul>
          <p className="mt-3">We sturen <strong>geen marketingmails</strong> zonder expliciete toestemming.</p>
        </Section>

        <Section title="4. Grondslag voor verwerking">
          <Table rows={[
            ["Uitvoering overeenkomst", "Accountbeheer, website hosten, RSVP verwerken", "Art. 6 lid 1 sub b AVG"],
            ["Wettelijke verplichting", "Bewaarplicht factuurgegevens (7 jaar)", "Art. 6 lid 1 sub c AVG"],
            ["Gerechtvaardigd belang", "Beveiliging en fraudepreventie", "Art. 6 lid 1 sub f AVG"],
          ]} />
        </Section>

        <Section title="5. Hoe lang bewaren we gegevens?">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Eventgegevens & RSVP-data:</strong> tot 12 maanden na de bruiloftsdatum, waarna automatisch verwijderd.</li>
            <li><strong>Accountgegevens:</strong> tot het account actief wordt verwijderd.</li>
            <li><strong>Factuurgegevens:</strong> 7 jaar conform de fiscale bewaarplicht.</li>
          </ul>
        </Section>

        <Section title="6. Delen we gegevens met derden?">
          <p className="mb-3">Ja, maar uitsluitend met verwerkers die noodzakelijk zijn voor de dienst en die voldoen aan de AVG:</p>
          <Table rows={[
            ["Supabase", "Database & authenticatie", "EU (Frankfurt)"],
            ["Vercel", "Hosting & CDN", "EU-regio beschikbaar; SCCs van toepassing"],
            ["Resend", "Transactionele e-mail (magic links)", "VS — SCCs & AVG-compliant"],
            ["Mollie", "Betalingsverwerking", "NL (Amsterdam) — volledig EU-gebaseerd"],
          ]} />
          <p className="mt-3">We verkopen of verhuren gegevens <strong>nooit</strong> aan derden.</p>
        </Section>

        <Section title="7. Jouw rechten (AVG)">
          <p className="mb-2">Als betrokkene heb je de volgende rechten:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Inzage:</strong> opvragen welke gegevens we van je hebben.</li>
            <li><strong>Rectificatie:</strong> onjuiste gegevens laten corrigeren.</li>
            <li><strong>Verwijdering:</strong> verzoeken je gegevens te wissen ("recht om vergeten te worden").</li>
            <li><strong>Beperking:</strong> verwerking tijdelijk laten beperken.</li>
            <li><strong>Bezwaar:</strong> bezwaar maken tegen verwerking op grond van gerechtvaardigd belang.</li>
            <li><strong>Overdraagbaarheid:</strong> je gegevens in een machine-leesbaar formaat ontvangen.</li>
          </ul>
          <p className="mt-3">
            Stuur een verzoek naar{" "}
            <a href="mailto:info@sayingyes.nl" style={{ color: GOLD }}>info@sayingyes.nl</a>.
            We reageren binnen 30 dagen. Je kunt ook een klacht indienen bij de{" "}
            <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
              Autoriteit Persoonsgegevens
            </a>.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p className="mb-3">
            SayingYes gebruikt <strong>uitsluitend functionele cookies</strong>. Dat zijn cookies die
            strikt noodzakelijk zijn voor de werking van de website. Voor functionele cookies is
            geen toestemming vereist.
          </p>
          <Table rows={[
            ["sb-access-token", "Supabase", "Inlogsessie bijhouden", "Sessieduur"],
            ["sb-refresh-token", "Supabase", "Sessie vernieuwen", "30 dagen"],
          ]} />
          <p className="mt-3">
            We plaatsen <strong>geen</strong> tracking-, advertentie- of analytische cookies.
            Er is daarom geen cookiebanner nodig.
          </p>
        </Section>

        <Section title="9. Beveiliging">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Alle verbindingen zijn beveiligd via HTTPS/TLS.</li>
            <li>Toegang tot de database is beperkt tot geauthenticeerde gebruikers via Row Level Security (Supabase RLS).</li>
            <li>Wachtwoorden worden niet opgeslagen — we gebruiken wachtwoordloze magic links.</li>
          </ul>
        </Section>

        <Section title="10. Wijzigingen">
          <p>
            We kunnen deze verklaring aanpassen. Bij wezenlijke wijzigingen ontvangen actieve
            gebruikers een e-mailnotificatie. De meest recente versie is altijd te vinden op{" "}
            <a href="/privacy" style={{ color: GOLD }}>sayingyes.nl/privacy</a>.
          </p>
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

function Table({ rows }: { rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#E8DDD0" }}>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FFFDF9" : "#FAF7F2", borderBottom: i < rows.length - 1 ? "1px solid #E8DDD0" : undefined }}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5" style={{ color: j === 0 ? CHARCOAL : "#4A4030", fontWeight: j === 0 ? 600 : 400 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
