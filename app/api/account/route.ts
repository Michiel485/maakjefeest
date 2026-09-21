import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { verwijderEventInhoud } from "@/lib/opruimen"

export const dynamic = "force-dynamic"

// Je account verwijderen.
//
// Michiels verzoek van 21 september 2026: ergens in het dashboard, niet te
// opvallend, een knop om alles weg te gooien. Hij wilde de klantreis opnieuw
// kunnen doorlopen, maar dit hoort er ook gewoon te zijn: je moet van ons af
// kunnen komen zonder te mailen.
//
// Dit is onomkeerbaar, dus er zitten drie horden voor:
//
// 1. Je moet ingelogd zijn.
// 2. Je moet je eigen mailadres intypen. Niet omdat wij het niet weten, maar
//    omdat je dan niet per ongeluk op een knop kunt drukken.
// 3. De knop staat onderaan het dashboard, achter een bevestiging.
//
// Eén ding gaat níet weg: je facturen. Daar zit een wettelijke bewaarplicht op
// van zeven jaar, en dat staat ook zo in de bevestiging. De koppeling met de
// bruiloft valt wel weg, want die rij bestaat niet meer.

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { bevestig?: unknown } | null
  const getypt = typeof body?.bevestig === "string" ? body.bevestig.trim().toLowerCase() : ""

  if (getypt !== user.email.toLowerCase()) {
    return Response.json(
      { error: "Typ je eigen e-mailadres om te bevestigen." },
      { status: 400 }
    )
  }

  const service = createServiceClient()

  const { data: events } = await service
    .from("events")
    .select("id, slug, hero_image_url")
    .eq("user_email", user.email)

  let bestanden = 0
  for (const event of events ?? []) {
    bestanden += await verwijderEventInhoud(
      service,
      event.id as string,
      (event.hero_image_url as string | null) ?? null
    )
  }

  // De bruiloften zelf. Facturen hebben een verwijzing met on delete set null,
  // dus die blijven staan zonder hun bruiloft. Dat is de bedoeling.
  const { error: eventFout } = await service
    .from("events")
    .delete()
    .eq("user_email", user.email)

  if (eventFout) {
    console.error("[account] bruiloften verwijderen mislukt:", eventFout)
    return Response.json(
      { error: "Verwijderen mislukte. Er is nog niets weggegooid, probeer het nog eens." },
      { status: 500 }
    )
  }

  // En als laatste de inlog zelf. Dit als laatste, zodat je bij een fout
  // hierboven nog kunt inloggen om het opnieuw te proberen.
  const { error: userFout } = await service.auth.admin.deleteUser(user.id)
  if (userFout) {
    console.error("[account] inlog verwijderen mislukt:", userFout)
    // De bruiloften zijn wel weg. Dat is niet terug te draaien, dus we melden
    // het eerlijk in plaats van te doen alsof er niets gebeurd is.
    return Response.json(
      {
        error:
          "Je bruiloften en gasten zijn verwijderd, maar je inlog niet. Mail ons, dan halen we die er met de hand uit.",
        deelsGelukt: true,
      },
      { status: 500 }
    )
  }

  console.log(
    "[account] verwijderd:",
    user.email,
    "| bruiloften:",
    (events ?? []).length,
    "| bestanden:",
    bestanden
  )

  return Response.json({
    success: true,
    bruiloften: (events ?? []).length,
    bestanden,
  })
}
