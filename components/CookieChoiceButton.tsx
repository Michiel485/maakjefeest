"use client"

// AVG: toestemming intrekken moet net zo makkelijk zijn als toestemming geven.
// Wist de keuze en laadt de pagina opnieuw, zodat de cookiebanner weer verschijnt.
export default function CookieChoiceButton() {
  function opnieuwKiezen() {
    try {
      localStorage.removeItem("cookie_consent")
    } catch {}
    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={opnieuwKiezen}
      className="mt-3 inline-flex text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: "#C5A059", color: "#fff", border: "none", cursor: "pointer" }}
    >
      Cookiekeuze wijzigen
    </button>
  )
}
