"use client"

// Secties komen zachtjes in beeld terwijl je scrolt. Eén beweging, overal
// hetzelfde (de regels staan in app/globals.css bij "sy-beweegt"). De pagina
// staat eerst gewoon helemaal op het scherm; pas als dit onderdeel er is
// worden de secties die nog onder de rand staan verstopt, en wat al in beeld
// is blijft staan. Wie "minder beweging" heeft ingesteld ziet niets bewegen.

import { useEffect } from "react"

export default function Verschijn() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const elementen = Array.from(document.querySelectorAll<HTMLElement>("[data-verschijn]"))
    if (!elementen.length) return
    const grens = window.innerHeight * 0.92
    for (const el of elementen) {
      if (el.getBoundingClientRect().top < grens) el.classList.add("sy-in")
    }
    document.documentElement.classList.add("sy-beweegt")
    const kijker = new IntersectionObserver(
      (items) => {
        for (const item of items) {
          if (!item.isIntersecting) continue
          item.target.classList.add("sy-in")
          kijker.unobserve(item.target)
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    )
    for (const el of elementen) kijker.observe(el)
    return () => {
      kijker.disconnect()
      document.documentElement.classList.remove("sy-beweegt")
    }
  }, [])
  return null
}
