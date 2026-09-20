// Vergelijken van het antwoord op de geheime vraag van een klantsite.
//
// Staat apart omdat het zowel op de server nodig is (de echte controle) als
// los te lezen moet zijn. Een gast typt "de camping in Frankrijk" waar het
// antwoord "de camping in frankrijk!" is; dat hoort gewoon te werken.

/** Kleine letters, geen spaties, geen leestekens. */
function normaliseer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[&\-_,;:.!?'"()/\\]/g, " ")
    .replace(/\s+/g, "")
}

/** Afstand tussen twee woorden: hoeveel tekens moeten er anders. */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

/** Waar zodra het antwoord voor negentig procent klopt. */
export function fuzzyMatch(input: string, answer: string): boolean {
  const a = normaliseer(input)
  const b = normaliseer(answer)
  if (a === b) return true
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return true
  return (maxLen - levenshtein(a, b)) / maxLen >= 0.9
}
