// Wat SayingYes in de browser bewaart, en hoe je het weer weghaalt.
//
// Het ontwerp, de namen, de datum en de locatie staan in de browser zolang er
// nog niets op de server staat, zodat je niets kwijtraakt. Dat hoort bij wie
// er nu achter de browser zit. Bij uitloggen en bij het verwijderen van je
// account gaat het weg: anders zag de volgende die op deze computer inlogde
// jouw bruiloft in zijn dashboard (Michiels bevinding van 24 september 2026,
// bij het inloggen met een tweede adres).
//
// Cookie- en meetvoorkeuren blijven staan: die zijn van de bezoeker, niet van
// een bruiloft.

export function wisBruiloftUitBrowser(): void {
  try {
    for (const sleutel of Object.keys(localStorage)) {
      if (sleutel.startsWith("sayingyes_") || sleutel === "sophie_skipped") localStorage.removeItem(sleutel)
    }
  } catch {}
}
