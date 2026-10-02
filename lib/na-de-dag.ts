// Na de bruiloft verandert de site (ontwerpronde, 2 oktober 2026): de opening
// zegt "Wij zijn getrouwd", aanmelden verdwijnt en de foto's komen bovenaan.
// Zo blijft de site een jaar leven in plaats van dood te zijn na de dag.

/** Vanaf de dag na de bruiloft */
export function naDeDag(datum: string | null | undefined, nu = new Date()): boolean {
  if (!datum) return false
  const dag = new Date(datum)
  if (Number.isNaN(dag.getTime())) return false
  const vandaag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())
  const trouwdag = new Date(dag.getFullYear(), dag.getMonth(), dag.getDate())
  return vandaag.getTime() > trouwdag.getTime()
}
