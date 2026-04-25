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
}: {
  title: string
  pages: NavPage[]
  sc: SC
}) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1]

  function isActive(type: string) {
    if (type === "home") {
      // active on "/" or "/events/slug" (no sub-type segment)
      return segments.length <= 2 || lastSegment === segments[1]
    }
    return lastSegment === type
  }

  return (
    // Full-width header — background spans edge to edge
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 30,
      width: "100%",
      backgroundColor: sc.navBg,
      borderBottom: `1px solid ${sc.accent}22`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Centered content container */}
      <div style={{
        maxWidth: 1152,
        margin: "0 auto",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo — left side */}
        <a
          href="/"
          style={{
            fontSize: "0.9375rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: sc.accent,
            fontFamily: sc.fontFamily,
            textDecoration: "none",
            flexShrink: 0,
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </a>

        {/* Nav links — right side */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {pages.map((page) => {
            const active = isActive(page.type)
            return (
              <a
                key={page.type}
                href={page.type === "home" ? "/" : `/${page.type}`}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: active ? 700 : 600,
                  color: active ? sc.accent : sc.navText,
                  padding: "5px 10px",
                  borderRadius: 8,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  backgroundColor: active ? `${sc.accent}14` : "transparent",
                  transition: "background-color 0.15s",
                }}
              >
                {page.title}
              </a>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
