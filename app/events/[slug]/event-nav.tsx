"use client"

import { usePathname } from "next/navigation"

interface NavPage {
  type: string
  title: string
}

interface SC {
  accent: string
  navBg: string
  navText: string
  fontFamily: string
}

export default function EventNav({
  title,
  pages,
  sc,
  navLayout = "split",
  onNavigate,
}: {
  title: string
  pages: NavPage[]
  sc: SC
  navLayout?: "stacked" | "split" | "left"
  onNavigate?: (type: string) => void
}) {
  const pathname = usePathname()

  function isActive(type: string) {
    if (type === "home") return pathname === "/"
    return pathname === `/${type}`
  }

  const titleLink = (
    <a
      href="/"
      onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("home") } : undefined}
      className="flex-shrink-0"
      style={{
        fontSize: "0.9375rem",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: sc.accent,
        textDecoration: "none",
      }}
    >
      {title}
    </a>
  )

  const pageLinks = pages.map((page) => {
    const active = isActive(page.type)
    return (
      <a
        key={page.type}
        href={page.type === "home" ? "/" : `/${page.type}`}
        onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate(page.type) } : undefined}
        style={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: active ? sc.accent : sc.navText,
          padding: "5px 12px",
          borderRadius: 8,
          textDecoration: "none",
          whiteSpace: "nowrap",
          backgroundColor: active ? `${sc.accent}15` : "transparent",
        }}
      >
        {page.title}
      </a>
    )
  })

  const navBase = "sticky top-0 z-50 px-8 border-b backdrop-blur-sm"
  const navStyle = {
    backgroundColor: `${sc.navBg}f2`,
    borderColor: `${sc.accent}20`,
    fontFamily: sc.fontFamily,
  }

  if (navLayout === "left") {
    return (
      <nav className={`${navBase} py-4 flex items-center gap-6 flex-wrap`} style={navStyle}>
        {titleLink}
        <div className="flex items-center flex-wrap gap-1">
          {pageLinks}
        </div>
      </nav>
    )
  }

  if (navLayout === "split") {
    return (
      <nav className={`${navBase} py-4 flex items-center justify-between gap-4`} style={navStyle}>
        {titleLink}
        <div className="flex items-center flex-wrap justify-end gap-1">
          {pageLinks}
        </div>
      </nav>
    )
  }

  return (
    <nav className={`${navBase} py-5 flex flex-col items-center gap-2`} style={navStyle}>
      <a
        href="/"
        onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate("home") } : undefined}
        className="text-center"
        style={{
          fontSize: "0.9375rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: sc.accent,
          textDecoration: "none",
        }}
      >
        {title}
      </a>
      <div className="flex items-center flex-wrap justify-center gap-1">
        {pageLinks}
      </div>
    </nav>
  )
}
