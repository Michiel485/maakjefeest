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
}

export default function EventNav({
  title,
  pages,
  sc,
  navLayout = "split",
  basePath = "",
  onNavigate,
}: {
  title: string
  pages: NavPage[]
  sc: SC
  navLayout?: "stacked" | "split" | "left"
  basePath?: string
  onNavigate?: (type: string) => void
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const safeTitle = title.replace(/\n/g, " ")

  const homeHref = basePath || "/"

  function isActive(type: string) {
    if (type === "home") return pathname === homeHref || pathname === basePath
    return pathname === `${basePath}/${type}`
  }

  function pageHref(type: string) {
    return type === "home" ? homeHref : `${basePath}/${type}`
  }

  const titleStyle: React.CSSProperties = {
    fontSize: sc.floral ? "1.25rem" : "0.9375rem",
    fontWeight: 800,
    letterSpacing: sc.floral ? "0.01em" : "-0.02em",
    color: sc.accent,
    textDecoration: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: sc.floral ? "260px" : "200px",
  }

  const titleLink = (
    <a
      href={homeHref}
      onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("home") } : undefined}
      className="flex-shrink-0"
      style={titleStyle}
    >
      {safeTitle}
    </a>
  )

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

  const navBase = "sticky top-0 z-50 px-8 border-b backdrop-blur-sm"
  const navStyle: React.CSSProperties = {
    backgroundColor: `${sc.navBg}f2`,
    borderColor: `${sc.accent}20`,
    fontFamily: sc.fontFamily,
  }

  const hamburgerBtn = (
    <button
      className="md:hidden flex flex-col justify-center items-center gap-1.5 p-1 rounded-lg transition-colors"
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
  )

  const mobileDropdown = menuOpen && (
    <div
      className="md:hidden border-b px-6 py-3 flex flex-col gap-1"
      style={{ backgroundColor: `${sc.navBg}f2`, borderColor: `${sc.accent}20`, fontFamily: sc.fontFamily }}
      onClick={() => setMenuOpen(false)}
    >
      {pageLinks}
    </div>
  )

  if (navLayout === "left") {
    return (
      <>
        <nav className={`${navBase} py-4 flex items-center gap-6`} style={navStyle}>
          {titleLink}
          <div className="hidden md:flex items-center flex-wrap gap-1">
            {pageLinks}
          </div>
          <div className="ml-auto md:hidden">{hamburgerBtn}</div>
        </nav>
        {mobileDropdown}
      </>
    )
  }

  if (navLayout === "split") {
    return (
      <>
        <nav className={`${navBase} py-4 flex items-center justify-between gap-4`} style={navStyle}>
          {titleLink}
          <div className="hidden md:flex items-center flex-wrap justify-end gap-1">
            {pageLinks}
          </div>
          {hamburgerBtn}
        </nav>
        {mobileDropdown}
      </>
    )
  }

  return (
    <>
      <nav className={`${navBase} py-5 flex flex-col items-center gap-2`} style={navStyle}>
        <div className="w-full flex items-center justify-between md:justify-center">
          <a
            href={homeHref}
            onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("home") } : undefined}
            className="text-center"
            style={{
              fontSize: sc.floral ? "1.25rem" : "0.9375rem",
              fontWeight: 800,
              letterSpacing: sc.floral ? "0.01em" : "-0.02em",
              color: sc.accent,
              textDecoration: "none",
            }}
          >
            {safeTitle}
          </a>
          <div className="md:hidden">{hamburgerBtn}</div>
        </div>
        <div className="hidden md:flex items-center flex-wrap justify-center gap-1">
          {pageLinks}
        </div>
      </nav>
      {mobileDropdown}
    </>
  )
}
