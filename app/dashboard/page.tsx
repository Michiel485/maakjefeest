import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase-server"
import { laadBruiloft, bruiloftNaam, leegResultaat } from "@/lib/bruiloft-server"
import BouwerSchil from "@/components/BouwerSchil"
import RsvpSection from "./RsvpSection"
import GuestPhotosSection from "./GuestPhotosSection"
import { SectionLabel } from "./Beheer"
import { SignOutButton } from "./SignOutButton"
import BruiloftInfo from "./BruiloftInfo"
import { Aftellen, KaartTegel, Tegel, TegelKnop, Teller, WebsiteTegel, type KaartRegel } from "./Tegels"
import { maxPhotosPerEvent } from "@/lib/guest-photos"
import { planAllows, planMagVersturen, PLANS, formatEur, upgradePrice } from "@/lib/plans"
import { afstandInWoorden } from "@/lib/fasen"
import { leesStand, voortgang } from "@/lib/checklist"
import { komtGast, reis } from "@/lib/gasten"
import { kaartLabel } from "@/lib/cards"
import { eventSiteLabel } from "@/lib/site-url"
import { KLEUR } from "@/lib/ontwerp"
import type { Onderdeel } from "@/components/BouwerSchakelaar"

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
}

// Het dashboard: het eerste tabblad van dezelfde schil als de bouwers.
//
// Uit het klantreisgesprek van 21 september 2026. De vorige versie stapelde
// een fasenbalk, drie banden, een checklist van tweeëndertig punten en de
// instellingen op één pagina, en zei bovendien dingen die uit de kalender
// kwamen in plaats van uit de bruiloft ("je Save the Date is eruit" terwijl
// er niets verstuurd was). Michiels oordeel: overweldigend, en het dashboard
// moet een USP zijn en niet als werk voelen.
//
// Nu: de bruiloft, een teller, vier tegels, en één regel onderaan. Alles komt
// uit wat er echt gebeurd is. Wat je niet hebt gekocht is grijs met één zin en
// een prijs. Checklist en instellingen hebben een eigen pagina.

