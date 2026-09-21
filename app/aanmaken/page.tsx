import { redirect } from "next/navigation"

// Het aanmaakformulier is weg. Namen, datum en locatie vul je in de bouwer
// zelf in, bij Algemene info, en die staan dan op elke kaart en op de website.
//
// Deze route blijft bestaan als doorverwijzing, omdat de link in oude mails
// en in de zoekmachines staat. Wie hier binnenkomt gaat door naar de bouwer
// met hetzelfde pakket.

export default async function AanmakenPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : undefined
  const plan = typeof params?.plan === "string" && params.plan ? params.plan : "compleet"
  redirect(`/bouwen?plan=${encodeURIComponent(plan)}`)
}
