import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { laadBruiloft, bruiloftNaam } from "@/lib/bruiloft-server"
import BouwerSchil from "@/components/BouwerSchil"
import Checklist from "../Checklist"
import { huidigeFase } from "@/lib/fasen"
import { KLEUR } from "@/lib/ontwerp"

export const metadata: Metadata = {
  title: "Checklist",
  robots: { index: false, follow: false },
}

// De checklist op een eigen pagina. Op het dashboard stond hij in zijn
// geheel en dat was overweldigend: tweeëndertig punten die je elke keer
// voorbij scrolt. Nu is het één regel op het dashboard, en hier de lijst
// voor wie eraan toe is. De fase bepaalt alleen welk blok openstaat.

export default async function ChecklistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect("/inloggen")

  const { bruiloft, extra, signalen } = await laadBruiloft(user.email)

  const fase = huidigeFase(bruiloft?.datum ?? null, {
    stdVerstuurd: signalen.stdVerstuurd,
    invVerstuurd: signalen.invVerstuurd,
    aantallenDoorgegeven: signalen.aantallenDoorgegeven,
  })

  return (
    <BouwerSchil actief="dashboard" eventId={bruiloft?.id ?? null}>
      <main className="max-w-3xl w-full mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">
        <div>
          <Link href="/dashboard" className="text-sm" style={{ color: KLEUR.zacht, textDecoration: "none" }}>
            {"←"} Terug naar je dashboard
          </Link>
          <p className="text-sm mt-2 mb-0" style={{ color: KLEUR.zacht }}>
            {bruiloftNaam(bruiloft)}
          </p>
        </div>

        {bruiloft ? (
          <Checklist
            eventId={bruiloft.id}
            fase={fase}
            stand={extra[bruiloft.id]?.checklist ?? null}
            signalen={signalen}
          />
        ) : (
          <p className="text-sm m-0 max-w-[62ch]" style={{ color: KLEUR.tekst }}>
            Zodra je een ontwerp hebt bewaard, staat hier je checklist voor de hele bruiloft.
          </p>
        )}
      </main>
    </BouwerSchil>
  )
}
