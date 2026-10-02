"use client"

// Telt één stap van de funnel zodra de pagina open is (lib/stap.ts).

import { useEffect } from "react"
import { meetStap, type Stap } from "@/lib/stap"

export default function MeetStap({ naam }: { naam: Stap }) {
  useEffect(() => { meetStap(naam) }, [naam])
  return null
}
