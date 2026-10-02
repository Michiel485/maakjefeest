import { ImageResponse } from "next/og"

// Het deelplaatje van de marketingsite: wat iemand ziet als hij sayingyes.nl
// deelt op WhatsApp of Instagram. Een kaart, geen stockfoto (ontwerpronde,
// ronde 7, 2 oktober 2026). Eerst stond hier een plaatje uit juli met "Jullie
// droom-trouwwebsite", de oude positionering. Getekend met vlakken, zodat er
// geen lettertype van buiten nodig is.

export const alt = "SayingYes: digitale trouwkaart en trouwwebsite"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "70px 90px",
          background: "linear-gradient(135deg, #FAF7F2 0%, #EDE6D8 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
          <div style={{ fontSize: 22, letterSpacing: 8, textTransform: "uppercase", color: "#C5A059", fontWeight: 700, marginBottom: 22 }}>SayingYes</div>
          <div style={{ fontSize: 62, lineHeight: 1.08, color: "#1A1A1A", fontWeight: 700 }}>Jullie trouwkaart, klaar in vijf minuten.</div>
          <div style={{ fontSize: 26, lineHeight: 1.4, color: "#5C5248", marginTop: 26 }}>Versturen via WhatsApp. Gasten reageren met één tik. Trouwwebsite erbij als je wilt.</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 330,
            height: 440,
            background: "#FFFDF9",
            border: "2px solid #C5A059",
            borderRadius: 10,
            boxShadow: "0 30px 60px rgba(0,0,0,0.18)",
            transform: "rotate(-4deg)",
            padding: 30,
          }}
        >
          <div style={{ fontSize: 14, letterSpacing: 5, textTransform: "uppercase", color: "#C5A059", fontWeight: 700 }}>Wij gaan trouwen</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0" }}>
            <div style={{ width: 40, height: 1, background: "#C5A059" }} />
            <div style={{ width: 7, height: 7, background: "#C5A059", transform: "rotate(45deg)" }} />
            <div style={{ width: 40, height: 1, background: "#C5A059" }} />
          </div>
          <div style={{ fontSize: 46, color: "#1A1A1A", textAlign: "center", lineHeight: 1.1 }}>Sophie &amp; Daan</div>
          <div style={{ fontSize: 18, letterSpacing: 4, color: "#C5A059", marginTop: 20 }}>12 · 06 · 2027</div>
          <div style={{ fontSize: 16, color: "#5C5248", marginTop: 8 }}>Landgoed Duno</div>
          <div style={{ marginTop: 34, padding: "12px 26px", borderRadius: 999, background: "#C5A059", color: "#FFFFFF", fontSize: 16, fontWeight: 700 }}>Ben je erbij?</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