const FONT_KOP = "var(--font-cormorant)"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : undefined
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Niet ingelogd? Dan geen doorstuur naar inloggen, maar het lege dashboard:
  // drie grijze tegels en de gastenlijst. Dat ís de pakketkeuze na Start
  // gratis, en die moet je kunnen zien voordat je een account hebt. Er staat
  // niets van iemand in, dus er lekt niets.
  const ingelogd = !!user?.email
  const gekozen = typeof params?.b === "string" ? params.b : null
  const { bruiloft, alle, groep, extra, rsvps, cards, guestPhotos, gpSettings, stand, signalen } =
    ingelogd ? await laadBruiloft(user!.email!, gekozen) : leegResultaat()

  const naam = bruiloftNaam(bruiloft)
  const datum = bruiloft?.datum
    ? new Date(bruiloft.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : null

  // Per kaart: hoeveel gasten via die kaart reageerden. Dat weten we uit de
  // link waarop ze antwoordden. Hoeveel er per kaart verstuurd is weten we pas
  // als de klant dat per kaart aangeeft; tot die tijd staat het totaal per
  // soort in het chipje.
  function regels(type: "save_the_date" | "trouwkaart"): KaartRegel[] {
    const kaartKolom = type === "save_the_date" ? "std_kaart_id" : "inv_kaart_id"
    const statusKolom = type === "save_the_date" ? "std_status" : "inv_status"
    return cards
      .filter((c) => c.type === type)
      .map((card) => ({
        card,
        // Verstuurd: wat het bruidspaar bij "verstuurd zetten" aangaf, plus wie
        // via deze link antwoordde (die heeft hem per definitie gekregen).
        verstuurd: rsvps.filter(
          (r) =>
            (r[kaartKolom] === card.id && reis(r[statusKolom]) !== "niet_verstuurd") ||
            (r.bron_token === card.share_token && r[kaartKolom] == null)
        ).length,
        gereageerd: rsvps.filter(
          (r) => r.bron_token === card.share_token && komtGast(reis(r.std_status), reis(r.inv_status)) !== null
        ).length,
      }))
  }

  // Voor de gastenlijst: welke kaarten er zijn, met een korte naam.
  const kaartRefs = cards.map((c) => ({
    id: c.id,
    type: c.type,
    naam: kaartLabel(c),
    share_token: c.share_token,
  }))
  const stdRegels = regels("save_the_date")
  const invRegels = regels("trouwkaart")
  const magStd = groep.some((e) => planMagVersturen(e.plan, "save_the_date"))
  const betaaldPlan = groep.find((e) => ["published", "expired"].includes(e.status))?.plan ?? null
  const prijsInv = (betaaldPlan && upgradePrice(betaaldPlan, "uitnodiging")) || PLANS.uitnodiging.price
  const magInv = groep.some((e) => planMagVersturen(e.plan, "trouwkaart"))

  const metInhoud: Onderdeel[] = [
    ...(stdRegels.length ? (["save_the_date"] as Onderdeel[]) : []),
    ...(invRegels.length ? (["trouwkaart"] as Onderdeel[]) : []),
    ...(stand.magSite ? (["website"] as Onderdeel[]) : []),
  ]

  const checklist = bruiloft ? voortgang(leesStand(extra[bruiloft.id]?.checklist), signalen) : null
  const liveSite = groep.find((e) => e.status === "published" && planAllows(e.plan, "site")) ?? null
  const siteAdres = stand.magSite && stand.live && bruiloft ? eventSiteLabel(bruiloft.slug) : null
  const fotoEvents = groep.filter((e) => gpSettings[e.id])

  return (
    <BouwerSchil
      actief="dashboard"
      eventId={bruiloft?.id ?? null}
      metInhoud={metInhoud}
      acties={ingelogd ? (
        <Link
          href="/dashboard/instellingen"
          aria-label="Instellingen"
          title="Instellingen: deadline voor je locatie, hoe vaak je een tussenstand hoort, je account"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold min-h-[40px] flex-1 md:flex-none"
          style={{ backgroundColor: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.goudLicht}`, textDecoration: "none" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="md:hidden">Instellingen</span>
        </Link>
      ) : undefined}
    >
      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-7 md:py-9 flex flex-col gap-6">

        {/* ── De bruiloft ──
            Alleen als er een bewaarde bruiloft is. Zonder account staat je
            bruiloft in je browser, en dan tekent BruiloftInfo de kop zelf,
            want de server weet niet wat daarin staat. */}
        {bruiloft && (
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              className="m-0"
              style={{ fontFamily: FONT_KOP, fontWeight: 600, fontSize: "clamp(1.7rem, 4vw, 2.5rem)", lineHeight: 1.05, color: KLEUR.inkt, textWrap: "balance" }}
            >
              {naam}
            </h1>
            <div className="text-sm mt-1.5" style={{ color: KLEUR.zacht }}>
              {datum ? (
                <>
                  {datum}
                  {bruiloft?.locatie ? ` · ${bruiloft.locatie}` : ""} {"·"}{" "}
                  <span style={{ color: KLEUR.tekst }}>{afstandInWoorden(bruiloft?.datum)}</span>
                </>
              ) : (
                "Nog geen trouwdatum."
              )}
              {bruiloft && (
                <>
                  {" · "}
                  <BruiloftInfo
                    eventId={bruiloft.id}
                    naam={bruiloft.title ?? ""}
                    datum={bruiloft.datum ?? null}
                    locatie={bruiloft.locatie ?? null}
                  />
                </>
              )}
            </div>
          </div>
          {bruiloft?.datum && <Aftellen datum={bruiloft.datum} />}

          {/* Meer dan één bruiloft komt niet meer voor, maar wie er van vroeger
              nog een heeft moet er wel bij kunnen. */}
          {alle.filter((e) => !extra[e.id]?.hoort_bij).length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: KLEUR.zacht }}>
              <span>Andere bruiloft:</span>
              {alle
                .filter((e) => !extra[e.id]?.hoort_bij && e.id !== bruiloft?.id)
                .map((e) => (
                  <Link key={e.id} href={`/dashboard?b=${e.id}`} className="underline" style={{ color: KLEUR.tekst }}>
                    {e.title || "Naamloos"}
                  </Link>
                ))}
            </div>
          )}
        </header>
        )}

        {/* ── Jullie namen, datum en locatie ──
            Eén plek waar dit gevraagd wordt. Dat stond eerst in beide bouwers
            onder "Algemene info", en dat voelde niet als een centrale plek en
            werkte niet lekker. Nu hier, en de bouwers nemen het over. */}
        {!bruiloft && (
          <BruiloftInfo eventId={null} naam="" datum={null} locatie={null} />
        )}

        {/* ── De teller ── */}
        <Teller
          gasten={stand.gasten}
          komen={stand.komen}
          nietKomen={stand.nietKomen}
          stil={stand.stil}
          heeftBruiloft={!!bruiloft}
          heeftKaart={cards.length > 0}
          live={stand.live}
        />

        {/* ── De tegels ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KaartTegel
            soort="save_the_date"
            titel="Save the Date"
            prijs={formatEur(PLANS.save_the_date.price).replace(",00", "")}
            uitleg="Zodat mensen de dag vrijhouden. Eén link, elke gast antwoordt met één tik."
            mag={magStd}
            live={stand.live}
            eventId={bruiloft?.id ?? null}
            regels={stdRegels}
            verstuurd={stand.stdVerstuurd}
            gereageerd={stand.stdGereageerd}
          />
          <KaartTegel
            soort="trouwkaart"
            titel="Trouwkaart"
            /* Heb je de Save the Date al betaald, dan betaal je alleen het
               verschil bij. Dit stond hier als de volle prijs. */
            prijs={formatEur(prijsInv).replace(",00", "")}
            uitleg="Tijden, dresscode en de volledige aanmelding met dieetwensen en allergieën."
            mag={magInv}
            live={stand.live}
            eventId={bruiloft?.id ?? null}
            regels={invRegels}
            verstuurd={stand.invVerstuurd}
            gereageerd={stand.invGereageerd}
          />
          <WebsiteTegel
            mag={stand.magSite}
            live={stand.live && !!liveSite}
            eventId={bruiloft?.id ?? null}
            adres={siteAdres}
            fotomuurAan={stand.fotomuurAan}
            fotos={stand.fotos}
            heeftOntwerp={groep.some((e) => e.heeftSite)}
            naam={bruiloft?.conceptNaam ?? null}
            slug={bruiloft?.slug ?? null}
            geldigTot={liveSite?.expires_at ?? null}
          />

          {/* ── De gastenlijst, met de lijst zelf erin ── */}
          <Tegel
            id="gasten"
            titel="Gastenlijst"
            breed
            rechts={
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: KLEUR.goudVlak, color: stand.gasten ? KLEUR.inkt : KLEUR.zacht }}>
                {stand.gasten ? `${stand.gasten} ${stand.gasten === 1 ? "gast" : "gasten"}` : "Gratis, bij elk pakket"}
              </span>
            }
          >
            {stand.gasten === 0 && (
              <p className="m-0 text-sm" style={{ color: KLEUR.tekst }}>
                Nog leeg. Je kunt alvast namen typen of een lijst uit Excel plakken. Of je doet niets en laat hem
                zich vullen door wie op je kaart antwoordt.
              </p>
            )}
            {bruiloft ? (
              <RsvpSection
                rsvps={rsvps}
                /* Ook een bruiloft die nog niet geactiveerd is. Je gastenlijst
                   maken is het eerste wat je doet, ver voordat je een kaart
                   koopt; wachten tot er betaald is stond precies in de weg. */
                events={groep.map((e) => ({ id: e.id, title: e.title }))}
                kaarten={kaartRefs}
              />
            ) : (
              <div className="flex gap-2">
                <TegelKnop href="/kaart-maken?type=save_the_date" soort="primair">Begin met een kaart</TegelKnop>
              </div>
            )}
          </Tegel>
        </div>

        {/* Het blok "Je kaarten delen" stond hier. Het toonde dezelfde kaarten
            nog een keer, met een rij knoppen eronder. Alles wat je met een
            kaart kunt doen zit nu in het menu op de kaartregel zelf, in de
            tegel hierboven. Zie app/dashboard/KaartActies.tsx. */}

        {/* ── Fotomuur ── */}
        {fotoEvents.length > 0 && (
          <section id="fotos" className="scroll-mt-24">
            <div className="mb-3"><SectionLabel>Gastenfotomuur</SectionLabel></div>
            <div className="flex flex-col gap-6">
              {fotoEvents.map((ev) => (
                <GuestPhotosSection
                  key={ev.id}
                  event={{ id: ev.id, title: ev.title, slug: ev.slug }}
                  settings={gpSettings[ev.id]}
                  photos={guestPhotos.filter((p) => p.event_id === ev.id)}
                  maxPhotos={maxPhotosPerEvent()}
                />
              ))}
            </div>
          </section>
        )}

        {/* Het beheerblok (webadres, verlengen, weggooien) stond hier. Dat
            is wat je één keer instelt en het stond het overzicht in de weg;
            het staat nu op /dashboard/instellingen. */}

        {/* ── Eén regel onderaan ── */}
        <div className="flex flex-wrap justify-between gap-2 pt-2 text-sm" style={{ color: KLEUR.zacht }}>
          {ingelogd ? (
            <>
              <Link href="/dashboard/checklist" style={{ color: KLEUR.tekst, textDecoration: "none" }}>
                Checklist{checklist ? ` · ${checklist.af} van ${checklist.totaal} af` : ""} {"›"}
              </Link>
              <span className="flex items-center gap-3">
                <Link href="/dashboard/instellingen" style={{ color: KLEUR.tekst, textDecoration: "none" }}>
                  Instellingen {"·"} Account
                </Link>
                <span aria-hidden style={{ color: KLEUR.zand }}>|</span>
                <SignOutButton />
              </span>
            </>
          ) : (
            <span>
              Al eerder iets gemaakt?{" "}
              <Link href="/inloggen" style={{ color: KLEUR.tekst }}>Inloggen</Link>
            </span>
          )}
        </div>
      </main>
    </BouwerSchil>
  )
}
