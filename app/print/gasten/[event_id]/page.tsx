export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { createServiceClient } from "@/lib/supabase"
import { formatDate } from "@/lib/event-styles"
import { KLEUR } from "@/lib/ontwerp"
import { komtGast, reis, heeftGereageerd } from "@/lib/gasten"
import PrintKnop from "./print-knop"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gastenoverzicht",
  robots: { index: false, follow: false },
}

// Het lijstje dat elke locatie aan het bruidspaar vraagt: hoeveel personen,
// hoeveel vegetarisch, welke allergieën, wie blijft slapen. Die gegevens staan
// er al, maar verspreid over een tabel met losse regels. Eén pagina die het
// optelt en te printen is, zonder nav en zonder knoppen erop.

interface Gast {
  name: string
  guest_type: string | null
  dietary: string | null
  allergie: string | null
  attending: string | null
  std_status: string | null
  inv_status: string | null
  overnachting: boolean | null
  is_kind: boolean | null
  leeftijd: number | null
  status: string | null
}

const GROEP_LABEL: Record<string, string> = {
  daggast: "Daggasten",
  avondgast: "Avondgasten",
  receptiegast: "Receptiegasten",
}

/**
 * Komt deze gast? Alleen wie echt ja heeft gezegd telt mee. Eerder stond hier
 * dat een leeg antwoord als ja gold, en daardoor kwam een met de hand
 * toegevoegde gast van wie je nog niets had gehoord in de aantallen terecht.
 * Voor een cateraarslijst is dat precies de verkeerde kant om te gokken.
 */
function komt(g: Gast): boolean {
  return komtGast(reis(g.std_status), reis(g.inv_status)) === true
}

/** "Vegetarisch" en "vegetarisch " horen op één hoop. */
function dieetSleutel(waarde: string): string {
  return waarde.trim().toLowerCase().replace(/\s+/g, " ")
}

