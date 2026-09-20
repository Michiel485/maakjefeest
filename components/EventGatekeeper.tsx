"use client"

import { useState, useEffect, useCallback } from "react"
import type { SC } from "@/lib/event-styles"

// Let op wat hier NIET in staat: het wachtwoord en het antwoord op de geheime
// vraag. Die werden eerder als prop meegegeven en stonden daarmee in de
// broncode van de pagina, zichtbaar voor iedereen die op "bron weergeven"
// drukte. De controle gebeurt nu op de server, zie app/api/event-toegang.
interface EventGatekeeperProps {
  slug: string
  pwEnabled: boolean
  pwType: "password" | "secret_question" | null
  pwQuestion: string | null
  sc: SC
  eventTitle: string
  children: React.ReactNode
}

const SESSION_KEY = (slug: string) => `sy_unlocked_${slug}`

export default function EventGatekeeper({
  slug,
  pwEnabled,
  pwType,
  pwQuestion,
  sc,
  eventTitle,
  children,
}: EventGatekeeperProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [checked, setChecked] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    if (!pwEnabled) { setUnlocked(true); setChecked(true); return }
    try {
      if (sessionStorage.getItem(SESSION_KEY(slug)) === "1") {
        setUnlocked(true)
      }
    } catch {}
    setChecked(true)
  }, [slug, pwEnabled])

  const handleSubmit = useCallback(async () => {
    setError(null)
    const val = inputValue.trim()
    if (!val || bezig) return

    setBezig(true)
    let correct = false
    let teVeel = false
    try {
      const r = await fetch("/api/event-toegang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, antwoord: val }),
      })
      teVeel = r.status === 429
      correct = r.ok && ((await r.json()) as { ok?: boolean }).ok === true
    } catch {
      setError("Even geen verbinding. Probeer het zo nog eens.")
      setBezig(false)
      return
    }
    setBezig(false)

    if (correct) {
      try { sessionStorage.setItem(SESSION_KEY(slug), "1") } catch {}
      setUnlocked(true)
      return
    }

    setShaking(true)
    setTimeout(() => setShaking(false), 500)
    setError(
      teVeel
        ? "Te veel pogingen achter elkaar. Wacht even en probeer het opnieuw."
        : pwType === "password"
          ? "Dat wachtwoord klopt niet. Probeer het opnieuw."
          : "Dat antwoord klopt niet helemaal. Probeer het opnieuw."
    )
  }, [inputValue, pwType, slug, bezig])

  // Not yet checked → render nothing to avoid flash
  if (!checked) return null

  if (unlocked) return <>{children}</>

  return (
    <>
      <style>{`
        @keyframes sy-shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }
        .sy-shake { animation: sy-shake 0.45s ease; }
        @keyframes sy-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sy-fadein { animation: sy-fadein 0.5s ease both; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center px-4 py-16"
        style={{ background: sc.bodyBackground ?? sc.bodyBg ?? sc.navBg, fontFamily: sc.fontFamily }}
      >
        <div className="sy-fadein w-full max-w-sm flex flex-col items-center gap-8">

          {/* Event title */}
          <div className="text-center">
            <p
              className="text-4xl sm:text-5xl leading-tight"
              style={{ fontFamily: sc.fontPageTitles, color: sc.headingColor, fontWeight: sc.fontPageTitlesWeight }}
            >
              {eventTitle}
            </p>
            <div className="mt-4 w-12 h-[2px] mx-auto rounded-full" style={{ backgroundColor: sc.accent }} />
          </div>

          {/* Lock icon */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${sc.accent}18`, border: `1.5px solid ${sc.accent}40` }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={sc.accent} strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Card */}
          <div
            className="w-full rounded-2xl px-6 py-7 flex flex-col gap-5"
            style={{
              backgroundColor: sc.cardBg ?? sc.navBg,
              border: sc.goldBorder ? `2px solid ${sc.accent}` : `1px solid ${sc.accent}20`,
              boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
            }}
          >
            {pwType === "secret_question" && pwQuestion && (
              <p
                className="text-sm font-semibold text-center leading-snug"
                style={{ color: sc.headingColor }}
              >
                {pwQuestion}
              </p>
            )}

            {pwType === "password" && (
              <p className="text-sm text-center" style={{ color: sc.bodyText }}>
                Deze pagina is beveiligd. Voer het wachtwoord in om verder te gaan.
              </p>
            )}

            <div className={shaking ? "sy-shake" : ""}>
              <input
                type={pwType === "password" ? "password" : "text"}
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setError(null) }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={pwType === "password" ? "Wachtwoord..." : "Jouw antwoord..."}
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  border: `1.5px solid ${error ? "#ef4444" : sc.accent}40`,
                  color: sc.bodyText ?? "#1a1a1a",
                  backgroundColor: sc.bodyBackground ?? "#fff",
                  fontFamily: sc.fontFamily,
                }}
                onFocus={(e) => { e.target.style.borderColor = sc.accent }}
                onBlur={(e) => { e.target.style.borderColor = error ? "#ef444440" : `${sc.accent}40` }}
              />
              {error && (
                <p className="mt-2 text-xs text-center" style={{ color: "#ef4444" }}>
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 active:scale-[0.98]"
              style={{ backgroundColor: sc.accent, color: "#fff" }}
            >
              {pwType === "password" ? "Toegang krijgen" : "Bevestigen"}
            </button>
          </div>

          <p className="text-xs text-center" style={{ color: sc.bodyText, opacity: 0.45 }}>
            Gemaakt met <span style={{ fontWeight: 600, color: sc.accent }}>SayingYes</span>
          </p>
        </div>
      </div>
    </>
  )
}
