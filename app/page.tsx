import Link from "next/link"
import { NavLoginButton } from "@/components/NavLoginButton"

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* ── Nav ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <span className="text-lg font-bold text-rose-600 tracking-tight">Saying Yes</span>
        <NavLoginButton />
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 pt-10 pb-32">

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full bg-rose-200 opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute top-10 -right-16 w-64 h-64 rounded-full bg-orange-200 opacity-25 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-[250px] rounded-full" style={{ width: 500, height: 500, backgroundColor: "#f9a8d4", opacity: 0.4 }} />
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -right-[225px] rounded-full" style={{ width: 450, height: 450, backgroundColor: "#fcd34d", opacity: 0.35 }} />

        {/* Wave separator */}
        <svg
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 w-full text-white"
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" />
        </svg>

        <div className="relative flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-rose-100 text-rose-500 text-sm font-semibold px-5 py-2 rounded-full mb-8 shadow-sm">
            <svg className="w-4 h-4 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Eenmalig €24 — geen maandelijkse kosten
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Maak jullie bruiloft<br />
            <span className="text-rose-500">onvergetelijk</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-xl mb-10 leading-relaxed">
            Bouw in minuten een prachtige bruiloftswebsite voor jullie grote dag.
            Deel hem met jullie gasten en ontvang aanmeldingen direct in jullie dashboard.
          </p>

          <Link
            href="/aanmaken"
            className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-base font-bold px-9 py-4 rounded-2xl shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-200 hover:-translate-y-0.5 transition-all"
          >
            Start nu gratis
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="mt-3 text-xs text-gray-400">Geen account nodig om te starten</p>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="max-w-5xl mx-auto px-6 -mt-6 pb-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* RSVP */}
          <div className="group rounded-3xl border border-pink-100 bg-gradient-to-b from-rose-50 to-pink-50 p-8 flex flex-col gap-5 shadow-md hover:shadow-xl hover:shadow-rose-100 hover:-translate-y-1.5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-rose-200">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">RSVP</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Gasten melden zich aan via een stijlvol formulier. Jij ziet alle aanmeldingen overzichtelijk in jullie dashboard.
              </p>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              {["Aanmelden", "Overzicht", "Export"].map(t => (
                <span key={t} className="text-xs font-semibold bg-rose-100 text-rose-500 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          {/* Programma */}
          <div className="group rounded-3xl border border-amber-100 bg-gradient-to-b from-amber-50 to-orange-50 p-8 flex flex-col gap-5 shadow-md hover:shadow-xl hover:shadow-amber-100 hover:-translate-y-1.5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md shadow-amber-200">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">Programma</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Deel het tijdschema van jullie grote dag. Van de ceremonie tot het avondfeest — overzichtelijk en stijlvol.
              </p>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              {["Ceremonie", "Diner", "Feest"].map(t => (
                <span key={t} className="text-xs font-semibold bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          {/* Wishlist */}
          <div className="group rounded-3xl border border-teal-100 bg-gradient-to-b from-teal-50 to-cyan-50 p-8 flex flex-col gap-5 shadow-md hover:shadow-xl hover:shadow-teal-100 hover:-translate-y-1.5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-200">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">Wishlist</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Zet jullie cadeauwensen op de website. Gasten kunnen eenvoudig zien wat jullie leuk vinden.
              </p>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              {["Cadeaus", "Bijdrage", "Lijst"].map(t => (
                <span key={t} className="text-xs font-semibold bg-teal-100 text-teal-600 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Hoe werkt het ── */}
      <section className="bg-gray-950 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Simpel en snel</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-16">In drie stappen live</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                n: "01", color: "text-rose-400", border: "border-rose-900", bg: "bg-rose-950",
                title: "Vul jullie gegevens in",
                body: "Vul de namen, trouwdatum en locatie in. We zetten jullie bruiloftswebsite direct voor jullie klaar.",
              },
              {
                n: "02", color: "text-amber-400", border: "border-amber-900", bg: "bg-amber-950",
                title: "Bouw jullie website",
                body: "Personaliseer de pagina's: welkomsttekst, programma, RSVP-formulier en praktische informatie.",
              },
              {
                n: "03", color: "text-teal-400", border: "border-teal-900", bg: "bg-teal-950",
                title: "Deel met jullie gasten",
                body: "Betaal eenmalig €24 en zet jullie bruiloftswebsite live op een eigen subdomein. 2 jaar online.",
              },
            ].map(({ n, color, border, bg, title, body }) => (
              <div key={n} className={`rounded-3xl border ${border} ${bg} p-8 text-left flex flex-col gap-4`}>
                <span className={`text-4xl font-black ${color} opacity-60 leading-none`}>{n}</span>
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 py-20 px-6 text-center">
        <div className="pointer-events-none absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-white opacity-10" />
        <div className="pointer-events-none absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white opacity-10" />
        <h2 className="relative text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
          Klaar om jullie bruiloft<br />te bouwen?
        </h2>
        <p className="relative text-rose-100 text-lg mb-8">Start vandaag nog — jullie website is in minuten klaar.</p>
        <Link
          href="/aanmaken"
          className="relative inline-flex items-center gap-2 bg-white text-rose-500 font-bold px-9 py-4 rounded-2xl hover:bg-rose-50 transition-colors shadow-xl text-base"
        >
          Start nu gratis
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
        <p className="relative mt-4 text-xs text-rose-200">Eenmalig €24 · Geen maandelijkse kosten · Altijd online</p>
      </section>

      <footer className="bg-gray-950 border-t border-gray-900 py-7 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Saying Yes
      </footer>
    </div>
  )
}
