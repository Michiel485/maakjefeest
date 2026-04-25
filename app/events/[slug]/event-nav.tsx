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
    if (type === "home") return segments.length <= 2 || lastSegment === segments[1]
    return lastSegment === type
  }

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 30,
      backgroundColor: sc.navBg,
      borderBottom: `1px solid ${sc.accent}22`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        padding: "14px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo — left */}
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
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </a>

        {/* Nav links — right */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
