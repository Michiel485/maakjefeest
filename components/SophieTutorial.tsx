"use client"

import { useState, useEffect } from "react"

const GOLD       = "#C5A059"
const GOLD_LIGHT = "#E8D5A3"
const GOLD_BG    = "#FBF5E8"
const CHARCOAL   = "#1A1A1A"
const BODY       = "#5C5248"
const SUBTLE     = "#9A8E82"

export interface SophieNav {
  activeSection?:  'algemeen' | 'paginas' | 'url' | null
  openAlgSection?: 'stijl' | 'layout' | 'lettertype' | null
  activeSubPage?:  string | null
  openHomeSection?: 'layout' | 'headerfoto' | 'kaders' | 'tekstvelden' | 'welkomst' | null
}

interface Props {
  onNavigate: (nav: SophieNav) => void
}

const STEPS: { label: string; title: string; text: string; nav: SophieNav }[] = [
  {
    label: "Stap 1 · Stijl",
    title: "Laten we beginnen met de sfeer 🎨",
    text: "Kies een kleurthema dat past bij jullie dag. Van warm ivoor tot stoer emerald — elk thema heeft zijn eigen kleurpalet en sfeer. Je ziet de verandering direct in de preview. Geen zorgen, dit kun je later altijd nog aanpassen!",
    nav: { activeSection: 'algemeen', openAlgSection: 'stijl' },
  },
  {
    label: "Stap 2 · Lay-out",
    title: "De opbouw van de website 📐",
    text: "Wil je de inhoud netjes in een kader of volle breedte? Aparte pagina's via het menu, of alles op één lange pagina? Ook de navigatiestijl stel je hier in — links, verdeeld of gecentreerd. Kies wat past bij jullie smaak, alles is later eenvoudig te wijzigen.",
    nav: { activeSection: 'algemeen', openAlgSection: 'layout' },
  },
  {
    label: "Stap 3 · Lettertype",
    title: "Het lettertype bepaalt de stijl 🖋️",
    text: "Een romantisch handschrift, een klassiek schreeflettertype of iets moderns — het lettertype geeft jullie website veel karakter. Dit basislettertype wordt gebruikt voor paginatitels en de navigatie.",
    nav: { activeSection: 'algemeen', openAlgSection: 'lettertype' },
  },
  {
    label: "Stap 4 · Homepage",
    title: "De homepage — jullie visitekaartje 🏡",
    text: "Dit is het meest uitgebreide onderdeel. Een paar dingen hangen samen: kies je lay-out 'Modern', dan vervalt de kaderoptie. Kies je voor 'Kader', dan kun je een trouwkader kiezen met initialen, namen en datum. Voeg ook een headerfoto toe voor extra sfeer!",
    nav: { activeSection: 'paginas', openAlgSection: null, activeSubPage: 'Home', openHomeSection: 'layout' },
  },
  {
    label: "Stap 5 · Pagina's",
    title: "Welke pagina's wil je tonen? 📄",
    text: "Zet alleen de pagina's aan die jullie nodig hebben. Geen fotogalerij? Zet 'Foto's' gewoon uit. Het menu past zich automatisch aan. En natuurlijk — je kunt dit later altijd nog wijzigen.",
    nav: { activeSection: 'paginas', openAlgSection: null, activeSubPage: null, openHomeSection: null },
  },
]

const LS_DONE    = "sophie_done"
const LS_SKIPPED = "sophie_skipped"

function RingIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="6" />
      <path d="M12 6 C10 3 6 3 6 6" />
      <path d="M12 6 C14 3 18 3 18 6" />
    </svg>
  )
}

