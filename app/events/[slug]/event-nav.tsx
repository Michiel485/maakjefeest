"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"

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

  // ── Desktop nav extras — only @md: so mobile base is never overridden ──────
  const desktopNavClass =
    navLayout === "stacked"
      ? "@md:flex-col @md:items-center @md:gap-2 @md:py-5"
      : navLayout === "left"
      ? "@md:justify-start @md:gap-6"
      : "" // split: justify-between already in mobile base

  const desktopLinksClass =
    navLayout === "stacked"
      ? "hidden @md:flex items-center flex-wrap justify-center gap-1 @md:w-full"
      : navLayout === "left"
      ? "hidden @md:flex items-center flex-wrap gap-1"
      : "hidden @md:flex items-center flex-wrap justify-end gap-1" // split

  // Title maxWidth — stacked desktop should be unrestricted for centering
  const titleMaxWidth =
    navLayout === "stacked" ? "none" : sc.floral ? "260px" : "200px"

  const titleStyle: React.CSSProperties = {
    fontSize: sc.floral ? "1.25rem" : "0.9375rem",
    fontWeight: sc.fontFrameNamesWeight ?? 800,
    letterSpacing: sc.floral ? "0.01em" : "-0.02em",
    fontFamily: sc.fontFrameNames ?? sc.fontFamily,
    color: sc.accent,
    textDecoration: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: titleMaxWidth,
  }

  return (
    <div className="@container">
      {/* ── Nav bar — mobile: always flex-row justify-between ── */}
      <nav
        className={`sticky top-0 z-50 px-8 border-b backdrop-blur-sm py-4 flex flex-row items-center justify-between gap-4 ${desktopNavClass}`}
        style={navStyle}
      >
        {/* Title — always left on mobile; centered only on stacked desktop */}
        <a
          href={homeHref}
          onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("Home") } : undefined}
          className={`flex-shrink-0 ${navLayout === "stacked" ? "@md:w-full @md:text-center" : ""}`}
          style={titleStyle}
        >
          {safeTitle}
        </a>

        {/* Desktop nav links — hidden on mobile, layout set by @md: only */}
        <div className={desktopLinksClass}>
          {pageLinks}
        </div>

        {/* Hamburger — mobile only, hidden on desktop */}
        <button
          className="@md:hidden flex-shrink-0 flex flex-col justify-center items-center gap-1.5 p-1 rounded-lg transition-colors"
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
      </nav>

      {/* Mobile dropdown — @md:hidden so it never shows on desktop */}
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
