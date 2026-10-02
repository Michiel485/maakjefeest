import Link from "next/link"
import { NavLoginButton } from "@/components/NavLoginButton"
import { GOUD, GOUD_LICHT, INKT, IVOOR, KOP_FONT, TEKST } from "./stijl"

/** De kop van de marketingsite: logo (een link), een paar pagina's, inloggen, Start gratis */
export default function Kop({ startHref = "/start" }: { startHref?: string }) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 backdrop-blur-md border-b"
      style={{ backgroundColor: `${IVOOR}EC`, borderColor: `${GOUD_LICHT}50` }}
    >
      <Link href="/" className="text-2xl tracking-wide" style={{ fontFamily: KOP_FONT, color: INKT, fontWeight: 600, textDecoration: "none" }}>
        SayingYes
      </Link>
      <nav className="flex items-center gap-4 sm:gap-5">
        <Link href="/digitale-trouwkaart" className="hidden md:inline text-sm transition-opacity hover:opacity-70" style={{ color: TEKST, textDecoration: "none" }}>
          Trouwkaart
        </Link>
        <Link href="/trouwwebsite-maken" className="hidden md:inline text-sm transition-opacity hover:opacity-70" style={{ color: TEKST, textDecoration: "none" }}>
          Trouwwebsite
        </Link>
        <Link href="/tips" className="hidden sm:inline text-sm transition-opacity hover:opacity-70" style={{ color: TEKST, textDecoration: "none" }}>
          Tips
        </Link>
        <NavLoginButton />
        {/* Ook op de telefoon in beeld, iets kleiner (Michiel, 2 oktober 2026) */}
        <Link
          href={startHref}
          className="inline-flex text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all duration-300 hover:opacity-85"
          style={{ backgroundColor: INKT, color: IVOOR, textDecoration: "none" }}
        >
          Start gratis
        </Link>
      </nav>
    </header>
  )
}

/** Een sierlijn, zoals op de kaart en de site */
export function Ornament({ kleur = GOUD_LICHT }: { kleur?: string }) {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden="true">
      <div style={{ width: 56, height: 1, backgroundColor: kleur }} />
      <svg width="7" height="7" viewBox="0 0 8 8" fill={kleur}><path d="M4 0 L8 4 L4 8 L0 4 Z" /></svg>
      <div style={{ width: 56, height: 1, backgroundColor: kleur }} />
    </div>
  )
}

export function Vinkje() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={GOUD} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function Pijl() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}
