"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KLEUR } from "@/lib/ontwerp"
import { eventSiteUrl, eventSiteLabel } from "@/lib/site-url"
import ActieMenu, { ActieFout, ActieItem, ActieScheiding, ActieUitleg, ActieVeld } from "./ActieMenu"

// Alles wat je met je website kunt doen, op de regel in de websitetegel.
//
// Kwam van het blok "Beheer" onder de tegels: verder bouwen, bekijken, het
// webadres wijzigen, verlengen. Michiel wilde dat blok weg en alles onder de
// tegels zelf, 22 september 2026. Weggooien staat bewust niet hier maar bij
// Instellingen: dat is de bruiloft weggooien, niet alleen de site.

function schoonAdres(v: string): string {
  return v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export default function WebsiteActies({
  eventId,
  slug,
  live,
  magVerlengen,
  fotomuurAan,
  prijs,
}: {
  eventId: string
  slug: string
  /** Staat de site op internet, dus werkt het adres voor gasten? */
  live: boolean
  /** Alleen bij een betaalde site met een einddatum. */
  magVerlengen: boolean
  fotomuurAan: boolean
  /** Wat live zetten kost, bijvoorbeeld "€34,99". */
  prijs: string
}) {
  const router = useRouter()
  const [adresWijzigen, setAdresWijzigen] = useState(false)
  const [nieuwAdres, setNieuwAdres] = useState(slug)
  const [bezig, setBezig] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  const siteUrl = eventSiteUrl(slug)

  function kopieerLink() {
    navigator.clipboard.writeText(siteUrl).then(
      () => {
        setGekopieerd(true)
        setTimeout(() => setGekopieerd(false), 2000)
      },
      () => setFout("Kopiëren lukte niet. Open de site en kopieer het adres uit de adresbalk."),
    )
  }

  async function bewaarAdres(sluit: () => void) {
    const schoon = schoonAdres(nieuwAdres)
    if (schoon.length < 3) {
      setFout("Een adres heeft minstens drie tekens.")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch("/api/event/update-slug", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, newSlug: schoon }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setFout(json.error ?? "Wijzigen lukte niet, probeer het nog eens.")
        return
      }
      setAdresWijzigen(false)
      sluit()
      router.refresh()
    } catch {
      setFout("Wijzigen lukte niet, probeer het nog eens.")
    } finally {
      setBezig(false)
    }
  }

  return (
    <ActieMenu>
      {(sluit) => (
        <>
          <ActieItem href={`/bouwen?event_id=${eventId}`}>Verder bouwen</ActieItem>
          {live ? (
            <>
              <ActieItem href={siteUrl} nieuwTabblad>
                Bekijk je site
              </ActieItem>
              <ActieItem onClick={kopieerLink}>{gekopieerd ? "Adres gekopieerd" : "Adres kopiëren"}</ActieItem>
            </>
          ) : (
            <>
              <ActieItem href={`/betalen?event_id=${eventId}&plan=compleet`} nadruk>
                Live zetten voor {prijs}
              </ActieItem>
              <ActieUitleg>Daarna staat je site op {eventSiteLabel(slug)} en kun je het adres delen.</ActieUitleg>
            </>
          )}
          {fotomuurAan && <ActieItem href="/dashboard#fotos">Fotomuur</ActieItem>}

          <ActieScheiding />

          {adresWijzigen ? (
            <ActieVeld
              waarde={nieuwAdres}
              opWaarde={(v) => {
                setNieuwAdres(schoonAdres(v))
                setFout(null)
              }}
              placeholder={slug}
              bewaar={() => void bewaarAdres(sluit)}
              annuleer={() => setAdresWijzigen(false)}
              bezig={bezig}
              mono
              kinderen={
                <p className="m-0 text-[11px] leading-snug" style={{ color: KLEUR.zacht }}>
                  {eventSiteLabel(schoonAdres(nieuwAdres) || slug)}
                  {live && (
                    <>
                      <br />
                      <b style={{ color: "#991B1B" }}>Let op:</b> het oude adres werkt daarna niet meer. Gasten met
                      de oude link komen op niets uit.
                    </>
                  )}
                </p>
              }
            />
          ) : (
            <ActieItem onClick={() => setAdresWijzigen(true)}>Webadres wijzigen</ActieItem>
          )}

          {magVerlengen && (
            <ActieItem href={`/verlengen?event_id=${eventId}`}>Verlengen, 6 maanden voor {"€"}22</ActieItem>
          )}

          <ActieScheiding />

          <ActieItem href="/dashboard/instellingen">Weggooien, bij Instellingen</ActieItem>

          {fout && <ActieFout>{fout}</ActieFout>}
        </>
      )}
    </ActieMenu>
  )
}