export default async function GastenPrintPagina({
  params,
}: {
  params: Promise<{ event_id: string }>
}) {
  const { event_id } = await params

  const auth = await createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user?.email) notFound()

  const service = createServiceClient()
  const { data: event } = await service
    .from("events")
    .select("id, title, datum, locatie, user_email")
    .eq("id", event_id)
    .single()

  // Niet van jou is niet gevonden: geen hint dat dit event bestaat
  if (!event || event.user_email !== user.email) notFound()

  const { data: rijen } = await service
    .from("rsvp")
    .select("name, guest_type, dietary, allergie, attending, std_status, inv_status, overnachting, is_kind, leeftijd, status")
    .eq("event_id", event_id)
    .order("name")

  const gasten = (rijen ?? []) as Gast[]
  const aanwezig = gasten.filter(komt)
  const afgemeld = gasten.filter((g) => komtGast(reis(g.std_status), reis(g.inv_status)) === false).length
  // Wie nog niets heeft laten weten is geen ja en geen nee
  const nogNiets = gasten.length - aanwezig.length - afgemeld

  // Kinderen tellen apart: de catering rekent voor hen vaak een ander tarief,
  // en de locatie vraagt er standaard naar.
  const kinderen = aanwezig.filter((g) => g.is_kind)
  const volwassenen = aanwezig.length - kinderen.length

  // Een zachte reservering van een Save the Date is geen definitieve
  // aanmelding. Die twee bij elkaar optellen zou het bruidspaar op een te hoog
  // getal laten plannen.
  // Een ja op de Save the Date zonder antwoord op de uitnodiging is een zachte
  // reservering; die mag niet als vaststaand worden meegeteld.
  const voorlopig = aanwezig.filter((g) => !heeftGereageerd(reis(g.inv_status))).length

  const perGroep = new Map<string, number>()
  for (const g of aanwezig) {
    const k = g.guest_type ?? "daggast"
    perGroep.set(k, (perGroep.get(k) ?? 0) + 1)
  }

  // Dieetwensen met de namen erbij: een cateraar wil weten wie, niet alleen
  // hoeveel, want dat bord moet bij de juiste stoel staan.
  function groepeer(veld: "dietary" | "allergie") {
    const per = new Map<string, { label: string; namen: string[] }>()
    for (const g of aanwezig) {
      const waarde = g[veld]
      if (!waarde?.trim()) continue
      const k = dieetSleutel(waarde)
      const bestaand = per.get(k)
      if (bestaand) bestaand.namen.push(g.name)
      else per.set(k, { label: waarde.trim(), namen: [g.name] })
    }
    return [...per.values()].sort((a, b) => b.namen.length - a.namen.length)
  }
  const dieetLijst = groepeer("dietary")
  // Een allergie is veiligheid en een voorkeur is een voorkeur. Voor een
  // cateraar zijn dat twee verschillende lijstjes.
  const allergieLijst = groepeer("allergie")

  const blijftSlapen = aanwezig.filter((g) => g.overnachting)

  const printRegels = `
    @media print {
      .niet-printen { display: none !important; }
      @page { margin: 16mm; }
    }
    .blok { break-inside: avoid; }
  `

  return (
    <div style={{ backgroundColor: "#fff", color: KLEUR.inkt, minHeight: "100vh", padding: "32px 24px" }}>
      <style>{printRegels}</style>

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="niet-printen" style={{ marginBottom: 24 }}>
          <PrintKnop />
        </div>

        <header style={{ borderBottom: `2px solid ${KLEUR.goud}`, paddingBottom: 16, marginBottom: 28 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: KLEUR.goud }}>
            Gastenoverzicht
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 700 }}>{event.title as string}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: KLEUR.tekst }}>
            {[event.datum ? formatDate(event.datum as string) : null, event.locatie as string | null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </header>

        {gasten.length === 0 ? (
          <p style={{ fontSize: 14, color: KLEUR.tekst }}>
            Er zijn nog geen aanmeldingen. Zodra je gasten reageren staat hier het overzicht dat je
            aan je locatie of cateraar kunt geven.
          </p>
        ) : (
          <>
            <section className="blok" style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Aantallen</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${KLEUR.zand}` }}>
                    <td style={{ padding: "8px 0", fontWeight: 700 }}>Komt</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}>{aanwezig.length}</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${KLEUR.zand}` }}>
                    <td style={{ padding: "8px 0 8px 16px", color: KLEUR.tekst }}>Volwassenen</td>
                    <td style={{ padding: "8px 0", textAlign: "right" }}>{volwassenen}</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${KLEUR.zand}` }}>
                    <td style={{ padding: "8px 0 8px 16px", color: KLEUR.tekst }}>
                      Kinderen
                      {kinderen.length > 0 && (
                        <span style={{ color: KLEUR.zacht }}>
                          {" "}({kinderen
                            .map((k) => (k.leeftijd != null ? `${k.leeftijd} jaar` : "leeftijd onbekend"))
                            .join(", ")})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "right" }}>{kinderen.length}</td>
                  </tr>
                  {[...perGroep.entries()].map(([groep, aantal]) => (
                    <tr key={groep} style={{ borderBottom: `1px solid ${KLEUR.zand}` }}>
                      <td style={{ padding: "8px 0 8px 16px", color: KLEUR.tekst }}>
                        {GROEP_LABEL[groep] ?? groep}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>{aantal}</td>
                    </tr>
                  ))}
                  {nogNiets > 0 && (
                    <tr style={{ borderBottom: `1px solid ${KLEUR.zand}` }}>
                      <td style={{ padding: "8px 0", color: KLEUR.tekst }}>Nog niets gehoord</td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>{nogNiets}</td>
                    </tr>
                  )}
                  {afgemeld > 0 && (
                    <tr style={{ borderBottom: `1px solid ${KLEUR.zand}` }}>
                      <td style={{ padding: "8px 0", color: KLEUR.tekst }}>Afgemeld</td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>{afgemeld}</td>
                    </tr>
                  )}
                  {voorlopig > 0 && (
                    <tr>
                      <td style={{ padding: "8px 0", color: KLEUR.tekst }}>
                        Waarvan voorlopig
                        <span style={{ color: KLEUR.zacht }}> (reageerde op de Save the Date, nog geen volledige aanmelding)</span>
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>{voorlopig}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="blok" style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Allergieën</h2>
              {allergieLijst.length === 0 ? (
                <p style={{ fontSize: 14, color: KLEUR.tekst, margin: 0 }}>Niemand heeft een allergie doorgegeven.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <tbody>
                    {allergieLijst.map((d) => (
                      <tr key={d.label} style={{ borderBottom: `1px solid ${KLEUR.zand}` }}>
                        <td style={{ padding: "8px 0", width: 56, fontWeight: 700 }}>{d.namen.length}&times;</td>
                        <td style={{ padding: "8px 0", fontWeight: 600 }}>{d.label}</td>
                        <td style={{ padding: "8px 0", color: KLEUR.tekst, textAlign: "right" }}>{d.namen.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="blok" style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Dieetwensen</h2>
              {dieetLijst.length === 0 ? (
                <p style={{ fontSize: 14, color: KLEUR.tekst, margin: 0 }}>Niemand heeft iets doorgegeven.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <tbody>
                    {dieetLijst.map((d) => (
                      <tr key={d.label} style={{ borderBottom: `1px solid ${KLEUR.zand}` }}>
                        <td style={{ padding: "8px 0", width: 56, fontWeight: 700 }}>{d.namen.length}&times;</td>
                        <td style={{ padding: "8px 0", fontWeight: 600 }}>{d.label}</td>
                        <td style={{ padding: "8px 0", color: KLEUR.tekst, textAlign: "right" }}>
                          {d.namen.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {blijftSlapen.length > 0 && (
              <section className="blok" style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>
                  Blijft slapen ({blijftSlapen.length})
                </h2>
                <p style={{ fontSize: 14, color: KLEUR.tekst, margin: 0, lineHeight: 1.7 }}>
                  {blijftSlapen.map((g) => g.name).join(", ")}
                </p>
              </section>
            )}

            <section className="blok">
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>
                Iedereen die komt ({aanwezig.length})
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${KLEUR.goudLicht}` }}>
                    <th style={{ padding: "6px 0", textAlign: "left", fontWeight: 700 }}>Naam</th>
                    <th style={{ padding: "6px 0", textAlign: "left", fontWeight: 700 }}>Groep</th>
                    <th style={{ padding: "6px 0", textAlign: "left", fontWeight: 700 }}>Leeftijd</th>
                    <th style={{ padding: "6px 0", textAlign: "left", fontWeight: 700 }}>Dieet en allergie</th>
                  </tr>
                </thead>
                <tbody>
                  {aanwezig.map((g, i) => (
                    <tr key={`${g.name}-${i}`} style={{ borderBottom: `1px solid ${KLEUR.zand}` }}>
                      <td style={{ padding: "6px 0" }}>{g.name}</td>
                      <td style={{ padding: "6px 0", color: KLEUR.tekst }}>
                        {GROEP_LABEL[g.guest_type ?? "daggast"] ?? g.guest_type}
                      </td>
                      <td style={{ padding: "6px 0", color: KLEUR.tekst }}>
                        {g.is_kind ? (g.leeftijd != null ? `${g.leeftijd} jaar` : "kind") : "volwassen"}
                      </td>
                      <td style={{ padding: "6px 0", color: KLEUR.tekst }}>
                        {[g.dietary?.trim(), g.allergie?.trim()].filter(Boolean).join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        <footer style={{ marginTop: 36, paddingTop: 14, borderTop: `1px solid ${KLEUR.zand}`, fontSize: 11, color: KLEUR.zacht }}>
          Overzicht van {formatDate(new Date().toISOString().slice(0, 10))} · gemaakt met SayingYes
        </footer>
      </div>
    </div>
  )
}
