// Het gastenboek: de berichtjes die gasten bij het aanmelden schreven, na een
// vinkje van het bruidspaar in de gastenlijst (rsvp.bericht_openbaar).
// Gratis inhoud die de site levend maakt (ontwerpronde, 2 oktober 2026).

import type { SC } from "@/lib/event-styles"
import SectieKop from "./SectieKop"

export interface GastenboekBericht {
  naam: string
  tekst: string
}

export default function Gastenboek({ berichten, sc }: { berichten: GastenboekBericht[]; sc: SC }) {
  if (!berichten.length) return null
  return (
    <div className="@container" style={{ fontFamily: sc.fontFamily, padding: "48px 24px 56px" }}>
      <SectieKop sc={sc} kopje="Lieve woorden" titel="Gastenboek" />
      <div className="mx-auto grid grid-cols-1 @md:grid-cols-2" style={{ gap: 18, maxWidth: 820 }}>
        {berichten.map((b, i) => (
          <figure
            key={i}
            style={{
              margin: 0,
              padding: "22px 24px",
              borderRadius: 16,
              backgroundColor: `${sc.accent}0d`,
              border: `1px solid ${sc.accent}26`,
              // Het laatste berichtje alleen in de rij: dan over de hele breedte
              gridColumn: berichten.length % 2 === 1 && i === berichten.length - 1 ? "1 / -1" : undefined,
              maxWidth: berichten.length % 2 === 1 && i === berichten.length - 1 ? 520 : undefined,
              justifySelf: berichten.length % 2 === 1 && i === berichten.length - 1 ? "center" : undefined,
              width: "100%",
            }}
          >
            <blockquote style={{ margin: 0, fontFamily: sc.fontPageTitles, fontWeight: sc.fontPageTitlesWeight, fontStyle: "italic", fontSize: "1.2rem", lineHeight: 1.45, color: sc.headingColor, whiteSpace: "pre-wrap" }}>
              &ldquo;{b.tekst}&rdquo;
            </blockquote>
            <figcaption style={{ marginTop: 12, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: sc.accent }}>
              {b.naam}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
