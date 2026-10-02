import Link from "next/link"
import { DONKER, DONKER_ZACHT, KOP_FONT } from "./stijl"

const LINKS: [string, string][] = [
  ["/digitale-trouwkaart", "Digitale trouwkaart"],
  ["/save-the-date", "Save the Date"],
  ["/trouwwebsite-maken", "Trouwwebsite"],
  ["/kaart-voorbeeld", "Voorbeeldkaart"],
  ["/tips", "Tips"],
  ["/contact", "Contact"],
  ["/privacy", "Privacy"],
  ["/voorwaarden", "Voorwaarden"],
]

/** De voet van de marketingsite, met alle pagina's erin */
export default function Voet() {
  return (
    <footer className="py-10 px-6 text-center" style={{ backgroundColor: DONKER, borderTop: "1px solid #1A1510" }}>
      <p style={{ fontFamily: KOP_FONT, fontSize: "1.25rem", color: DONKER_ZACHT, fontWeight: 600, margin: "0 0 14px" }}>SayingYes</p>
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs" style={{ color: "#6B6052" }}>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="hover:opacity-70 transition-opacity" style={{ color: "inherit", textDecoration: "none" }}>
            {label}
          </Link>
        ))}
      </nav>
      <p className="text-xs mt-5" style={{ color: "#4A4030" }}>
        &copy; {new Date().getFullYear()} SayingYes, Amersfoort. Gemaakt voor onze eigen bruiloft, nu voor die van jullie.
      </p>
    </footer>
  )
}
