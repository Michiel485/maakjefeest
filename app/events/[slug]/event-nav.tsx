"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useUILocale } from "@/hooks/useUILocale"
import { getUILabel, PAGE_TYPE_TO_KEY } from "@/lib/ui-translations"

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
  const locale = useUILocale()
  const [menuOpen, setMenuOpen] = useState(false)
  // linksBelow: true = links on row 2 (not enough space for single row)
  const [linksBelow, setLinksBelow] = useState(false)
  const safeTitle = title.replace(/\n/g, " ")

  const navRef    = useRef<HTMLElement>(null)
  const titleRef  = useRef<HTMLAnchorElement>(null)
  const linksRef  = useRef<HTMLDivElement>(null)
  const ctrlRef   = useRef<HTMLDivElement>(null)

  const homeHref = basePath || "/"

  function isActive(type: string) {
    if (activeType !== undefined) return type === activeType
    if (type === "Home") return pathname === homeHref || pathname === basePath
    return pathname === `${basePath}/${type}`
  }

  function pageHref(type: string) {
    return type === "Home" ? homeHref : `${basePath}/${type}`
  }

  // Measure whether all links fit alongside the title and controls on one row.
  // Each link has white-space:nowrap so its scrollWidth = its own natural width.
  function checkOverflow() {
    const nav  = navRef.current
    const ttl  = titleRef.current
    const lnks = linksRef.current
    const ctrl = ctrlRef.current
    if (!nav || !ttl || !lnks || !ctrl) return

    const padding  = 64  // px-8 on both sides
    const gaps     = 32  // gaps between title / links / controls

    const titleW   = ttl.scrollWidth
    const ctrlW    = ctrl.scrollWidth

    // Sum each link's natural (no-wrap) width + gap-1 (4px) between them
    const linkEls  = Array.from(lnks.children) as HTMLElement[]
    const linksW   = linkEls.reduce((s, el) => s + el.scrollWidth, 0)
                   + Math.max(0, linkEls.length - 1) * 4

    const needed = padding + titleW + gaps + linksW + ctrlW
    setLinksBelow(needed > nav.offsetWidth)
  }

  useEffect(() => {
    checkOverflow()

    const ro = new ResizeObserver(checkOverflow)
    if (navRef.current) ro.observe(navRef.current)

    // Re-check when Google Translate rewrites link text
    const mo = new MutationObserver(checkOverflow)
    if (linksRef.current) {
      mo.observe(linksRef.current, { subtree: true, characterData: true, childList: true })
    }

    return () => { ro.disconnect(); mo.disconnect() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages])

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

  const pageLinks = pages.map((page) => {
    const key = PAGE_TYPE_TO_KEY[page.type]
    const label = key ? getUILabel(locale, key) : page.title
    return (
      <a
        key={page.type}
        href={pageHref(page.type)}
        onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate(page.type) } : undefined}
        style={pageLinkStyle(isActive(page.type))}
      >
        {label}
      </a>
    )
  })

  const linksJustify = navLayout === "left" ? "justify-start" : "justify-center"

  // ── Stacked layout: title centered above links ────────────────────────────
  if (navLayout === "stacked") {
    return (
      <div className="@container">
        <nav className="notranslate sticky top-0 z-50 px-8 border-b backdrop-blur-sm" style={navStyle}>
          {/* Mobile row */}
          <div className="flex items-center justify-between py-4 gap-4 @md:hidden">
            <a href={homeHref} onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("Home") } : undefined} style={titleStyle}>
              {safeTitle}
            </a>
            <div className="flex items-center gap-2 flex-shrink-0">
              <LanguageSwitcher accent={sc.accent} textColor={sc.navText} bgColor={sc.navBg} />
              <button
                className="flex flex-col justify-center items-center gap-1.5 p-1 rounded-lg"
                style={{ color: sc.navText }}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu"
              >
                {menuOpen
                  ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                }
              </button>
            </div>
          </div>
          {/* Desktop: column */}
          <div className="hidden @md:flex flex-col items-center gap-2 py-5 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <LanguageSwitcher accent={sc.accent} textColor={sc.navText} bgColor={sc.navBg} />
            </div>
            <a href={homeHref} onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("Home") } : undefined} style={{ ...titleStyle, textAlign: "center" }}>
              {safeTitle}
            </a>
            <div className="flex items-center flex-wrap justify-center gap-1">{pageLinks}</div>
          </div>
        </nav>
        {menuOpen && (
          <div className="notranslate @md:hidden border-b px-6 py-3 flex flex-col gap-1" style={{ backgroundColor: `${sc.navBg}f2`, borderColor: `${sc.accent}20`, fontFamily: sc.fontFamily }} onClick={() => setMenuOpen(false)}>
            {pageLinks}
          </div>
        )}
      </div>
    )
  }

  // ── Split + Left layouts ──────────────────────────────────────────────────
  // linksBelow=false → single row: [title][links][controls]
  // linksBelow=true  → two rows:   [title][controls] / [links]
  return (
    <div className="@container">
      <nav ref={navRef} className="notranslate sticky top-0 z-50 px-8 border-b backdrop-blur-sm" style={navStyle}>

        {/* Top strip: title + (links when single-row) + controls */}
        <div className="flex items-center justify-between gap-4 py-4">
          <a
            ref={titleRef}
            href={homeHref}
            onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("Home") } : undefined}
            style={titleStyle}
          >
            {safeTitle}
          </a>

          {/* Links inline — shown on desktop only when they fit on one row */}
          <div
            ref={linksRef}
            className={`hidden @md:flex flex-1 items-center flex-nowrap gap-1 ${linksJustify} ${linksBelow ? "invisible absolute" : ""}`}
          >
            {pageLinks}
          </div>

          {/* Controls: language switcher + hamburger */}
          <div ref={ctrlRef} className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher accent={sc.accent} textColor={sc.navText} bgColor={sc.navBg} />
            <button
              className="@md:hidden flex flex-col justify-center items-center gap-1.5 p-1 rounded-lg transition-colors"
              style={{ color: sc.navText }}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              {menuOpen
                ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>

        {/* Links below strip — only rendered when they don't fit on one row */}
        {linksBelow && (
          <div className={`hidden @md:flex flex-wrap pb-3 gap-1 ${linksJustify}`}>
            {pageLinks}
          </div>
        )}

      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="notranslate @md:hidden border-b px-6 py-3 flex flex-col gap-1" style={{ backgroundColor: `${sc.navBg}f2`, borderColor: `${sc.accent}20`, fontFamily: sc.fontFamily }} onClick={() => setMenuOpen(false)}>
          {pageLinks}
        </div>
      )}
    </div>
  )
}
