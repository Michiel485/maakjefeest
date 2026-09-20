// De vormgeving op één plek: kleuren, letters, hoeken en schaduw.
//
// Waarom dit bestand bestaat: #C5A059 stond 115 keer in 38 bestanden, en 28
// bestanden definieerden hun eigen palet met eigen namen. Daardoor liep de
// vormgeving langzaam uit elkaar, net zoals de mailteksten uit elkaar liepen
// voordat lib/plans.ts de enige bron werd. Wie hier een kleur verandert,
// verandert hem overal.
//
// Twee vormen, dezelfde waarden:
// - deze constanten, voor inline stijlen, voor satori (de kaartafbeelding) en
//   voor de PDF-factuur, die geen CSS kunnen lezen
// - CSS-variabelen in app/globals.css, voor Tailwind-klassen
// Verander je hier iets, verander het daar ook. Ze staan met opzet naast
// elkaar en niet door elkaar: satori en @react-pdf/renderer kunnen echt geen
// var() aan.
//
// Geen imports, zodat dit ook in clientcode bruikbaar is.

// ── Kleuren ─────────────────────────────────────────────────────────────────
export const KLEUR = {
  /** Goud, de accentkleur. Randen, labels, prijzen. */
  goud: "#C5A059",
  /** Licht goud, voor randen die niet mogen schreeuwen. */
  goudLicht: "#E8D5A3",
  /** Heel licht goud, als vlak achter een uitgelicht blok. */
  goudVlak: "#FBF5E8",

  /** Bijna zwart, voor koppen en knoppen op licht. */
  inkt: "#1A1A1A",
  /** Lopende tekst op licht. */
  tekst: "#5C5248",
  /** Bijzin, hulptekst, labels. */
  zacht: "#9A8E82",

  /** De lichte achtergrond van de hele site. */
  ivoor: "#FAF7F2",
  /** Een kaartje op die achtergrond. */
  ivoorKaart: "#F5EFE4",
  /** Nog een tint dieper, voor scheidingen. */
  zand: "#EDE6D8",

  /** De donkere achtergrond van de homepage en de prijsblokken. */
  donker: "#0E0C09",
  /** Een kaartje op dat donker. */
  donkerKaart: "#161209",
  /** Lopende tekst op donker. */
  donkerTekst: "#B5A995",
  /** Bijzin op donker. */
  donkerZacht: "#8A7E72",

  /** Bevestigen, doorgaan, activeren. */
  groen: "#059669",
  groenVlak: "#ECFDF5",
  groenTekst: "#065F46",

  /** Fout, verwijderen. */
  rood: "#DC2626",
  roodVlak: "#FEF2F2",
  roodTekst: "#991B1B",
} as const

// ── Letters ─────────────────────────────────────────────────────────────────
// De variabelen komen uit next/font in app/layout.tsx.
export const LETTER = {
  /** Koppen en het merk: een serif met karakter. */
  kop: "var(--font-cormorant)",
  /** Lopende tekst. */
  tekst: "var(--font-geist-sans)",
} as const

// ── Vorm ────────────────────────────────────────────────────────────────────
export const VORM = {
  /** Hoekronding van een knop of veld. */
  hoekKlein: 12,
  /** Hoekronding van een paneel. */
  hoek: 16,
  /** Schaduw onder een kaartje. Negatieve spreiding, zodat de schaduw niet om
   *  de afgeronde hoeken heen kruipt en de uitsnede donker maakt. Dat was de
   *  oorzaak van de "doorlopende donkere achtergrond" bij de kaartanimatie. */
  schaduw: "0 18px 40px -20px rgba(0,0,0,0.25)",
  /** Schaduw onder een groene knop, in dezelfde kleur. */
  schaduwGroen: "0 4px 14px rgba(5,150,105,0.3)",
} as const
