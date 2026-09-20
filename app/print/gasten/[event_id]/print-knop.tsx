"use client"

import { Knop } from "@/components/ui"

// Verdwijnt zelf uit de afdruk: zie de printregels in de pagina hiernaast.
export default function PrintKnop() {
  return (
    <Knop soort="primair" onClick={() => window.print()}>
      Afdrukken of opslaan als pdf
    </Knop>
  )
}
