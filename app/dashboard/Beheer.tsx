// Het kopje boven een blok op het dashboard, in goud en kapitalen.
//
// Hier stond het beheer van een bruiloft: verlengen, het adres wijzigen,
// weggooien. Dat zit sinds 22 september 2026 in het actiemenu van de tegels
// zelf (KaartActies, WebsiteActies) en bij Instellingen. Alleen dit kopje is
// gebleven.

const GOLD = "#C5A059"

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-semibold uppercase tracking-[0.18em]"
      style={{ color: GOLD }}
    >
      {children}
    </h2>
  )
}
