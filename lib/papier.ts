// De rekensom tegenover papier, voor de vraag "Waarom digitaal in plaats van
// papier?" op de homepage. Het blok met de vergelijking stond op 11 oktober
// 2026 kort op de homepage en de zoekpagina's; dat vond Michiel te veel, dus
// alleen de getallen zijn gebleven.
//
// Een postzegel kost sinds 1 januari 2026 €1,40 (PostNL; NOS, 2025). Bij 100
// gasten gaat er ongeveer één kaart per huishouden uit. Het drukwerk staat er
// zonder bedrag bij: daar zijn geen harde prijzen voor trouwkaarten te vinden.
// Elk jaar op 1 januari nakijken.
export const POSTZEGEL = 1.4
export const GASTEN = 100
export const HUISHOUDENS = 60
export const PORTO_RONDE = Math.round(POSTZEGEL * HUISHOUDENS)
