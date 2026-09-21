"use client"

import Link from "next/link"
import { KLEUR } from "@/lib/ontwerp"
import BouwerSchakelaar, { type Onderdeel } from "./BouwerSchakelaar"

// De schil waar het dashboard en de drie bouwers in wonen.
//
// Uit het klantreisgesprek van 21 september 2026. Er waren drie koppen die op
// elkaar leken omdat ze van elkaar gekopieerd waren: het dashboard, de
// kaartbouwer en de websitebouwer. Nu is er één, met vier tabbladen. De
// pagina's eronder zijn nog aparte routes; wat de klant ziet is één bouwer.
//
// Op een telefoon:
// - de tabbladen worden een menuknop met de naam van waar je bent
// - de knoppen rechtsboven (bewaren, activeren) verhuizen naar een vaste balk
//   onderaan, in het duimgebied
// - de inhoud krijgt onderaan ruimte, zodat die balk niets bedekt

export default function BouwerSchil({
  actief,
  eventId,
  opKaartType,
  opWebsite,
  metInhoud,
  /** De knoppen rechtsboven, en op de telefoon in de balk onderaan. */
  acties,
  /** Iets dat onder de kop hoort, zoals een foutmelding. */
  onderKop,
  className,
  children,
}: {
  actief: Onderdeel
  eventId: string | null
  opKaartType?: (type: "save_the_date" | "trouwkaart") => void
  opWebsite?: () => void
  metInhoud?: Onderdeel[]
  acties?: React.ReactNode
  onderKop?: React.ReactNode
  /** Extra klassen op het omhulsel, bijvoorbeeld een vaste hoogte op desktop. */
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      translate="no"
      className={`min-h-screen flex flex-col antialiased ${className ?? ""}`}
      style={{ backgroundColor: KLEUR.ivoor }}
    >
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: "#fff", borderColor: `${KLEUR.goudLicht}80` }}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="text-xl tracking-wide"
            style={{ fontFamily: "var(--font-cormorant)", color: KLEUR.inkt, fontWeight: 600, textDecoration: "none" }}
          >
            SayingYes
          </Link>
          <div className="hidden md:block">
            <BouwerSchakelaar
              actief={actief}
              eventId={eventId}
              opKaartType={opKaartType}
              opWebsite={opWebsite}
              metInhoud={metInhoud}
            />
          </div>
        </div>

        <div className="md:hidden">
          <BouwerSchakelaar
            actief={actief}
            eventId={eventId}
            opKaartType={opKaartType}
            opWebsite={opWebsite}
            metInhoud={metInhoud}
            variant="menu"
          />
        </div>

        {acties && <div className="hidden md:flex items-center gap-2">{acties}</div>}
      </header>

      {onderKop}

      {/* Onderaan ruimte voor de balk op de telefoon, zodat die niets bedekt. */}
      <div className={`flex flex-col flex-1 min-h-0 ${acties ? "pb-20 md:pb-0" : ""}`}>{children}</div>

      {acties && (
        <div
          className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center gap-2 px-3 pt-2.5 border-t"
          style={{
            backgroundColor: KLEUR.ivoor,
            borderColor: `${KLEUR.goudLicht}80`,
            paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {acties}
        </div>
      )}
    </div>
  )
}
