"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import LanguageSwitcher from "@/components/LanguageSwitcher"

interface NavPage {
  type: string
  title: string
}

interface SC {
  accent: string
  navBg: string
  navText: string
  fontFamily: string
  floral?: boolean
  fontFrameNames?: string
  fontFrameNamesWeight?: number
}

export default function EventNav({
  title,
  pages,
  sc,
  navLayout = "split",
  basePath = "",
  onNavigate,
  activeType,
}: {
  title: string
  pages: NavPage[]
  sc: SC
  navLayout?: "stacked" | "split" | "left"
  basePath?: string
  onNavigate?: (type: string) => void
  activeType?: string
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const safeTitle = title.replace(/\n/g, " ")

  const homeHref = basePath || "/"

  function isActive(type: string) {
    if (activeType !== undefined) return type === activeType
    if (type === "Home") return pathname === homeHref || pathname === basePath
    return pathname === `${basePath}/${type}`
  }

  function pageHref(type: string) {
    return type === "Home" ? homeHref : `${basePath}/${type}`
  }

  const navStyle: React.CSSProperties = {
    backgroundColor: `${sc.navBg}f2`,
    borderColor: `${sc.accent}20`,
    fontFamily: sc.fontFamily,
  }

  const pageLinkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: sc.floral ? "1rem" : "0.8125rem",
    fontWeight: 600,
    color: active ? sc.accent : sc.navText,
    padding: "5px 12px",
    borderRadius: 8,
    textDecoration: "none",
    whiteSpace: "nowrap",
    backgroundColor: active ? `${sc.accent}15` : "transparent",
  })

  const titleStyle: React.CSSProperties = {
    fontSize: sc.floral ? "1.25rem" : "0.9375rem",
    fontWeight: sc.fontFrameNamesWeight ?? 800,
    letterSpacing: sc.floral ? "0.01em" : "-0.02em",
    fontFamily: sc.fontFrameNames ?? sc.fontFamily,
    color: sc.navText,
    textDecoration: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }

  const pageLinks = pages.map((page) => (
    <a
      key={page.type}
      href={pageHref(page.type)}
      onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate(page.type) } : undefined}
      style={pageLinkStyle(isActive(page.type))}
    >
      {page.title}
    </a>
  ))

  const rightControls = (
    <div className="flex items-center gap-2 flex-shrink-0">
      <LanguageSwitcher accent={sc.accent} textColor={sc.navText} bgColor={sc.navBg} />
      <button
        className="@md:hidden flex flex-col justify-center items-center gap-1.5 p-1 rounded-lg transition-colors"
        style={{ color: sc.navText }}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Menu"
      >
        {menuOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
    </div>
  )

  // ── Stacked layout: title centered above links ──────────────────────────────
  if (navLayout === "stacked") {
    return (
      <div className="@container">
        <nav className="sticky top-0 z-50 px-8 border-b backdrop-blur-sm" style={navStyle}>
          {/* Mobile row */}
          <div className="flex items-center justify-between py-4 gap-4 @md:hidden">
            <a href={homeHref} onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("Home") } : undefined} style={titleStyle}>
              {safeTitle}
            </a>
            {rightControls}
          </div>
          {/* Desktop: title + links in a centered column, lang switcher top-right */}
          <div className="hidden @md:flex flex-col items-center gap-2 py-5 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <LanguageSwitcher accent={sc.accent} textColor={sc.navText} bgColor={sc.navBg} />
            </div>
            <a href={homeHref} onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("Home") } : undefined} style={{ ...titleStyle, textAlign: "center" }}>
              {safeTitle}
            </a>
            <div className="flex items-center flex-wrap justify-center gap-1">
              {pageLinks}
            </div>
          </div>
        </nav>
        {menuOpen && (
          <div
            className="@md:hidden border-b px-6 py-3 flex flex-col gap-1"
            style={{ backgroundColor: `${sc.navBg}f2`, borderColor: `${sc.accent}20`, fontFamily: sc.fontFamily }}
            onClick={() => setMenuOpen(false)}
          >
            {pageLinks}
          </div>
        )}
      </div>
    )
  }

  // ── Split + Left layouts: title row on top, links row below ─────────────────
  // This two-row structure means link text length (including after translation)
  // can never push controls off screen or cause partial-wrap ugliness.
  const linksJustify = navLayout === "left" ? "justify-start" : "justify-center"

  return (
    <div className="@container">
      <nav className="sticky top-0 z-50 px-8 border-b backdrop-blur-sm" style={navStyle}>

        {/* Row 1: title (left) + language switcher + hamburger (right) */}
        <div className="flex items-center justify-between gap-4 py-4">
          <a
            href={homeHref}
            onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("Home") } : undefined}
            style={titleStyle}
          >
            {safeTitle}
          </a>
          {rightControls}
        </div>

        {/* Row 2: page links — desktop only, sits just below the title strip */}
        <div className={`hidden @md:flex items-center flex-wrap gap-1 pb-3 ${linksJustify}`}>
          {pageLinks}
        </div>

      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="@md:hidden border-b px-6 py-3 flex flex-col gap-1"
          style={{ backgroundColor: `${sc.navBg}f2`, borderColor: `${sc.accent}20`, fontFamily: sc.fontFamily }}
          onClick={() => setMenuOpen(false)}
        >
          {pageLinks}
        </div>
      )}
    </div>
  )
}
