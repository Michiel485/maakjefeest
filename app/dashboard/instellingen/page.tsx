import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { laadBruiloft, bruiloftNaam } from "@/lib/bruiloft-server"
import BouwerSchil from "@/components/BouwerSchil"
import DeadlineInstelling from "../Deadline"
import AccountVerwijderen from "../AccountVerwijderen"
import { KLEUR } from "@/lib/ontwerp"

export const metadata: Metadata = {
  title: "Instellingen",
  robots: { index: false, follow: false },
}

// Achter het tandwiel. Uit het klantreisgesprek van 21 september 2026: de
// deadline voor je aantallen, hoe vaak je een tussenstand wilt horen, en je
// account weggooien horen niet op het dashboard zelf. Daar staat alleen wat
// belangrijk is; dit is wat je één keer instelt.

export default async function InstellingenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect("/inloggen")

  const { bruiloft, alle, extra, stand } = await laadBruiloft(user.email)

  return (
    <BouwerSchil actief="dashboard" eventId={bruiloft?.id ?? null}>
      <main className="max-w-3xl w-full mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
        <div>
          <Link href="/dashboard" className="text-sm" style={{ color: KLEUR.zacht, textDecoration: "none" }}>
            {"←"} Terug naar je dashboard
          </Link>
          <h1
            className="mt-2 mb-0"
            style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 600, color: KLEUR.inkt }}
          >
            Instellingen
          </h1>
          <p className="text-sm mt-1" style={{ color: KLEUR.zacht }}>
            {bruiloftNaam(bruiloft)}
          </p>
        </div>

        {bruiloft && bruiloft.datum ? (
          <DeadlineInstelling
            eventId={bruiloft.id}
            trouwdag={bruiloft.datum}
            deadline={extra[bruiloft.id]?.deadline ?? null}
            frequentie={extra[bruiloft.id]?.stand_frequentie ?? "wekelijks"}
            komen={stand.komen}
            stil={stand.stil}
          />
        ) : (
          <p className="text-sm m-0 max-w-[62ch]" style={{ color: KLEUR.tekst }}>
            Zet eerst je trouwdatum in de bouwer, dan kun je hier je deadline voor de locatie
            instellen en kiezen hoe vaak je een tussenstand wilt horen.
          </p>
        )}

        <AccountVerwijderen email={user.email} aantalBruiloften={alle.length} />
      </main>
    </BouwerSchil>
  )
}
