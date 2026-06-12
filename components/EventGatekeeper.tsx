"use client"

import { useState, useEffect, useCallback } from "react"
import type { SC } from "@/lib/event-styles"

interface EventGatekeeperProps {
  slug: string
  pwEnabled: boolean
  pwType: "password" | "secret_question" | null
  pwValue: string | null
  pwQuestion: string | null
  pwAnswer: string | null
  sc: SC
  eventTitle: string
  children: React.ReactNode
}

// Normalize a string for fuzzy comparison: lowercase, strip spaces, remove punctuation
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[&\-_,;:.!?'"()/\\]/g, " ")
    .replace(/\s+/g, "")
}

// Levenshtein distance between two strings
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

// Returns true when input matches answer with ≥90% similarity
function fuzzyMatch(input: string, answer: string): boolean {
  const a = normalize(input)
  const b = normalize(answer)
  if (a === b) return true
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return true
  const dist = levenshtein(a, b)
  return (maxLen - dist) / maxLen >= 0.9
}

const SESSION_KEY = (slug: string) => `sy_unlocked_${slug}`

export default function EventGatekeeper({
  slug,
  pwEnabled,
  pwType,
  pwValue,
  pwQuestion,
  pwAnswer,
  sc,
  eventTitle,
  children,
}: EventGatekeeperProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [checked, setChecked] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (!pwEnabled) { setUnlocked(true); setChecked(true); return }
    try {
      if (sessionStorage.getItem(SESSION_KEY(slug)) === "1") {
        setUnlocked(true)
      }
    } catch {}
    setChecked(true)
  }, [slug, pwEnabled])

  const handleSubmit = useCallback(() => {
    setError(null)
    const val = inputValue.trim()
    if (!val) return

    let correct = false
    if (pwType === "password") {
      correct = val === (pwValue ?? "")
    } else {
      correct = fuzzyMatch(val, pwAnswer ?? "")
    }

    if (correct) {
      try { sessionStorage.setItem(SESSION_KEY(slug), "1") } catch {}
      setUnlocked(true)
    } else {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      setError(pwType === "password"
        ? "Dat wachtwoord klopt niet. Probeer het opnieuw."
        : "Dat antwoord klopt niet helemaal. Probeer het opnieuw.")
    }
  }, [inputValue, pwType, pwValue, pwAnswer, slug])

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
