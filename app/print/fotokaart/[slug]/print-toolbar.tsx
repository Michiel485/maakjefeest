"use client"

import Link from "next/link"

export default function PrintToolbar({ slug, paperSize }: { slug: string; paperSize: "A4" | "A5" }) {
  return (
    <div
      className="no-print sticky top-0 z-10 flex items-center justify-center gap-3 px-4 py-3"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      <span className="text-sm font-medium" style={{ color: "#FAF7F2" }}>Formaat:</span>
      {(["A5", "A4"] as const).map((s) => (
        <Link
          key={s}
          href={`/print/fotokaart/${slug}${s === "A4" ? "?size=a4" : ""}`}
          className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            backgroundColor: paperSize === s ? "#C5A059" : "transparent",
            color: paperSize === s ? "#1A1A1A" : "#FAF7F2",
            border: `1px solid ${paperSize === s ? "#C5A059" : "#5C5248"}`,
          }}
        >
          {s}
        </Link>
      ))}
      <button
        onClick={() => window.print()}
        className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-opacity hover:opacity-85"
        style={{ backgroundColor: "#C5A059", color: "#1A1A1A", border: "none", cursor: "pointer" }}
      >
        🖨️ Printen / Opslaan als PDF
      </button>
    </div>
  )
}
