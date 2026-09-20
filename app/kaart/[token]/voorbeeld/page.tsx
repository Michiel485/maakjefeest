// Voorbeeldweergave voor het bruidspaar: de kaart bekijken voordat hij naar de
// gasten gaat. Bewust een eigen route en bewust niet gecached, want hier wordt
// een cookie gelezen om te zien wie er kijkt. Eén paar kijkt hier een keer; de
// gasten gaan naar de gecachte publieke link.
export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { fetchCardByToken, isOpenbaar } from "@/lib/cards-server"
import { KaartWeergave, NogNietActief } from "../weergave"

// Een voorbeeld hoort nooit in Google
export const metadata: Metadata = {
  title: "Voorbeeld van jullie kaart",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default async function KaartVoorbeeldPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await fetchCardByToken(token)
  if (!data) notFound()

  let isEigenaar = false
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    isEigenaar = Boolean(user?.email && user.email === data.event.user_email)
  } catch {
    isEigenaar = false
  }

  // Niet van jou en nog niet verstuurd: de kaartlink is het product, dus die
  // blijft dicht. Is hij al wel openbaar, dan is dit gewoon dezelfde kaart.
  if (!isEigenaar && !isOpenbaar(data)) return <NogNietActief plan={data.event.plan} />

  return <KaartWeergave data={data} isEigenaar={isEigenaar} />
}