function StepDots({ total, current, onGo }: { total: number; current: number; onGo: (i: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onGo(i)}
          title={`Stap ${i + 1}`}
          style={{
            width: i === current ? 18 : 6,
            height: 6,
            borderRadius: 99,
            backgroundColor: i === current ? GOLD : GOLD_LIGHT,
            transition: "all 0.2s",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  )
}

function SophieHeader({ label }: { label?: string }) {
  return (
    <div
      className="px-5 py-3.5 flex items-center gap-3"
      style={{ background: `linear-gradient(135deg, ${GOLD_BG} 0%, #fffdf9 100%)`, borderBottom: `1px solid ${GOLD_LIGHT}` }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: GOLD, color: "#fff" }}
      >
        <RingIcon size={16} />
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.05rem", fontWeight: 600, color: CHARCOAL, letterSpacing: "0.02em", lineHeight: 1 }}>
          Sophie
        </p>
        {label && <p style={{ fontSize: "0.625rem", color: BODY, marginTop: 2 }}>{label}</p>}
        {!label && <p style={{ fontSize: "0.625rem", color: SUBTLE }}>Jullie persoonlijke wedding designer</p>}
      </div>
    </div>
  )
}

export default function SophieTutorial({ onNavigate }: Props) {
  const [phase, setPhase] = useState<'loading' | 'welcome' | 'tour' | 'done'>('loading')
  const [step, setStep]   = useState(0)

  useEffect(() => {
    const done    = localStorage.getItem(LS_DONE)
    const skipped = localStorage.getItem(LS_SKIPPED)
    setPhase(done || skipped ? 'done' : 'welcome')
  }, [])

  function goTo(i: number) {
    setStep(i)
    onNavigate(STEPS[i].nav)
  }

  function start() {
    setPhase('tour')
    setStep(0)
    onNavigate(STEPS[0].nav)
  }

  function skip() {
    localStorage.setItem(LS_SKIPPED, "1")
    setPhase('done')
  }

  function next() {
    if (step < STEPS.length - 1) {
      goTo(step + 1)
    } else {
      localStorage.setItem(LS_DONE, "1")
      setPhase('done')
    }
  }

  function restart() {
    localStorage.removeItem(LS_DONE)
    localStorage.removeItem(LS_SKIPPED)
    setStep(0)
    setPhase('tour')
    onNavigate(STEPS[0].nav)
  }

  const cardClass = "fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden"
  const cardStyle = { backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}` }

  if (phase === 'loading') return null

  // ── Small restart pill ───────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <button
        onClick={restart}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl"
        style={{ backgroundColor: "#fff", border: `1px solid ${GOLD_LIGHT}`, color: BODY }}
        title="Sophie opnieuw starten"
      >
        <span style={{ color: GOLD }}><RingIcon size={14} /></span>
        <span style={{ color: GOLD, fontFamily: "var(--font-cormorant)", fontSize: "0.9rem", fontWeight: 600 }}>Sophie</span>
      </button>
    )
  }

  // ── Welcome card ─────────────────────────────────────────────────────────────
  if (phase === 'welcome') {
    return (
      <div className={cardClass} style={cardStyle}>
        <SophieHeader />
        <div className="px-5 pt-4 pb-2">
          <p className="text-sm font-semibold mb-1.5" style={{ color: CHARCOAL }}>Hoi! Welkom in de builder 👋</p>
          <p className="text-xs leading-relaxed" style={{ color: BODY }}>
            Zullen we gelijk samen jullie droomwebsite neerzetten? Ik neem je in vijf stappen mee langs alle onderdelen — inclusief tips en uitleg.
          </p>
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: SUBTLE }}>
            Of wil je eerst even zelf rustig rondkijken? Je kunt mij later altijd opnieuw opstarten.
          </p>
        </div>
        <div className="px-5 pb-5 pt-3 flex flex-col gap-2">
          <button
            onClick={start}
            className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: GOLD, color: "#fff", boxShadow: "0 4px 14px rgba(197,160,89,0.3)" }}
          >
            Laten we beginnen! ✨
          </button>
          <button
            onClick={skip}
            className="w-full py-2 text-xs font-medium rounded-xl transition-colors hover:bg-gray-50"
            style={{ color: SUBTLE }}
          >
            Ik kijk zelf even rond
          </button>
        </div>
      </div>
    )
  }

  // ── Tour step card ────────────────────────────────────────────────────────────
  const current = STEPS[step]
  return (
    <div className={cardClass} style={cardStyle}>
      {/* Header met step-dots */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${GOLD_BG} 0%, #fffdf9 100%)`, borderBottom: `1px solid ${GOLD_LIGHT}` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOLD, color: "#fff" }}>
            <RingIcon size={14} />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", fontWeight: 600, color: CHARCOAL, letterSpacing: "0.02em", lineHeight: 1 }}>Sophie</p>
            <p style={{ fontSize: "0.6rem", color: BODY, marginTop: 2 }}>{current.label}</p>
          </div>
        </div>
        <StepDots total={STEPS.length} current={step} onGo={goTo} />
      </div>

      {/* Inhoud */}
      <div className="px-5 py-4">
        <p className="text-sm font-semibold mb-2" style={{ color: CHARCOAL }}>{current.title}</p>
        <p className="text-xs leading-relaxed" style={{ color: BODY }}>{current.text}</p>
        <p className="text-[10px] mt-3" style={{ color: GOLD_LIGHT }}>
          ✦ Alles wat je instelt kun je later altijd aanpassen.
        </p>
      </div>

      {/* Navigatie knoppen */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <button
          onClick={() => goTo(step - 1)}
          disabled={step === 0}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
          style={{
            color: step === 0 ? "transparent" : BODY,
            backgroundColor: step === 0 ? "transparent" : "#f5f5f5",
            pointerEvents: step === 0 ? "none" : "auto",
          }}
        >
          ← Vorige
        </button>
        <button onClick={skip} className="text-[10px] transition-opacity hover:opacity-50" style={{ color: "#ccc" }}>
          Sluiten
        </button>
        <button
          onClick={next}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: GOLD, color: "#fff" }}
        >
          {step === STEPS.length - 1 ? "Klaar! 🎉" : "Volgende →"}
        </button>
      </div>
    </div>
  )
}
