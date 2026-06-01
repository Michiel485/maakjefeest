"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate: {
        TranslateElement: new (
          config: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          elementId: string
        ) => void
      }
    }
  }
}

const LANGS = [
  { code: "nl", label: "NL", name: "Nederlands" },
  { code: "en", label: "EN", name: "English" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "es", label: "ES", name: "Español" },
  { code: "it", label: "IT", name: "Italiano" },
]

const LS_KEY = "gt-lang"

interface Props {
  accent?: string
  textColor?: string
  bgColor?: string
}

export default function LanguageSwitcher({
  accent = "#9B8B5A",
  textColor = "#2D2926",
  bgColor = "#FFFFFF",
}: Props) {
  // Lazy initialiser — reads localStorage so the label survives Google Translate's
  // DOM rewrites which can remount this component and reset plain useState.
  const [current, setCurrent] = useState(() => {
    if (typeof window === "undefined") return LANGS[0]
    const saved = localStorage.getItem(LS_KEY)
    return LANGS.find((l) => l.code === saved) ?? LANGS[0]
  })
  const [open, setOpen] = useState(false)
  const containerRef  = useRef<HTMLDivElement>(null)
  const originalTitle = useRef("")

  useEffect(() => {
    // Protect the browser tab title — Google Translate rewrites document.title;
    // watch the <title> element and immediately restore the original value.
    originalTitle.current = document.title
    const titleEl = document.querySelector("title")
    if (titleEl) {
      const mo = new MutationObserver(() => {
        if (document.title !== originalTitle.current) {
          document.title = originalTitle.current
        }
      })
      mo.observe(titleEl, { childList: true, subtree: true, characterData: true })
    }

    // Inject hidden Google Translate mount point once
    if (!document.getElementById("google_translate_element")) {
      const el = document.createElement("div")
      el.id = "google_translate_element"
      document.body.appendChild(el)
    }

    // Must be defined before the script loads
    window.googleTranslateElementInit = () => {
      new window.google!.translate.TranslateElement(
        { pageLanguage: "nl", includedLanguages: "nl,en,de,fr,es,it", autoDisplay: false },
        "google_translate_element"
      )
    }

    if (!document.getElementById("google-translate-script")) {
      const s = document.createElement("script")
      s.id = "google-translate-script"
      s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      s.async = true
      document.head.appendChild(s)
    }

    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onOutsideClick)
    return () => document.removeEventListener("mousedown", onOutsideClick)
  }, [])

  function fireCombo(combo: HTMLSelectElement, value: string) {
    combo.value = value
    combo.dispatchEvent(new Event("change", { bubbles: true }))
    combo.dispatchEvent(new Event("input",  { bubbles: true }))
  }

  function triggerTranslate(code: string) {
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
    if (!combo) return

    if (code === "nl") {
      // Clear the googtrans cookie so GT knows the page is already in its base language.
      const host = window.location.hostname
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host}`

      // Triple-fire to shake loose any partially-translated state.
      fireCombo(combo, "")
      setTimeout(() => fireCombo(combo, "nl"), 50)
      setTimeout(() => fireCombo(combo, "nl"), 200)
    } else {
      fireCombo(combo, code)
      setTimeout(() => fireCombo(combo, code), 50)
      setTimeout(() => fireCombo(combo, code), 200)
    }
  }

  function selectLang(lang: (typeof LANGS)[number]) {
    setCurrent(lang)
    setOpen(false)
    localStorage.setItem(LS_KEY, lang.code)
    window.dispatchEvent(new CustomEvent("gt-lang-changed", { detail: lang.code }))
    triggerTranslate(lang.code)
  }

  return (
    <div ref={containerRef} translate="no" style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          background: "none",
          border: `1px solid ${accent}50`,
          borderRadius: "8px",
          padding: "4px 9px",
          cursor: "pointer",
          color: textColor,
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          lineHeight: 1,
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = accent
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}50`
        }}
      >
        {current.label}
        {/* Chevron */}
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: "152px",
            backgroundColor: bgColor,
            border: `1px solid ${accent}30`,
            borderRadius: "12px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          {LANGS.map((lang) => {
            const active = lang.code === current.code
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={active}
                onClick={() => selectLang(lang)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "9px 14px",
                  background: active ? `${accent}18` : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: active ? accent : textColor,
                  fontSize: "0.8125rem",
                  fontWeight: active ? 700 : 500,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = `${accent}10`
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: active ? accent : `${textColor}70`,
                    minWidth: "20px",
                  }}
                >
                  {lang.label}
                </span>
                {lang.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
