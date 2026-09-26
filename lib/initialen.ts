// De eerste letters van het bruidspaar, voor de boog en het zegel.
//
// Eén plek, want de boog en het zegel gebruikten elk een eigen versie. Die
// van het zegel kende alleen & en "en", dus bij "Michiel | Lindsey" stond er
// alleen een M op het zegel (Michiel, 26 september 2026).

/** ["M", "L"] uit "Michiel | Lindsey", "Michiel & Lindsey", "Michiel en Lindsey", ... */
export function initialenLijst(namen: string): string[] {
  // Scheiden op alles waarmee een bruidspaar twee namen kan scheiden: &, +,
  // |, /, een komma, een enter of een woord als "en"
  const delen = namen
    .split(/\s*(?:&|\+|\||\/|,|·|\r?\n|\ben\b|\band\b|\bet\b|\bund\b|\by\b|\be\b)\s*/i)
    .map((d) => d.trim())
    .filter(Boolean)
  if (delen.length >= 2) return [delen[0][0], delen[delen.length - 1][0]].map((l) => l.toUpperCase())
  // Twee woorden zonder iets ertussen: "Michiel Lindsey"
  const woorden = (delen[0] ?? "").split(/\s+/).filter(Boolean)
  if (woorden.length >= 2) return [woorden[0][0], woorden[woorden.length - 1][0]].map((l) => l.toUpperCase())
  return woorden[0] ? [woorden[0][0].toUpperCase()] : []
}
