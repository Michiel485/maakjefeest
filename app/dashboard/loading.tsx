import BouwerSchil from "@/components/BouwerSchil"
import { KLEUR } from "@/lib/ontwerp"

// Wat je ziet in de tellen dat het dashboard zijn gegevens ophaalt.
//
// Zonder dit bleef je bij het wisselen van tabblad op de bouwer staan tot de
// server klaar was, en dat voelde als een hangende knop. Nu springt de schil
// meteen om en vullen de tegels zich in. Dezelfde kop als het dashboard zelf,
// zodat er niets verspringt.

function Blok({ h, w = "100%" }: { h: number; w?: string }) {
  return <div className="rounded-xl animate-pulse" style={{ height: h, width: w, backgroundColor: KLEUR.ivoorKaart }} />
}

function TegelSkelet({ breed = false }: { breed?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-3 p-5 rounded-2xl ${breed ? "md:col-span-2" : ""}`}
      style={{ backgroundColor: "#fff", border: `1px solid ${KLEUR.zand}` }}
    >
      <Blok h={22} w="40%" />
      <Blok h={14} w="85%" />
      <Blok h={44} />
      <div className="flex gap-2 mt-1">
        <Blok h={36} w="130px" />
        <Blok h={36} w="130px" />
      </div>
    </div>
  )
}

export default function DashboardLaden() {
  return (
    <BouwerSchil actief="dashboard" eventId={null}>
      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-7 md:py-9 flex flex-col gap-6" aria-busy="true" aria-label="Dashboard wordt geladen">
        <div className="flex flex-col gap-2">
          <Blok h={36} w="45%" />
          <Blok h={14} w="30%" />
        </div>
        <Blok h={64} />
        <div className="grid gap-4 md:grid-cols-2">
          <TegelSkelet />
          <TegelSkelet />
          <TegelSkelet breed />
          <TegelSkelet breed />
        </div>
      </main>
    </BouwerSchil>
  )
}
